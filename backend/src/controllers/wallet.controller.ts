import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../prisma/client';
import { ApiError } from '../utils/apiError';
import { TransactionType } from '@prisma/client';

/**
 * Get wallet balance
 */
export async function getBalance(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.studentId;
    if (!studentId) {
      throw new ApiError(400, 'Không tìm thấy thông tin Student.');
    }

    let wallet = await prisma.wallet.findUnique({
      where: { studentId }
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { studentId, balance: 0 }
      });
    }

    res.status(200).json({
      success: true,
      balance: wallet.balance
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get transaction history
 */
export async function getTransactions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.studentId;
    if (!studentId) {
      throw new ApiError(400, 'Không tìm thấy thông tin Student.');
    }

    const wallet = await prisma.wallet.findUnique({
      where: { studentId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    res.status(200).json({
      success: true,
      transactions: wallet?.transactions || []
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Demo Deposit endpoint
 */
export async function demoDeposit(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.studentId;
    if (!studentId) {
      throw new ApiError(400, 'Không tìm thấy thông tin Student.');
    }

    const { amount } = req.body;
    if (!amount || amount <= 0) {
      throw new ApiError(400, 'Số tiền không hợp lệ.');
    }

    // Upsert wallet
    const wallet = await prisma.wallet.upsert({
      where: { studentId },
      update: { balance: { increment: amount } },
      create: { studentId, balance: amount }
    });

    // Create transaction log
    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: TransactionType.DEPOSIT,
        amount,
        description: `Nạp tiền vào ví (Demo)`
      }
    });

    res.status(200).json({
      success: true,
      message: 'Nạp tiền giả lập thành công.',
      newBalance: wallet.balance
    });
  } catch (error) {
    next(error);
  }
}
