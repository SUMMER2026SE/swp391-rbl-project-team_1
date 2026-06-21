import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../prisma/client';
import { z } from 'zod';
import { ApiError } from '../utils/apiError';
import { recalculate } from '../services/risk.service';
import { evaluatePomodoroBadges, evaluateStreakBadges } from '../services/badge.service';
import { logActivity } from '../services/activity.service';

const startSessionSchema = z.object({
  taskId: z.string().optional(),
  durationMin: z.number().int().min(1).default(25)
});

/**
 * Start a new Pomodoro focus session.
 */
export async function startSession(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.studentId;
    if (!studentId) {
      throw new ApiError(400, 'Không tìm thấy thông tin Student.');
    }

    const { taskId, durationMin } = startSessionSchema.parse(req.body);

    // If taskId is specified, check if it belongs to the student
    if (taskId) {
      const task = await prisma.task.findUnique({ where: { id: taskId } });
      if (!task || task.studentId !== studentId) {
        throw new ApiError(404, 'Không tìm thấy task hoặc bạn không có quyền.');
      }
    }

    const session = await prisma.pomodoroSession.create({
      data: {
        studentId,
        taskId: taskId || null,
        durationMin,
        completed: false
      }
    });

    res.status(201).json({
      success: true,
      session
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark a Pomodoro session as completed and accumulate study time.
 */
export async function completeSession(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.studentId;
    const { id } = req.params;

    if (!studentId) {
      throw new ApiError(400, 'Không tìm thấy thông tin Student.');
    }

    const session = await prisma.pomodoroSession.findUnique({
      where: { id }
    });

    if (!session || session.studentId !== studentId) {
      throw new ApiError(404, 'Không tìm thấy Pomodoro session.');
    }

    if (session.completed) {
      res.status(200).json({ success: true, message: 'Session already completed', session });
      return;
    }

    // Update session as completed
    const updatedSession = await prisma.pomodoroSession.update({
      where: { id },
      data: {
        completed: true,
        endedAt: new Date()
      }
    });

    // Update student's accumulated focus time
    const student = await prisma.student.update({
      where: { id: studentId },
      data: {
        totalFocusTime: {
          increment: session.durationMin
        }
      }
    });

    // Recalculate risk since study time changes the normalized timeSpent
    const newRiskScore = await recalculate(studentId);

    // Asynchronously evaluate badges (fire-and-forget)
    Promise.all([
      evaluatePomodoroBadges(studentId),
      evaluateStreakBadges(studentId),
      logActivity(studentId, 'POMODORO_COMPLETED', id, `Session: ${id}`)
    ]).catch(err => console.error('[BadgeService/ActivityLog] Background evaluation failed:', err));

    res.status(200).json({
      success: true,
      session: updatedSession,
      totalFocusTime: student.totalFocusTime,
      newRiskScore
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Pomodoro session history for the student.
 * Supports ?week=current filter.
 */
export async function getSessionHistory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.studentId;
    if (!studentId) {
      throw new ApiError(400, 'Không tìm thấy thông tin Student.');
    }

    const { week } = req.query;

    const whereClause: any = { studentId };

    if (week === 'current') {
      const today = new Date();
      // Calculate Monday of current week
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(today.setDate(diff));
      monday.setHours(0, 0, 0, 0);

      whereClause.createdAt = {
        gte: monday
      };
    }

    const sessions = await prisma.pomodoroSession.findMany({
      where: whereClause,
      include: {
        task: {
          include: {
            skill: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(200).json({
      success: true,
      sessions
    });
  } catch (error) {
    next(error);
  }
}
