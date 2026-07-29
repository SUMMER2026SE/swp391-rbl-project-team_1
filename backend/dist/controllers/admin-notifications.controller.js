"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markNotificationRead = exports.getAdminNotifications = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * GET /api/admin/notifications
 * Get admin notifications (recent 50 max)
 */
const getAdminNotifications = async (req, res) => {
    try {
        const unreadOnly = req.query.unread === "true";
        const where = unreadOnly ? { isRead: false } : {};
        const notifications = await prisma.adminNotification.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: 50,
        });
        const unreadCount = await prisma.adminNotification.count({
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
            await prisma.adminNotification.updateMany({
                where: { isRead: false },
                data: { isRead: true }
            });
            return res.status(200).json({ message: "Đã đánh dấu tất cả là đã đọc" });
        }
        const notification = await prisma.adminNotification.update({
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
