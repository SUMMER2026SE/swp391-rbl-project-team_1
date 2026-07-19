import prisma from "../prisma/client";
import { getIO } from "../utils/socket";
import { NotificationType } from "@prisma/client";

interface CreateNotificationParams {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: any;
}

export const createNotification = async ({ userId, type, title, message, data }: CreateNotificationParams) => {
    try {
        // Create new notification
        const notification = await prisma.notification.create({
            data: {
                userId,
                type,
                title,
                message,
                data: data ? data : null,
            }
        });

        // Delete oldest if count > 50
        const count = await prisma.notification.count({ where: { userId } });
        if (count > 50) {
            const oldest = await prisma.notification.findFirst({
                where: { userId },
                orderBy: { createdAt: 'asc' },
                select: { id: true }
            });
            if (oldest) {
                await prisma.notification.delete({ where: { id: oldest.id } });
            }
        }

        // Emit socket event to the user's room
        try {
            const io = getIO();
            io.to(`user_${userId}`).emit("new_notification", notification);
        } catch (socketError) {
            console.error("Socket error during notification emit:", socketError);
        }

        return notification;
    } catch (error) {
        console.error("Error creating notification:", error);
        throw error;
    }
};
