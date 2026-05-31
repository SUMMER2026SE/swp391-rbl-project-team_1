"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listMyNotifications = listMyNotifications;
exports.markNotificationAsRead = markNotificationAsRead;
exports.markAllAsRead = markAllAsRead;
exports.runAppointmentReminders = runAppointmentReminders;
const notification_service_1 = require("../services/notification.service");
const apiError_1 = require("../utils/apiError");
async function listMyNotifications(req, res, next) {
    try {
        const userId = req.user?.userId;
        if (!userId)
            throw new apiError_1.ApiError("Authentication required", 401);
        const unreadOnly = req.query.unread === "true";
        const notifications = await (0, notification_service_1.getUserNotifications)(userId, unreadOnly);
        res.json({ message: "Notifications retrieved", count: notifications.length, data: notifications });
    }
    catch (error) {
        next(error);
    }
}
async function markNotificationAsRead(req, res, next) {
    try {
        const userId = req.user?.userId;
        const id = req.params.id;
        if (!userId)
            throw new apiError_1.ApiError("Authentication required", 401);
        const notification = await (0, notification_service_1.markNotificationRead)(userId, id);
        res.json({ message: "Notification marked as read", data: notification });
    }
    catch (error) {
        next(error);
    }
}
async function markAllAsRead(req, res, next) {
    try {
        const userId = req.user?.userId;
        if (!userId)
            throw new apiError_1.ApiError("Authentication required", 401);
        await (0, notification_service_1.markAllNotificationsRead)(userId);
        res.json({ message: "All notifications marked as read" });
    }
    catch (error) {
        next(error);
    }
}
/**
 * POST /api/internal/appointment-reminders
 * Protected by CRON_SECRET header for scheduled jobs.
 */
async function runAppointmentReminders(req, res, next) {
    try {
        const cronSecret = process.env.CRON_SECRET;
        const provided = req.headers["x-cron-secret"];
        if (!cronSecret || provided !== cronSecret) {
            throw new apiError_1.ApiError("Unauthorized", 401);
        }
        const result = await (0, notification_service_1.processAppointmentReminders)();
        res.json({ message: "Appointment reminders processed", data: result });
    }
    catch (error) {
        next(error);
    }
}
