import { Request, Response } from "express";
import { PrismaClient, AdminActionType, AdminTargetType } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * GET /api/admin/audit-logs
 * Fetch audit logs with pagination and filtering
 */
export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const action = req.query.action as AdminActionType | undefined;
    const adminEmail = req.query.adminEmail as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const where: any = {};

    if (action) {
      where.action = action;
    }

    if (adminEmail) {
      where.adminEmail = { contains: adminEmail, mode: "insensitive" };
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.adminLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.adminLog.count({ where }),
    ]);

    res.status(200).json({
      message: "Fetched audit logs successfully",
      data: logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[AuditLogController] getAuditLogs error:", error);
    res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
};
