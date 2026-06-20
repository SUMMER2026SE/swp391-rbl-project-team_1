import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../prisma/client';
import { ApiError } from '../utils/apiError';
import { recalculate } from '../services/risk.service';
import { emitRedFlag } from '../services/socket.service';

/**
 * Get current student risk score and risk level classification.
 */
export async function getRiskScore(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
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

    const score = student.currentRiskScore;
    let level = 'LOW';
    if (score >= 40 && score <= 70) {
      level = 'MEDIUM';
    } else if (score > 70) {
      level = 'HIGH';
    }

    res.status(200).json({
      success: true,
      riskScore: score,
      level
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get historical risk logs for drawing trend charts.
 */
export async function getRiskHistory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.studentId;
    if (!studentId) {
      throw new ApiError(400, 'Không tìm thấy thông tin Student.');
    }

    const history = await prisma.riskHistory.findMany({
      where: { studentId },
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
 * Manually trigger risk score recalculation.
 */
export async function triggerRecalculate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.studentId;
    if (!studentId) {
      throw new ApiError(400, 'Không tìm thấy thông tin Student.');
    }

    const score = await recalculate(studentId);

    if (score > 70) {
      await emitRedFlag(studentId, score);
    }

    let level = 'LOW';
    if (score >= 40 && score <= 70) {
      level = 'MEDIUM';
    } else if (score > 70) {
      level = 'HIGH';
    }

    res.status(200).json({
      success: true,
      riskScore: score,
      level
    });
  } catch (error) {
    next(error);
  }
}
