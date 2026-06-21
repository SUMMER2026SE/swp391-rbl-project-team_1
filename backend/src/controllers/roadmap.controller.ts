import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../prisma/client';
import { ApiError } from '../utils/apiError';
import { TaskStatus, Difficulty } from '../types/enums';
import { calculatePriority } from '../utils/priorityScheduler';
import { generateRoadmap, generateInitialRoadmapTasks } from '../services/gemini.service';

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
        isActive: true,
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
      where: { studentId, isActive: true }
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

    // Sort by priority score DESC first
    mappedTasks.sort((a, b) => b.priorityScore - a.priorityScore);

    // Apply manual override sorting
    const manualTasks = mappedTasks.filter(t => t.isManualOverride && t.manualOrder !== null);
    const autoTasks = mappedTasks.filter(t => !t.isManualOverride || t.manualOrder === null);
    
    manualTasks.sort((a, b) => a.manualOrder! - b.manualOrder!);

    const finalTasks: any[] = [];
    let autoIndex = 0;
    const maxManualOrder = manualTasks.length > 0 ? Math.max(...manualTasks.map(t => t.manualOrder!)) : -1;
    const totalLength = Math.max(mappedTasks.length, maxManualOrder + 1);

    for (let i = 0; i < totalLength; i++) {
      const manualTask = manualTasks.find(t => t.manualOrder === i);
      if (manualTask) {
        finalTasks.push(manualTask);
      } else if (autoIndex < autoTasks.length) {
        finalTasks.push(autoTasks[autoIndex]);
        autoIndex++;
      }
    }

    while (autoIndex < autoTasks.length) {
      finalTasks.push(autoTasks[autoIndex]);
      autoIndex++;
    }

    // Get overall progress (DONE tasks vs total tasks)
    const allTasksCount = await prisma.task.count({ where: { studentId } });
    const doneTasksCount = await prisma.task.count({ where: { studentId, status: TaskStatus.DONE } });
    const progressPercent = allTasksCount > 0 ? Math.round((doneTasksCount / allTasksCount) * 100) : 0;

    res.status(200).json({
      success: true,
      tasks: finalTasks,
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

    if (!student.learningGoal || student.learningGoal.trim() === '') {
      throw new ApiError(400, 'Vui lòng hoàn tất khảo sát đầy đủ trước khi tạo lộ trình');
    }

    const goal = student.learningGoal;

    // Get active skill masteries
    const masteries = await prisma.skillMastery.findMany({
      where: {
        studentId,
        isActive: true
      },
      include: {
        skill: true
      }
    });

    if (masteries.length === 0) {
      throw new ApiError(400, 'Bạn chưa có kỹ năng nào đang theo đuổi. Vui lòng thêm kỹ năng trước khi tạo lộ trình.');
    }

    const aiSkillsContext = masteries.map(m => {
      let levelDesc = 'Người mới bắt đầu';
      if (m.masteryLevel > 0.4) levelDesc = 'Đã có nền tảng cơ bản';
      if (m.masteryLevel > 0.6) levelDesc = 'Khá thành thạo';
      return `${m.skill.name} (${levelDesc})`;
    });

    try {
      const taskSuggestions = await generateInitialRoadmapTasks(
        aiSkillsContext,
        goal,
        2, // default study hours
        3, // default duration months
        student.learningStyle || 'Thực hành'
      );

      const tasksToCreate = taskSuggestions.map((suggestion, index) => {
        let matchedSkillId = masteries[0].skillId;
        const aiName = suggestion.skillName.toLowerCase();
        const matchedMastery = masteries.find(m => m.skill.name.toLowerCase() === aiName || aiName.includes(m.skill.name.toLowerCase()));
        if (matchedMastery) matchedSkillId = matchedMastery.skillId;

        const deadline = new Date();
        deadline.setDate(deadline.getDate() + index + 1);

        return {
          studentId,
          title: suggestion.title,
          description: suggestion.reason,
          skillId: matchedSkillId,
          status: 'TODO' as const,
          difficulty: (suggestion.difficulty as any) || 'MEDIUM',
          estimatedMinutes: suggestion.estimatedMinutes || 60,
          deadline: deadline,
          isManualOverride: false,
          isAIGenerated: true,
          manualOrder: null
        };
      });

      // Transaction: Soft delete old AI tasks, insert new tasks
      await prisma.$transaction([
        prisma.task.updateMany({
          where: {
            studentId,
            isManualOverride: false,
            status: { not: 'DONE' }
          },
          data: {
            isActive: false
          }
        }),
        prisma.task.createMany({
          data: tasksToCreate
        })
      ]);

      res.status(200).json({
        success: true,
        message: 'Lộ trình học tập đã được cập nhật thành công.'
      });
    } catch (aiError) {
      console.error('Failed to generate roadmap tasks:', aiError);
      throw new ApiError(500, 'Không thể tạo lộ trình tự động lúc này, vui lòng thử lại sau hoặc dùng nút Thêm Bước để tạo lộ trình thủ công');
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Reorder roadmap tasks manually
 */
export async function reorderRoadmap(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.studentId;
    if (!studentId) throw new ApiError(400, 'Không tìm thấy thông tin Student.');
    
    const { taskIds } = req.body;
    if (!Array.isArray(taskIds)) throw new ApiError(400, 'taskIds must be an array');

    // Update all tasks in a transaction
    const updates = taskIds.map((taskId: string, index: number) => 
      prisma.task.update({
        where: { id: taskId, studentId }, // Ensure student owns the task
        data: { manualOrder: index, isManualOverride: true }
      })
    );
    
    await prisma.$transaction(updates);

    res.status(200).json({
      success: true,
      message: 'Cập nhật thứ tự ưu tiên thành công.'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get purchased roadmaps for the student
 */
export async function getPurchasedRoadmaps(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.studentId;
    if (!studentId) {
      throw new ApiError(400, 'Không tìm thấy thông tin Student.');
    }

    const purchased = await prisma.purchasedRoadmap.findMany({
      where: { studentId },
      select: { roadmapId: true }
    });

    res.status(200).json({
      success: true,
      purchasedRoadmapIds: purchased.map(p => p.roadmapId)
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Purchase a premium roadmap
 */
export async function purchaseRoadmap(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.studentId;
    if (!studentId) {
      throw new ApiError(400, 'Không tìm thấy thông tin Student.');
    }

    const { roadmapId, price } = req.body;
    if (!roadmapId || typeof price !== 'number') {
      throw new ApiError(400, 'Thiếu thông tin lộ trình hoặc giá.');
    }

    // 1. Get Wallet
    const wallet = await prisma.wallet.findUnique({
      where: { studentId }
    });

    if (!wallet || wallet.balance < price) {
      throw new ApiError(400, 'Số dư không đủ. Vui lòng nạp thêm.');
    }

    // 2. Check if already purchased
    const existing = await prisma.purchasedRoadmap.findUnique({
      where: {
        studentId_roadmapId: { studentId, roadmapId }
      }
    });

    if (existing) {
      throw new ApiError(400, 'Bạn đã sở hữu lộ trình này rồi.');
    }

    // 3. Process Transaction
    await prisma.$transaction(async (tx) => {
      // Deduct balance
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: price } }
      });

      // Log transaction
      // Note: We need to import TransactionType, or use hardcoded string if enum is available
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'PURCHASE',
          amount: price,
          description: `Mua lộ trình Premium: ${roadmapId}`
        }
      });

      // Create Purchased Roadmap record
      await tx.purchasedRoadmap.create({
        data: {
          studentId,
          roadmapId,
          pricePaid: price
        }
      });
    });

    res.status(200).json({
      success: true,
      message: 'Mua lộ trình thành công.'
    });
  } catch (error) {
    next(error);
  }
}
