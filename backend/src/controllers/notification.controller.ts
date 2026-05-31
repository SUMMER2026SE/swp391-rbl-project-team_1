import { NextFunction, Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import {
    getUserNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    processAppointmentReminders,
} from "../services/notification.service";
import { ApiError } from "../utils/apiError";

export async function listMyNotifications(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.userId;
        if (!userId) throw new ApiError("Authentication required", 401);

        const unreadOnly = req.query.unread === "true";
        const notifications = await getUserNotifications(userId, unreadOnly);
        res.json({ message: "Notifications retrieved", count: notifications.length, data: notifications });
    } catch (error) {
        next(error);
    }
}

export async function markNotificationAsRead(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.userId;
        const id = req.params.id as string;
        if (!userId) throw new ApiError("Authentication required", 401);

        const notification = await markNotificationRead(userId, id);
        res.json({ message: "Notification marked as read", data: notification });
    } catch (error) {
        next(error);
    }
}

export async function markAllAsRead(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.userId;
        if (!userId) throw new ApiError("Authentication required", 401);

        await markAllNotificationsRead(userId);
        res.json({ message: "All notifications marked as read" });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/internal/appointment-reminders
 * Protected by CRON_SECRET header for scheduled jobs.
 */
export async function runAppointmentReminders(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const cronSecret = process.env.CRON_SECRET;
        const provided = req.headers["x-cron-secret"];

        if (!cronSecret || provided !== cronSecret) {
            throw new ApiError("Unauthorized", 401);
        }

        const result = await processAppointmentReminders();
        res.json({ message: "Appointment reminders processed", data: result });
    } catch (error) {
        next(error);
    }
}
