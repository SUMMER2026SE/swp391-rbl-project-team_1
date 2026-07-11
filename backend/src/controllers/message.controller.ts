import { NextFunction, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { ApiError } from "../utils/apiError";

const prisma = new PrismaClient();

// Get all conversations for the logged in user/doctor
export async function getConversations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = req.user?.id;
        const role = req.user?.role;

        if (!userId) {
            throw new ApiError("Unauthorized", 401);
        }

        let conversations;

        if (role === "DOCTOR") {
            // Find doctorId for this user
            const doctorUser = await prisma.user.findUnique({
                where: { id: userId },
                include: { doctor: true }
            });
            const doctorId = doctorUser?.doctor?.id;
            if (!doctorId) throw new ApiError("Doctor profile not found", 404);

            conversations = await prisma.conversation.findMany({
                where: { doctorId },
                include: {
                    user: {
                        select: { id: true, fullName: true, avatar: true }
                    },
                    messages: {
                        orderBy: { createdAt: "desc" },
                        take: 1
                    }
                },
                orderBy: { updatedAt: "desc" }
            });
        } else {
            conversations = await prisma.conversation.findMany({
                where: { userId },
                include: {
                    doctor: {
                        select: { id: true, name: true, avatar: true, specialty: true }
                    },
                    messages: {
                        orderBy: { createdAt: "desc" },
                        take: 1
                    }
                },
                orderBy: { updatedAt: "desc" }
            });
        }

        res.json({ conversations });
    } catch (error) {
        next(error);
    }
}

// Get messages for a conversation
export async function getMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = req.user?.id;
        const role = req.user?.role;
        const { conversationId } = req.params;

        if (!userId) {
            throw new ApiError("Unauthorized", 401);
        }

        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId }
        });

        if (!conversation) {
            throw new ApiError("Conversation not found", 404);
        }

        // Access control
        if (role === "USER" && conversation.userId !== userId) {
            throw new ApiError("Forbidden", 403);
        }
        if (role === "DOCTOR") {
            const doctorUser = await prisma.user.findUnique({
                where: { id: userId },
                include: { doctor: true }
            });
            if (conversation.doctorId !== doctorUser?.doctor?.id) {
                throw new ApiError("Forbidden", 403);
            }
        }

        const messages = await prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: "asc" }
        });

        // Mark messages as read
        await prisma.message.updateMany({
            where: {
                conversationId,
                senderId: { not: userId },
                isRead: false
            },
            data: { isRead: true }
        });

        res.json({ messages });
    } catch (error) {
        next(error);
    }
}

// Start a conversation or get existing one by doctorId
export async function getOrCreateConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = req.user?.id;
        const { doctorId } = req.body;

        if (!userId || req.user?.role !== "USER") {
            throw new ApiError("Only patients can initiate conversations this way", 403);
        }

        let conversation = await prisma.conversation.findUnique({
            where: {
                userId_doctorId: {
                    userId,
                    doctorId
                }
            }
        });

        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    userId,
                    doctorId
                }
            });
        }

        res.json({ conversation });
    } catch (error) {
        next(error);
    }
}

// Send a message
export async function sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = req.user?.id;
        const { conversationId } = req.params;
        const { content } = req.body;

        if (!userId) {
            throw new ApiError("Unauthorized", 401);
        }
        if (!content || content.trim() === "") {
            throw new ApiError("Message content cannot be empty", 400);
        }

        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId }
        });

        if (!conversation) {
            throw new ApiError("Conversation not found", 404);
        }

        const message = await prisma.message.create({
            data: {
                conversationId,
                senderId: userId,
                content
            }
        });

        // Update conversation's updatedAt
        await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() }
        });

        res.status(201).json({ message });
    } catch (error) {
        next(error);
    }
}
