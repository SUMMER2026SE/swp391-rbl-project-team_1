"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAdminAction = logAdminAction;
exports.createAuditLog = createAuditLog;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
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
function logAdminAction(payload) {
    return (req, res, next) => {
        // Intercept res.json to capture when response is sent
        const originalJson = res.json.bind(res);
        res.json = function (body) {
            // Only log on 2xx success
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const ipAddress = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
                    req.socket?.remoteAddress ||
                    "unknown";
                const logData = {
                    adminId: req.user?.id || "unknown",
                    adminEmail: req.user?.email || "unknown",
                    action: payload.action,
                    targetType: payload.targetType,
                    targetId: payload.getTargetId?.(req),
                    targetLabel: payload.getTargetLabel?.(req),
                    detail: payload.getDetail?.(req),
                    ipAddress,
                };
                // Fire-and-forget: non-blocking
                prisma.adminLog.create({ data: logData }).catch((err) => {
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
async function createAuditLog(adminId, adminEmail, action, targetType, options = {}) {
    try {
        await prisma.adminLog.create({
            data: {
                adminId,
                adminEmail,
                action,
                targetType,
                targetId: options.targetId,
                targetLabel: options.targetLabel,
                detail: options.detail,
                ipAddress: options.ipAddress,
            },
        });
    }
    catch (err) {
        console.error("[AuditLog] Failed to write log:", err);
    }
}
