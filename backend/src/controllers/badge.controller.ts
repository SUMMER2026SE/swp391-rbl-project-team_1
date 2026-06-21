import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../prisma/client';
import { ApiError } from '../utils/apiError';

export async function getBadges(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.studentId;
    if (!studentId) {
      throw new ApiError(400, 'Không tìm thấy thông tin Student.');
    }

    // Lấy danh sách tất cả badges từ hệ thống
    const allBadges = await prisma.badge.findMany({
      orderBy: { points: 'asc' }
    });

    // Lấy danh sách badges sinh viên đã đạt được
    const earnedBadges = await prisma.studentBadge.findMany({
      where: { studentId },
      select: { badgeId: true, earnedAt: true }
    });

    // Format lại dữ liệu cho frontend
    const badges = allBadges.map(badge => {
      const earned = earnedBadges.find(eb => eb.badgeId === badge.id);
      return {
        id: badge.condition, // map condition to id for frontend
        emoji: badge.imageUrl,
        name: badge.name,
        description: badge.description,
        unlocked: !!earned,
        unlockedAt: earned ? earned.earnedAt : undefined
      };
    });

    res.status(200).json({
      success: true,
      badges
    });
  } catch (error) {
    next(error);
  }
}
