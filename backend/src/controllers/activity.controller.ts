import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../prisma/client';
import { ApiError } from '../utils/apiError';

export async function getHeatmap(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.studentId;
    if (!studentId) {
      throw new ApiError(400, 'Không tìm thấy thông tin Student.');
    }

    // Lấy log trong 60 ngày qua
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const logs = await prisma.activityLog.findMany({
      where: {
        studentId,
        createdAt: {
          gte: sixtyDaysAgo
        }
      },
      select: { createdAt: true }
    });

    const datesMap: { [key: string]: number } = {};

    logs.forEach(log => {
      // Múi giờ Việt Nam là UTC+7
      const dateInVietnam = new Date(log.createdAt.getTime() + 7 * 60 * 60 * 1000);
      const dStr = dateInVietnam.toISOString().split('T')[0];
      datesMap[dStr] = (datesMap[dStr] || 0) + 1;
    });

    res.status(200).json({
      success: true,
      heatmap: datesMap
    });
  } catch (error) {
    next(error);
  }
}
