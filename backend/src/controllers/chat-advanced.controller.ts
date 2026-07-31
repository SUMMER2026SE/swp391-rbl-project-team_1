import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { getIO } from "../utils/socket";

const prisma = new PrismaClient();

// 1. Recall Message
export const recallMessage = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { messageId } = req.params;

        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const message = await prisma.message.findUnique({
            where: { id: messageId },
            include: { conversation: true }
        });

        if (!message) {
            res.status(404).json({ success: false, message: "Tin nhắn không tồn tại" });
            return;
        }

        if (message.senderId !== userId) {
            res.status(403).json({ success: false, message: "Bạn không thể thu hồi tin nhắn của người khác" });
            return;
        }

        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        if (message.createdAt < tenMinutesAgo) {
            res.status(403).json({ success: false, message: "Chỉ có thể thu hồi tin nhắn trong vòng 10 phút" });
            return;
        }

        if (message.isRecalled) {
            res.status(400).json({ success: false, message: "Tin nhắn đã được thu hồi trước đó" });
            return;
        }

        await prisma.message.update({
            where: { id: messageId },
            data: {
                isRecalled: true,
                recalledAt: new Date()
            }
        });

        // Emit socket event to conversation room
        const io = getIO();
        io.to(`chat_${message.conversationId}`).emit("message_recalled", { messageId });

        res.status(200).json({ success: true, message: "Đã thu hồi tin nhắn" });
    } catch (error) {
        console.error("Error recalling message:", error);
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ" });
    }
};

// 2. Pin Message
export const pinMessage = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { conversationId, messageId } = req.params;

        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        // Validate message exists in conversation
        const message = await prisma.message.findFirst({
            where: { id: messageId, conversationId }
        });

        if (!message) {
            res.status(404).json({ success: false, message: "Tin nhắn không tồn tại" });
            return;
        }

        // Check if already pinned
        const existingPin = await prisma.pinnedMessage.findFirst({
            where: { conversationId, messageId }
        });

        if (existingPin) {
            res.status(400).json({ success: false, message: "Tin nhắn này đã được ghim" });
            return;
        }

        // Check pin limit (max 3)
        const currentPinsCount = await prisma.pinnedMessage.count({
            where: { conversationId }
        });

        if (currentPinsCount >= 3) {
            res.status(400).json({ success: false, message: "Chỉ có thể ghim tối đa 3 tin nhắn. Hãy bỏ ghim một tin trước" });
            return;
        }

        const newPin = await prisma.pinnedMessage.create({
            data: {
                conversationId,
                messageId,
                pinnedById: userId
            },
            include: {
                message: {
                    include: { sender: { select: { fullName: true, avatar: true } } }
                },
                pinnedBy: { select: { fullName: true, avatar: true } }
            }
        });

        const io = getIO();
        io.to(`chat_${conversationId}`).emit("message_pinned", newPin);

        res.status(201).json({ success: true, data: newPin });
    } catch (error) {
        console.error("Error pinning message:", error);
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ" });
    }
};

// 3. Unpin Message
export const unpinMessage = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { conversationId, messageId } = req.params;

        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const existingPin = await prisma.pinnedMessage.findFirst({
            where: { conversationId, messageId }
        });

        if (!existingPin) {
            res.status(404).json({ success: false, message: "Tin ghim không tồn tại" });
            return;
        }

        await prisma.pinnedMessage.delete({
            where: { id: existingPin.id }
        });

        const io = getIO();
        io.to(`chat_${conversationId}`).emit("message_unpinned", { messageId });

        res.status(200).json({ success: true, message: "Đã bỏ ghim tin nhắn" });
    } catch (error) {
        console.error("Error unpinning message:", error);
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ" });
    }
};

// 4. Get Pinned Messages
export const getPinnedMessages = async (req: Request, res: Response): Promise<void> => {
    try {
        const { conversationId } = req.params;

        const pins = await prisma.pinnedMessage.findMany({
            where: { conversationId },
            include: {
                message: {
                    include: { sender: { select: { fullName: true, avatar: true } } }
                },
                pinnedBy: { select: { fullName: true, avatar: true } }
            },
            orderBy: { pinnedAt: 'desc' }
        });

        res.status(200).json({ success: true, data: pins });
    } catch (error) {
        console.error("Error fetching pinned messages:", error);
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ" });
    }
};

// 5. Toggle/Upsert Emoji Reaction
export const reactToMessage = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { messageId } = req.params;
        const { emoji } = req.body;

        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        if (!emoji) {
            res.status(400).json({ success: false, message: "Emoji is required" });
            return;
        }

        const message = await prisma.message.findUnique({
            where: { id: messageId }
        });

        if (!message) {
            res.status(404).json({ success: false, message: "Tin nhắn không tồn tại" });
            return;
        }

        // Check if existing reaction by this user
        const existingReaction = await prisma.messageReaction.findUnique({
            where: {
                messageId_userId: {
                    messageId,
                    userId
                }
            }
        });

        if (existingReaction) {
            if (existingReaction.emoji === emoji) {
                // Toggle off: delete reaction if same emoji
                await prisma.messageReaction.delete({
                    where: { id: existingReaction.id }
                });
            } else {
                // Update to new emoji
                await prisma.messageReaction.update({
                    where: { id: existingReaction.id },
                    data: { emoji }
                });
            }
        } else {
            // Create new reaction
            await prisma.messageReaction.create({
                data: {
                    messageId,
                    userId,
                    emoji
                }
            });
        }

        // Aggregate reactions for the message to broadcast
        const allReactions = await prisma.messageReaction.findMany({
            where: { messageId },
            select: { emoji: true, userId: true, user: { select: { fullName: true } } }
        });

        // Group by emoji
        const reactionsMap = allReactions.reduce((acc, curr) => {
            if (!acc[curr.emoji]) {
                acc[curr.emoji] = { count: 0, users: [] };
            }
            acc[curr.emoji].count += 1;
            acc[curr.emoji].users.push({ id: curr.userId, name: curr.user?.fullName || null });
            return acc;
        }, {} as Record<string, { count: number, users: { id: string, name: string | null }[] }>);

        const io = getIO();
        io.to(`chat_${message.conversationId}`).emit("message_reacted", {
            messageId,
            reactions: reactionsMap
        });

        res.status(200).json({ success: true, reactions: reactionsMap });
    } catch (error) {
        console.error("Error reacting to message:", error);
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ" });
    }
};
