import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../prisma/client';
import { ApiError } from '../utils/apiError';
import { TaskStatus, Difficulty } from '../types/enums';
import { calculatePriority } from '../utils/priorityScheduler';
import { generateRoadmap } from '../services/gemini.service';

/**
 * Get active student tasks sorted by the Priority Scheduler.
 */
export async function getRoadmapTasks(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.studentId;
    if (!studentId) {
      throw new ApiError(400, 'Không tìm thấy thông tin Student.');
    }

    // 1. Fetch active tasks (TODO, IN_PROGRESS)
    const tasks = await prisma.task.findMany({
      where: {
        studentId,
        status: {
          in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS]
        }
      },
      include: {
        skill: true
      }
    });

    // 2. Fetch student masteries
    const masteries = await prisma.skillMastery.findMany({
      where: { studentId }
    });

    // 3. Map tasks to SchedulerTask format and calculate priorities
    const now = new Date();
    const mappedTasks = tasks.map(task => {
      const mastery = masteries.find(m => m.skillId === task.skillId);
      const masteryLevel = mastery ? mastery.masteryLevel : 0.3;

      let diffNum = 1;
      if (task.difficulty === Difficulty.MEDIUM) diffNum = 2;
      if (task.difficulty === Difficulty.HARD) diffNum = 3;
      if (task.difficulty === Difficulty.EXPERT) diffNum = 4;

      const schedulerTask = {
        id: task.id,
        deadline: task.deadline || undefined,
        masteryLevel,
        difficulty: diffNum
      };

      const priorityScore = calculatePriority(schedulerTask, now);

      return {
        ...task,
        masteryLevel,
        priorityScore: parseFloat(priorityScore.toFixed(4))
      };
    });

    // Sort by priority score DESC
    mappedTasks.sort((a, b) => b.priorityScore - a.priorityScore);

    // Get overall progress (DONE tasks vs total tasks)
    const allTasksCount = await prisma.task.count({ where: { studentId } });
    const doneTasksCount = await prisma.task.count({ where: { studentId, status: TaskStatus.DONE } });
    const progressPercent = allTasksCount > 0 ? Math.round((doneTasksCount / allTasksCount) * 100) : 0;

    res.status(200).json({
      success: true,
      tasks: mappedTasks,
      progress: {
        completed: doneTasksCount,
        total: allTasksCount,
        percent: progressPercent
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Generate adaptive roadmap markdown via Gemini AI based on weak skills and goals.
 */
export async function generateAIRoadmap(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.studentId;
    if (!studentId) {
      throw new ApiError(400, 'Không tìm thấy thông tin Student.');
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });

    if (!student) {
      throw new ApiError(404, 'Không tìm thấy học viên.');
    }

    const goal = student.learningGoal || 'Thành thạo công nghệ thông tin';

    // Get weak skill masteries (masteryLevel < 0.5)
    const masteries = await prisma.skillMastery.findMany({
      where: {
        studentId,
        masteryLevel: { lt: 0.5 }
      },
      include: {
        skill: true
      }
    });

    // Fallback if no weak skills are found, use all masteries
    const listToAnalyze = masteries.length > 0
      ? masteries
      : await prisma.skillMastery.findMany({
          where: { studentId },
          include: { skill: true },
          take: 5
        });

    const weakSkillsInfo = listToAnalyze.map(m => ({
      name: m.skill.name,
      masteryLevel: m.masteryLevel
    }));

    const markdownRoadmap = await generateRoadmap(weakSkillsInfo, goal);

    res.status(200).json({
      success: true,
      roadmap: markdownRoadmap
    });
  } catch (error) {
    next(error);
  }
}
