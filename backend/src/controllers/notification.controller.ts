import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import prisma from "../prisma/client";

// Get user's notifications
export const getNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        const unreadCount = await prisma.notification.count({
            where: { userId, isRead: false }
        });

        res.status(200).json({ notifications, unreadCount });
    } catch (error: any) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ message: "Error fetching notifications", error: error.message });
    }
};

// Mark a single notification as read
export const markAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;
        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const notification = await prisma.notification.findUnique({ where: { id } });
        if (!notification || notification.userId !== userId) {
            res.status(404).json({ message: "Notification not found" });
            return;
        }

        const updated = await prisma.notification.update({
            where: { id },
            data: { isRead: true }
        });

        res.status(200).json(updated);
    } catch (error: any) {
        console.error("Error marking notification as read:", error);
        res.status(500).json({ message: "Error marking notification as read", error: error.message });
    }
};

// Mark all notifications as read
export const markAllAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true }
        });

        res.status(200).json({ message: "All notifications marked as read" });
    } catch (error: any) {
        console.error("Error marking all as read:", error);
        res.status(500).json({ message: "Error marking all as read", error: error.message });
    }
};

// Delete a single notification
export const deleteNotification = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;
        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const notification = await prisma.notification.findUnique({ where: { id } });
        if (!notification || notification.userId !== userId) {
            res.status(404).json({ message: "Notification not found" });
            return;
        }

        await prisma.notification.delete({ where: { id } });

        res.status(200).json({ message: "Notification deleted" });
    } catch (error: any) {
        console.error("Error deleting notification:", error);
        res.status(500).json({ message: "Error deleting notification", error: error.message });
    }
};
