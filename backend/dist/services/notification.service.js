"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserNotifications = getUserNotifications;
exports.markNotificationRead = markNotificationRead;
exports.markAllNotificationsRead = markAllNotificationsRead;
exports.createNotification = createNotification;
exports.processAppointmentReminders = processAppointmentReminders;
const client_1 = require("@prisma/client");
const client_2 = __importDefault(require("../prisma/client"));
const apiError_1 = require("../utils/apiError");
const emailService_1 = require("../utils/emailService");
async function getUserNotifications(userId, unreadOnly = false) {
    return client_2.default.notification.findMany({
        where: { userId, ...(unreadOnly ? { read: false } : {}) },
        include: {
            appointment: {
                select: {
                    id: true,
                    appointmentDate: true,
                    doctor: { select: { name: true } },
                },
            },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
    });
}
async function markNotificationRead(userId, notificationId) {
    const notification = await client_2.default.notification.findFirst({
        where: { id: notificationId, userId },
    });
    if (!notification) {
        throw new apiError_1.ApiError("Notification not found", 404);
    }
    return client_2.default.notification.update({
        where: { id: notificationId },
        data: { read: true },
    });
}
async function markAllNotificationsRead(userId) {
    await client_2.default.notification.updateMany({
        where: { userId, read: false },
        data: { read: true },
    });
}
async function createNotification(data) {
    return client_2.default.notification.create({ data });
}
/**
 * Sends email reminders for appointments in the next 24 hours.
 * Call via cron: POST /api/internal/appointment-reminders (CRON_SECRET header).
 */
async function processAppointmentReminders() {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const appointments = await client_2.default.appointment.findMany({
        where: {
            status: { in: [client_1.AppointmentStatus.PENDING, client_1.AppointmentStatus.CONFIRMED] },
            appointmentDate: { gte: now, lte: in24h },
        },
        include: {
            user: { select: { id: true, email: true, fullName: true } },
            doctor: { select: { name: true, hospital: true } },
        },
    });
    let sent = 0;
    let skipped = 0;
    for (const appt of appointments) {
        const existingReminder = await client_2.default.notification.findFirst({
            where: {
                appointmentId: appt.id,
                type: client_1.NotificationType.APPOINTMENT_REMINDER,
                emailSent: true,
            },
        });
        if (existingReminder) {
            skipped++;
            continue;
        }
        const dateStr = appt.appointmentDate.toLocaleString("vi-VN", {
            timeZone: "Asia/Ho_Chi_Minh",
        });
        const title = "Nhắc lịch khám bệnh";
        const message = `Bạn có lịch khám với BS. ${appt.doctor.name} tại ${appt.doctor.hospital} vào ${dateStr}.`;
        await client_2.default.notification.create({
            data: {
                userId: appt.user.id,
                type: client_1.NotificationType.APPOINTMENT_REMINDER,
                title,
                message,
                appointmentId: appt.id,
                scheduledFor: appt.appointmentDate,
            },
        });
        try {
            await (0, emailService_1.sendAppointmentReminderEmail)(appt.user.email, appt.user.fullName || undefined, appt.doctor.name, appt.doctor.hospital, dateStr);
            await client_2.default.notification.updateMany({
                where: {
                    appointmentId: appt.id,
                    type: client_1.NotificationType.APPOINTMENT_REMINDER,
                    emailSent: false,
                },
                data: { emailSent: true },
            });
            sent++;
        }
        catch (err) {
            console.error(`Failed to send reminder for appointment ${appt.id}:`, err);
            skipped++;
        }
    }
    return { sent, skipped };
}
