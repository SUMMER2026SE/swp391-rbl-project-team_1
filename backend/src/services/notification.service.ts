import { AppointmentStatus, NotificationType, Prisma } from "@prisma/client";
import prisma from "../prisma/client";
import { ApiError } from "../utils/apiError";
import { sendAppointmentReminderEmail } from "../utils/emailService";

export async function getUserNotifications(userId: string, unreadOnly = false) {
    return prisma.notification.findMany({
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

export async function markNotificationRead(userId: string, notificationId: string) {
    const notification = await prisma.notification.findFirst({
        where: { id: notificationId, userId },
    });

    if (!notification) {
        throw new ApiError("Notification not found", 404);
    }

    return prisma.notification.update({
        where: { id: notificationId },
        data: { read: true },
    });
}

export async function markAllNotificationsRead(userId: string) {
    await prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true },
    });
}

export async function createNotification(data: Prisma.NotificationCreateInput) {
    return prisma.notification.create({ data });
}

/**
 * Sends email reminders for appointments in the next 24 hours.
 * Call via cron: POST /api/internal/appointment-reminders (CRON_SECRET header).
 */
export async function processAppointmentReminders(): Promise<{ sent: number; skipped: number }> {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const appointments = await prisma.appointment.findMany({
        where: {
            status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
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
        const existingReminder = await prisma.notification.findFirst({
            where: {
                appointmentId: appt.id,
                type: NotificationType.APPOINTMENT_REMINDER,
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

        await prisma.notification.create({
            data: {
                userId: appt.user.id,
                type: NotificationType.APPOINTMENT_REMINDER,
                title,
                message,
                appointmentId: appt.id,
                scheduledFor: appt.appointmentDate,
            },
        });

        try {
            await sendAppointmentReminderEmail(
                appt.user.email,
                appt.user.fullName || undefined,
                appt.doctor.name,
                appt.doctor.hospital,
                dateStr
            );

            await prisma.notification.updateMany({
                where: {
                    appointmentId: appt.id,
                    type: NotificationType.APPOINTMENT_REMINDER,
                    emailSent: false,
                },
                data: { emailSent: true },
            });

            sent++;
        } catch (err) {
            console.error(`Failed to send reminder for appointment ${appt.id}:`, err);
            skipped++;
        }
    }

    return { sent, skipped };
}
