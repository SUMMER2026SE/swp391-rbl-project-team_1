import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../prisma/client';
import { z } from 'zod';
import { ApiError } from '../utils/apiError';
import { TaskStatus, Difficulty } from '../types/enums';
import { recalculate } from '../services/risk.service';
import { logActivity } from '../services/activity.service';
import { emitRedFlag } from '../services/socket.service';
import { generateTasks } from '../services/gemini.service';
import { sortByPriority } from '../utils/priorityScheduler';

// Validation Schemas
const createTaskSchema = z.object({
  title: z.string().min(1, 'Tiêu đề không được để trống'),
  description: z.string().optional(),
  skillId: z.string().min(1, 'Kỹ năng không được để trống'),
  difficulty: z.nativeEnum(Difficulty),
  deadline: z.string().transform(val => new Date(val)).optional(),
  estimatedMinutes: z.number().int().min(1).default(25)
});

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  skillId: z.string().optional(),
  difficulty: z.nativeEnum(Difficulty).optional(),
  deadline: z.string().transform(val => new Date(val)).optional().nullable(),
  estimatedMinutes: z.number().int().min(1).optional()
});

const updateStatusSchema = z.object({
  status: z.nativeEnum(TaskStatus)
});

/**
 * Get all tasks for the logged in student.
 */
export async function getTasks(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.studentId;
    if (!studentId) {
      throw new ApiError(400, 'Không tìm thấy thông tin Student.');
    }

    const { status, skillId, sortBy } = req.query;

    const whereClause: any = { studentId };
    if (status) {
      whereClause.status = status as TaskStatus;
    }
    if (skillId) {
      whereClause.skillId = skillId as string;
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        skill: true
      }
    });

    // If sorting by priority, we use the Priority Scheduler algorithm
    if (sortBy === 'priority') {
      const studentMasteries = await prisma.skillMastery.findMany({
        where: { studentId }
      });

      const mappedTasks = tasks.map(task => {
        const mastery = studentMasteries.find(m => m.skillId === task.skillId);
        const masteryLevel = mastery ? mastery.masteryLevel : 0.3;
        
        let diffNum = 1;
        if (task.difficulty === Difficulty.MEDIUM) diffNum = 2;
        if (task.difficulty === Difficulty.HARD) diffNum = 3;
        if (task.difficulty === Difficulty.EXPERT) diffNum = 4;

        return {
          ...task,
          masteryLevel,
          difficultyNum: diffNum
        };
      });

      const schedulerTasks = mappedTasks.map(t => ({
        id: t.id,
        deadline: t.deadline || undefined,
        masteryLevel: t.masteryLevel,
        difficulty: t.difficultyNum
      }));

      const sortedSchedulerTasks = sortByPriority(schedulerTasks, new Date());
      
      const sortedTasks = sortedSchedulerTasks.map(st => {
        return mappedTasks.find(t => t.id === st.id)!;
      });

      res.status(200).json({ success: true, tasks: sortedTasks });
      return;
    }

    // Default sorting by createdAt desc
    tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    res.status(200).json({ success: true, tasks });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new task.
 */
export async function createTask(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.studentId;
    if (!studentId) {
      throw new ApiError(400, 'Không tìm thấy thông tin Student.');
    }

    const data = createTaskSchema.parse(req.body);

    const task = await prisma.task.create({
      data: {
        studentId,
        title: data.title,
        description: data.description,
        skillId: data.skillId,
        difficulty: data.difficulty,
        deadline: data.deadline,
        estimatedMinutes: data.estimatedMinutes,
        status: TaskStatus.TODO
      },
      include: {
        skill: true
      }
    });

    res.status(201).json({ success: true, task });
  } catch (error) {
    next(error);
  }
}

/**
 * Update task details.
 */
export async function updateTask(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.studentId;
    const { id } = req.params;

    if (!studentId) {
      throw new ApiError(400, 'Không tìm thấy thông tin Student.');
    }

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task || task.studentId !== studentId) {
      throw new ApiError(404, 'Không tìm thấy task hoặc bạn không có quyền chỉnh sửa.');
    }

    const data = updateTaskSchema.parse(req.body);

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        title: data.title !== undefined ? data.title : undefined,
        description: data.description !== undefined ? data.description : undefined,
        skillId: data.skillId !== undefined ? data.skillId : undefined,
        difficulty: data.difficulty !== undefined ? data.difficulty : undefined,
        deadline: data.deadline !== undefined ? (data.deadline || null) : undefined,
        estimatedMinutes: data.estimatedMinutes !== undefined ? data.estimatedMinutes : undefined
      },
      include: {
        skill: true
      }
    });

    res.status(200).json({ success: true, task: updatedTask });
  } catch (error) {
    next(error);
  }
}

/**
 * Update task status (drag-and-drop).
 * If task becomes DONE, triggers risk recalculation and Socket.IO Red Flag check.
 */
export async function updateStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.studentId;
    const { id } = req.params;

    if (!studentId) {
      throw new ApiError(400, 'Không tìm thấy thông tin Student.');
    }

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task || task.studentId !== studentId) {
      throw new ApiError(404, 'Không tìm thấy task hoặc bạn không có quyền.');
    }

    const { status } = updateStatusSchema.parse(req.body);

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status,
        completedAt: status === TaskStatus.DONE ? new Date() : null
      },
      include: {
        skill: true
      }
    });

    let newRiskScore = task.studentId ? 0 : 0;
    if (status === TaskStatus.DONE || task.status === TaskStatus.DONE) {
      // Recalculate student risk when task status changes to/from DONE
      newRiskScore = await recalculate(studentId);
      if (newRiskScore > 70) {
        await emitRedFlag(studentId, newRiskScore);
      }
    } else {
      // Get current risk
      const student = await prisma.student.findUnique({ where: { id: studentId } });
      newRiskScore = student?.currentRiskScore || 0;
    }

    // Only log if transitioning from not DONE to DONE
    if (task.status !== TaskStatus.DONE && status === TaskStatus.DONE) {
      logActivity(studentId, 'TASK_COMPLETED', task.id, `Task: ${task.id}`).catch(err => console.error(err));
    }

    res.status(200).json({
      success: true,
      task: updatedTask,
      newRiskScore
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Reorder tasks in a column (simulate behavior).
 */
export async function reorderTask(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    // Since we don't store a specific index in DB, we'll return 200 OK
    res.status(200).json({ success: true, message: 'Reordered successfully' });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete task.
 */
export async function deleteTask(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.studentId;
    const { id } = req.params;

    if (!studentId) {
      throw new ApiError(400, 'Không tìm thấy thông tin Student.');
    }

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task || task.studentId !== studentId) {
      throw new ApiError(404, 'Không tìm thấy task hoặc bạn không có quyền.');
    }

    await prisma.task.delete({ where: { id } });

    // Recalculate risk in case the denominator changes
    const newRiskScore = await recalculate(studentId);
    if (newRiskScore > 70) {
      await emitRedFlag(studentId, newRiskScore);
    }

    res.status(200).json({ success: true, message: 'Đã xóa task thành công.', newRiskScore });
  } catch (error) {
    next(error);
  }
}

/**
 * AI suggest tasks based on weak skills (mastery < 0.5).
 */
export async function aiGenerateTasks(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.studentId;
    if (!studentId) {
      throw new ApiError(400, 'Không tìm thấy thông tin Student.');
    }

    // Get weak skill masteries
    const masteries = await prisma.skillMastery.findMany({
      where: {
        studentId,
        masteryLevel: { lt: 0.5 }
      },
      include: {
        skill: true
      }
    });

    if (masteries.length === 0) {
      res.status(200).json({ success: true, tasks: [], message: 'Tất cả các kỹ năng đều tốt (>= 0.5). Không cần gợi ý thêm.' });
      return;
    }

    const weakSkillsInfo = masteries.map(m => ({
      name: m.skill.name,
      masteryLevel: m.masteryLevel
    }));

    // Call Gemini to generate tasks
    let suggestedTasks;
    try {
      suggestedTasks = await generateTasks(weakSkillsInfo);
    } catch (error) {
      console.error("AI Task Generation failed:", error);
      throw new ApiError(503, "Dịch vụ AI gợi ý Task tạm thời không khả dụng. Vui lòng thử lại sau.");
    }

    const createdTasks = [];
    for (const t of suggestedTasks) {
      // Find skill matching skillName or default to one of the weak skills
      const matchedMastery = masteries.find(m => m.skill.name.toLowerCase().includes(t.skillName.toLowerCase())) 
        || masteries[0];

      let difficultyEnum: Difficulty = Difficulty.EASY;
      if (t.difficulty === 'MEDIUM') difficultyEnum = Difficulty.MEDIUM;
      if (t.difficulty === 'HARD') difficultyEnum = Difficulty.HARD;
      if (t.difficulty === 'EXPERT') difficultyEnum = Difficulty.EXPERT;

      const created = await prisma.task.create({
        data: {
          studentId,
          title: t.title,
          description: t.reason || `AI suggested for practicing ${matchedMastery.skill.name}`,
          skillId: matchedMastery.skillId,
          difficulty: difficultyEnum,
          estimatedMinutes: t.estimatedMinutes || 25,
          status: TaskStatus.TODO,
          isAIGenerated: true
        },
        include: {
          skill: true
        }
      });
      createdTasks.push(created);
    }

    res.status(200).json({ success: true, tasks: createdTasks });
  } catch (error) {
    next(error);
  }
}
