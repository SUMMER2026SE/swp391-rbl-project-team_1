import { Request, Response, NextFunction } from "express";
import { PrismaClient, AdminActionType, AdminTargetType } from "@prisma/client";

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

interface LogPayload {
  action: AdminActionType;
  targetType: AdminTargetType;
  targetId?: string;
  targetLabel?: string;
  detail?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
    note?: string;
  };
}

/**
 * Middleware factory: wraps a controller and automatically logs the admin action
 * after the response is sent (non-blocking).
 *
 * Usage:
 *   router.delete("/admin/users/:id", verifyToken, verifyAdmin,
 *     logAdminAction({ action: "DELETE_USER", targetType: "USER", getTargetId: (req) => req.params.id }),
 *     removeUser
 *   );
 */
export function logAdminAction(payload: {
  action: AdminActionType;
  targetType: AdminTargetType;
  getTargetId?: (req: Request) => string | undefined;
  getTargetLabel?: (req: Request) => string | undefined;
  getDetail?: (req: Request) => LogPayload["detail"] | undefined;
}) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // Intercept res.json to capture when response is sent
    const originalJson = res.json.bind(res);
    res.json = function (body: unknown) {
      // Only log on 2xx success
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const ipAddress =
          (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
          req.socket?.remoteAddress ||
          "unknown";

        const logData = {
          adminId: req.user?.id || "unknown",
          adminEmail: req.user?.email || "unknown",
          action: payload.action,
          targetType: payload.targetType,
          targetId: payload.getTargetId?.(req),
          targetLabel: payload.getTargetLabel?.(req),
          detail: payload.getDetail?.(req) as any,
          ipAddress,
        };

        // Fire-and-forget: non-blocking
        prisma.adminLog.create({ data: logData }).catch((err: unknown) => {
          console.error("[AuditLog] Failed to write log:", err);
        });
      }
      return originalJson(body);
    };
    next();
  };
}

/**
 * Utility function to directly create an audit log entry from inside a controller.
 * Use this for complex actions where middleware interception is not sufficient.
 */
export async function createAuditLog(
  adminId: string,
  adminEmail: string,
  action: AdminActionType,
  targetType: AdminTargetType,
  options: {
    targetId?: string;
    targetLabel?: string;
    detail?: Record<string, unknown>;
    ipAddress?: string;
  } = {}
): Promise<void> {
  try {
    await prisma.adminLog.create({
      data: {
        adminId,
        adminEmail,
        action,
        targetType,
        targetId: options.targetId,
        targetLabel: options.targetLabel,
        detail: options.detail as any,
        ipAddress: options.ipAddress,
      },
    });
  } catch (err) {
    console.error("[AuditLog] Failed to write log:", err);
  }
}
