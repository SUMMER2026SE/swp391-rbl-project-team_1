"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const socket_1 = require("../utils/socket");
const createNotification = async ({ userId, type, title, message, data }) => {
    try {
        // Create new notification
        const notification = await client_1.default.notification.create({
            data: {
                userId,
                type,
                title,
                message,
                data: data ? data : null,
            }
        });
        // Delete oldest if count > 50
        const count = await client_1.default.notification.count({ where: { userId } });
        if (count > 50) {
            const oldest = await client_1.default.notification.findFirst({
                where: { userId },
                orderBy: { createdAt: 'asc' },
                select: { id: true }
            });
            if (oldest) {
                await client_1.default.notification.delete({ where: { id: oldest.id } });
            }
        }
        // Emit socket event to the user's room
        try {
            const io = (0, socket_1.getIO)();
            io.to(`user_${userId}`).emit("new_notification", notification);
        }
        catch (socketError) {
            console.error("Socket error during notification emit:", socketError);
        }
        return notification;
    }
    catch (error) {
        console.error("Error creating notification:", error);
        throw error;
    }
};
exports.createNotification = createNotification;
