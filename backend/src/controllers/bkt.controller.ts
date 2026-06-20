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
      where: { studentId },
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
