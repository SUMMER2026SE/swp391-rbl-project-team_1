"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConversations = getConversations;
exports.getMessages = getMessages;
exports.getOrCreateConversation = getOrCreateConversation;
exports.sendMessage = sendMessage;
const client_1 = require("@prisma/client");
const apiError_1 = require("../utils/apiError");
const prisma = new client_1.PrismaClient();
// Get all conversations for the logged in user/doctor
async function getConversations(req, res, next) {
    try {
        const userId = req.user?.id || req.user?.userId;
        const role = req.user?.role;
        if (!userId) {
            throw new apiError_1.ApiError("Unauthorized", 401);
        }
        let conversations;
        if (role === "DOCTOR") {
            // Find doctorId for this user
            const doctorUser = await prisma.user.findUnique({
                where: { id: userId },
                include: { doctor: true }
            });
            const doctorId = doctorUser?.doctor?.id;
            if (!doctorId)
                throw new apiError_1.ApiError("Doctor profile not found", 404);
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
        }
        else {
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
    }
    catch (error) {
        next(error);
    }
}
// Get messages for a conversation
async function getMessages(req, res, next) {
    try {
        const userId = req.user?.id || req.user?.userId;
        const role = req.user?.role;
        const conversationId = req.params.conversationId;
        if (!userId) {
            throw new apiError_1.ApiError("Unauthorized", 401);
        }
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId }
        });
        if (!conversation) {
            throw new apiError_1.ApiError("Conversation not found", 404);
        }
        // Access control
        if (role === "USER" && conversation.userId !== userId) {
            throw new apiError_1.ApiError("Forbidden", 403);
        }
        if (role === "DOCTOR") {
            const doctorUser = await prisma.user.findUnique({
                where: { id: userId },
                include: { doctor: true }
            });
            if (conversation.doctorId !== doctorUser?.doctor?.id) {
                throw new apiError_1.ApiError("Forbidden", 403);
            }
        }
        const messages = await prisma.message.findMany({
            where: { conversationId: conversationId },
            orderBy: { createdAt: "asc" }
        });
        // Mark messages as read
        await prisma.message.updateMany({
            where: {
                conversationId: conversationId,
                senderId: { not: userId },
                isRead: false
            },
            data: { isRead: true }
        });
        res.json({ messages });
    }
    catch (error) {
        next(error);
    }
}
// Start a conversation or get existing one by doctorId
async function getOrCreateConversation(req, res, next) {
    try {
        const userId = req.user?.id || req.user?.userId;
        const { doctorId } = req.body;
        if (!userId || req.user?.role !== "USER") {
            throw new apiError_1.ApiError("Only patients can initiate conversations this way", 403);
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
    }
    catch (error) {
        next(error);
    }
}
// Send a message
async function sendMessage(req, res, next) {
    try {
        const userId = req.user?.id;
        const conversationId = req.params.conversationId;
        const { content } = req.body;
        if (!userId) {
            throw new apiError_1.ApiError("Unauthorized", 401);
        }
        if (!content || content.trim() === "") {
            throw new apiError_1.ApiError("Message content cannot be empty", 400);
        }
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId }
        });
        if (!conversation) {
            throw new apiError_1.ApiError("Conversation not found", 404);
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
    }
    catch (error) {
        next(error);
    }
}
