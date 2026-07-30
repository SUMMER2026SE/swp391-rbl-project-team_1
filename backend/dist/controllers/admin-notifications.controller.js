"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markNotificationRead = exports.getAdminNotifications = void 0;
const client_1 = __importDefault(require("../prisma/client"));
/**
 * GET /api/admin/notifications
 * Get admin notifications (recent 50 max)
 */
const getAdminNotifications = async (req, res) => {
    try {
        const unreadOnly = req.query.unread === "true";
        const where = unreadOnly ? { isRead: false } : {};
        const notifications = await client_1.default.adminNotification.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: 50,
        });
        const unreadCount = await client_1.default.adminNotification.count({
            where: { isRead: false },
        });
        res.status(200).json({
            message: "Fetched notifications",
            data: notifications,
            unreadCount,
        });
    }
    catch (error) {
        console.error("[NotificationController] getAdminNotifications error:", error);
        res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
    }
};
exports.getAdminNotifications = getAdminNotifications;
/**
 * PUT /api/admin/notifications/:id/read
 * Mark a notification as read
 */
const markNotificationRead = async (req, res) => {
    try {
        const { id } = req.params;
        if (id === "all") {
            await client_1.default.adminNotification.updateMany({
                where: { isRead: false },
                data: { isRead: true }
            });
            return res.status(200).json({ message: "Đã đánh dấu tất cả là đã đọc" });
        }
        const notification = await client_1.default.adminNotification.update({
            where: { id: id },
            data: { isRead: true },
        });
        res.status(200).json({
            message: "Marked as read",
            data: notification,
        });
    }
    catch (error) {
        console.error("[NotificationController] markNotificationRead error:", error);
        res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
    }
};
exports.markNotificationRead = markNotificationRead;
