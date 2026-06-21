import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../prisma/client';
import { ApiError } from '../utils/apiError';

export async function getDocuments(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.studentId;

    // Fetch all documents
    const documents = await prisma.document.findMany({
      include: {
        skillTags: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    let savedDocumentIds: string[] = [];
    let purchasedDocumentIds: string[] = [];

    // If student is logged in, fetch their saved documents
    if (studentId) {
      const savedDocs = await prisma.savedDocument.findMany({
        where: { studentId },
        select: { documentId: true }
      });
      savedDocumentIds = savedDocs.map(sd => sd.documentId);

      const purchasedDocs = await prisma.purchasedDocument.findMany({
        where: { studentId },
        select: { documentId: true }
      });
      purchasedDocumentIds = purchasedDocs.map(pd => pd.documentId);
    }

    res.status(200).json({
      success: true,
      documents,
      savedDocumentIds,
      purchasedDocumentIds
    });
  } catch (error) {
    next(error);
  }
}

export async function toggleSaveDocument(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.studentId;
    if (!studentId) {
      throw new ApiError(401, 'Bạn cần đăng nhập với vai trò học viên để lưu tài liệu.');
    }

    const { id: documentId } = req.params;

    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });

    if (!document) {
      throw new ApiError(404, 'Không tìm thấy tài liệu.');
    }

    const existingSave = await prisma.savedDocument.findUnique({
      where: {
        studentId_documentId: {
          studentId,
          documentId
        }
      }
    });

    if (existingSave) {
      // Unsave
      await prisma.savedDocument.delete({
        where: { id: existingSave.id }
      });
      res.status(200).json({
        success: true,
        message: 'Đã bỏ lưu tài liệu khỏi tủ đồ cá nhân.',
        isSaved: false
      });
    } else {
      // Save
      await prisma.savedDocument.create({
        data: {
          studentId,
          documentId
        }
      });
      res.status(200).json({
        success: true,
        message: 'Đã lưu tài liệu vào tủ đồ cá nhân.',
        isSaved: true
      });
    }
  } catch (error) {
    next(error);
  }
}

export async function getSavedDocuments(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.studentId;
    if (!studentId) {
      throw new ApiError(401, 'Bạn cần đăng nhập với vai trò học viên.');
    }

    const savedDocs = await prisma.savedDocument.findMany({
      where: { studentId },
      include: {
        document: {
          include: {
            skillTags: true
          }
        }
      },
      orderBy: {
        savedAt: 'desc'
      }
    });

    res.status(200).json({
      success: true,
      savedDocuments: savedDocs
    });
  } catch (error) {
    next(error);
  }
}

export async function purchaseDocument(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.studentId;
    if (!studentId) {
      throw new ApiError(401, 'Bạn cần đăng nhập học viên để mua tài liệu.');
    }

    const { id: documentId } = req.params;
    const { price } = req.body;

    const document = await prisma.document.findUnique({ where: { id: documentId } });
    if (!document) throw new ApiError(404, 'Không tìm thấy tài liệu.');

    if (document.accessType !== 'PREMIUM') {
      throw new ApiError(400, 'Tài liệu này miễn phí, không cần mua.');
    }

    const existingPurchase = await prisma.purchasedDocument.findUnique({
      where: { studentId_documentId: { studentId, documentId } }
    });
    if (existingPurchase) {
      throw new ApiError(400, 'Bạn đã mua tài liệu này rồi.');
    }

    // Logic thanh toán: trừ tiền trong Wallet
    const wallet = await prisma.wallet.findUnique({ where: { studentId } });
    if (!wallet) throw new ApiError(404, 'Không tìm thấy ví.');

    if (wallet.balance < price) {
      throw new ApiError(400, 'Số dư không đủ. Vui lòng nạp thêm.');
    }

    await prisma.$transaction([
      prisma.wallet.update({
        where: { studentId },
        data: { balance: { decrement: price } }
      }),
      prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: price,
          type: 'EXPENSE',
          description: `Mua tài liệu: ${document.title}`
        }
      }),
      prisma.purchasedDocument.create({
        data: {
          studentId,
          documentId,
          pricePaid: price
        }
      })
    ]);

    res.status(200).json({
      success: true,
      message: 'Mua tài liệu thành công!'
    });
  } catch (error) {
    next(error);
  }
}
