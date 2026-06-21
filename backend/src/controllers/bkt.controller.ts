import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../prisma/client';
import { ApiError } from '../utils/apiError';

/**
 * Get all skill masteries for the logged in student.
 */
export async function getMasteries(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.studentId;
    if (!studentId) {
      throw new ApiError(400, 'Không tìm thấy thông tin Student.');
    }

    const masteries = await prisma.skillMastery.findMany({
      where: { 
        studentId,
        isActive: true
      },
      include: {
        skill: true
      }
    });

    res.status(200).json({
      success: true,
      masteries
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get mastery details for a specific skill.
 */
export async function getMasteryBySkill(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.studentId;
    const { skillId } = req.params;

    if (!studentId) {
      throw new ApiError(400, 'Không tìm thấy thông tin Student.');
    }

    const mastery = await prisma.skillMastery.findUnique({
      where: {
        studentId_skillId: {
          studentId,
          skillId
        }
      },
      include: {
        skill: true
      }
    });

    if (!mastery) {
      throw new ApiError(404, 'Không tìm thấy thông tin thành thạo cho kỹ năng này.');
    }

    res.status(200).json({
      success: true,
      mastery
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get BKT history timeline for a specific skill.
 */
export async function getBKTHistory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.studentId;
    const { skillId } = req.params;

    if (!studentId) {
      throw new ApiError(400, 'Không tìm thấy thông tin Student.');
    }

    const mastery = await prisma.skillMastery.findUnique({
      where: {
        studentId_skillId: {
          studentId,
          skillId
        }
      }
    });

    if (!mastery) {
      res.status(200).json({ success: true, history: [] });
      return;
    }

    const history = await prisma.bKTHistory.findMany({
      where: {
        masteryId: mastery.id
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    res.status(200).json({
      success: true,
      history
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Add or update skill masteries for a student
 */
export async function addSkillMasteries(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.studentId;
    if (!studentId) {
      throw new ApiError(400, 'Không tìm thấy thông tin Student.');
    }

    const { skillLevels } = req.body;
    if (!skillLevels || typeof skillLevels !== 'object') {
      throw new ApiError(400, 'Dữ liệu kỹ năng không hợp lệ.');
    }

    const updates = Object.entries(skillLevels).map(async ([skillId, masteryLevel]) => {
      const level = Number(masteryLevel);
      return prisma.skillMastery.upsert({
        where: {
          studentId_skillId: {
            studentId,
            skillId
          }
        },
        update: {
          isActive: true,
          masteryLevel: level,
          pLearn: 0.4,
          pForget: 0.1,
          pGuess: 0.2,
          pSlip: 0.1
        },
        create: {
          studentId,
          skillId,
          masteryLevel: level,
          pLearn: 0.4,
          pForget: 0.1,
          pGuess: 0.2,
          pSlip: 0.1,
          isActive: true
        }
      });
    });

    await Promise.all(updates);

    res.status(200).json({
      success: true,
      message: 'Đã thêm kỹ năng thành công.'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Soft delete a skill mastery and archive related tasks
 */
export async function removeSkillMastery(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.studentId;
    const { skillId } = req.params;

    if (!studentId) {
      throw new ApiError(400, 'Không tìm thấy thông tin Student.');
    }

    if (!skillId) {
      throw new ApiError(400, 'Thiếu skillId.');
    }

    // 1. Soft delete mastery
    await prisma.skillMastery.update({
      where: {
        studentId_skillId: {
          studentId,
          skillId
        }
      },
      data: {
        isActive: false
      }
    });

    // 2. Soft delete tasks related to this skill
    await prisma.task.updateMany({
      where: {
        studentId,
        skillId
      },
      data: {
        isActive: false
      }
    });

    res.status(200).json({
      success: true,
      message: 'Đã xóa kỹ năng khỏi danh sách theo đuổi.'
    });
  } catch (error) {
    next(error);
  }
}
