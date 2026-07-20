"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNotification = exports.markAllAsRead = exports.markAsRead = exports.getNotifications = void 0;
const client_1 = __importDefault(require("../prisma/client"));
// Get user's notifications
const getNotifications = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const notifications = await client_1.default.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        const unreadCount = await client_1.default.notification.count({
            where: { userId, isRead: false }
        });
        res.status(200).json({ notifications, unreadCount });
    }
    catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ message: "Error fetching notifications", error: error.message });
    }
};
exports.getNotifications = getNotifications;
// Mark a single notification as read
const markAsRead = async (req, res) => {
    try {
        const id = req.params.id;
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const notification = await client_1.default.notification.findUnique({ where: { id } });
        if (!notification || notification.userId !== userId) {
            res.status(404).json({ message: "Notification not found" });
            return;
        }
        const updated = await client_1.default.notification.update({
            where: { id },
            data: { isRead: true }
        });
        res.status(200).json(updated);
    }
    catch (error) {
        console.error("Error marking notification as read:", error);
        res.status(500).json({ message: "Error marking notification as read", error: error.message });
    }
};
exports.markAsRead = markAsRead;
// Mark all notifications as read
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        await client_1.default.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true }
        });
        res.status(200).json({ message: "All notifications marked as read" });
    }
    catch (error) {
        console.error("Error marking all as read:", error);
        res.status(500).json({ message: "Error marking all as read", error: error.message });
    }
};
exports.markAllAsRead = markAllAsRead;
// Delete a single notification
const deleteNotification = async (req, res) => {
    try {
        const id = req.params.id;
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const notification = await client_1.default.notification.findUnique({ where: { id } });
        if (!notification || notification.userId !== userId) {
            res.status(404).json({ message: "Notification not found" });
            return;
        }
        await client_1.default.notification.delete({ where: { id } });
        res.status(200).json({ message: "Notification deleted" });
    }
    catch (error) {
        console.error("Error deleting notification:", error);
        res.status(500).json({ message: "Error deleting notification", error: error.message });
    }
};
exports.deleteNotification = deleteNotification;
