import { Server, Socket } from "socket.io";
import prisma from "../prisma/client";

// Global io instance - used by services to emit events
let io: Server;

// Track online users: userId -> Set of socketIds
const onlineUsers = new Map<string, Set<string>>();

export function getIO(): Server {
    if (!io) throw new Error("Socket.io not initialized");
    return io;
}

export function initSocket(httpServer: any, allowedOrigins: string[]) {
    io = new Server(httpServer, {
        cors: {
            origin: allowedOrigins,
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    io.on("connection", (socket: Socket) => {
        console.log(`Socket connected: ${socket.id}`);

        // Track user status on connection
        socket.on("user-online", ({ userId }: { userId: string }) => {
            socket.data.userId = userId;
            if (!onlineUsers.has(userId)) {
                onlineUsers.set(userId, new Set());
            }
            onlineUsers.get(userId)!.add(socket.id);
            console.log(`User ${userId} went online. Sockets:`, onlineUsers.get(userId)!.size);
            io.emit("user-status-changed", { userId, status: "online" });
        });

        socket.on("get-online-users", () => {
            socket.emit("online-users-list", Array.from(onlineUsers.keys()));
        });

        // --- Payment notification rooms ---
        socket.on("join_user_room", ({ userId }: { userId: string }) => {
            socket.join(`user_${userId}`);
            console.log(`Socket ${socket.id} joined user_${userId}`);
            
            // Also register online user just in case
            socket.data.userId = userId;
            if (!onlineUsers.has(userId)) {
                onlineUsers.set(userId, new Set());
            }
            onlineUsers.get(userId)!.add(socket.id);
            io.emit("user-status-changed", { userId, status: "online" });
        });

        socket.on("join_doctor_room", ({ doctorId }: { doctorId: string }) => {
            socket.join(`doctor_${doctorId}`);
            console.log(`Socket ${socket.id} joined doctor_${doctorId}`);
        });

        socket.on("join_admin_room", () => {
            socket.join("admin");
            console.log(`Socket ${socket.id} joined admin room`);
        });

        // --- Video Call / Appointment rooms ---
        socket.on("join-room", ({ appointmentId, role, name, avatar }) => {
            socket.join(appointmentId);
            console.log(`User ${name} (${role}) joined room ${appointmentId}`);

            socket.to(appointmentId).emit("user-connected", {
                socketId: socket.id,
                role,
                name,
                avatar
            });
        });

        // Forward WebRTC signals (SDP offer/answer, ICE candidates)
        socket.on("signal", ({ appointmentId, signalData }) => {
            socket.to(appointmentId).emit("signal", {
                socketId: socket.id,
                signalData
            });
        });

        // Chat messages during the call
        socket.on("send-message", ({ appointmentId, message }) => {
            socket.to(appointmentId).emit("receive-message", message);
        });

        // Chat functionality
        socket.on("join-chat", async ({ conversationId, userId }) => {
            socket.join(`chat_${conversationId}`);
            console.log(`Socket ${socket.id} joined chat_${conversationId}`);

            if (userId) {
                try {
                    // Mark messages as read/seen
                    await prisma.message.updateMany({
                        where: {
                            conversationId,
                            senderId: { not: userId },
                            isRead: false
                        },
                        data: { isRead: true, status: "SEEN" }
                    });

                    // Find the conversation to get the other user
                    const conversation = await prisma.conversation.findUnique({
                        where: { id: conversationId }
                    });

                    // Emit to both users' personal rooms to sync tabs and update status
                    io.to(`user_${userId}`).emit("messages-seen", { conversationId });
                    if (conversation) {
                        let otherUserId = "";
                        if (userId === conversation.userId) {
                            const doctorUser = await prisma.user.findUnique({
                                where: { doctorId: conversation.doctorId }
                            });
                            if (doctorUser) otherUserId = doctorUser.id;
                        } else {
                            otherUserId = conversation.userId;
                        }
                        if (otherUserId) {
                            io.to(`user_${otherUserId}`).emit("messages-seen", { conversationId });
                        }
                    }
                    socket.to(`chat_${conversationId}`).emit("messages-seen", { conversationId });
                } catch (err) {
                    console.error("Error in join-chat marking messages as read:", err);
                }
            }
        });

        socket.on("mark-as-seen", async ({ conversationId, userId }) => {
            if (userId) {
                try {
                    await prisma.message.updateMany({
                        where: {
                            conversationId,
                            senderId: { not: userId },
                            isRead: false
                        },
                        data: { isRead: true, status: "SEEN" }
                    });

                    // Find the conversation to get the other user
                    const conversation = await prisma.conversation.findUnique({
                        where: { id: conversationId }
                    });

                    // Emit to both users' personal rooms to sync tabs and update status
                    io.to(`user_${userId}`).emit("messages-seen", { conversationId });
                    if (conversation) {
                        let otherUserId = "";
                        if (userId === conversation.userId) {
                            const doctorUser = await prisma.user.findUnique({
                                where: { doctorId: conversation.doctorId }
                            });
                            if (doctorUser) otherUserId = doctorUser.id;
                        } else {
                            otherUserId = conversation.userId;
                        }
                        if (otherUserId) {
                            io.to(`user_${otherUserId}`).emit("messages-seen", { conversationId });
                        }
                    }
                    io.to(`chat_${conversationId}`).emit("messages-seen", { conversationId });
                } catch (err) {
                    console.error("Error marking messages as seen:", err);
                }
            }
        });

        socket.on("join-video-call", ({ conversationId, userId, userName }) => {
            socket.to(`chat_${conversationId}`).emit("user-joined-video-call", { userId, userName });
            console.log(`User ${userId} joined video call for chat_${conversationId}`);
        });

        socket.on("leave-video-call", ({ conversationId, userId, userName }) => {
            socket.to(`chat_${conversationId}`).emit("user-left-video-call", { userId, userName });
            console.log(`User ${userId} left video call for chat_${conversationId}`);
        });

        socket.on("send-direct-message", async ({ conversationId, message }) => {
            try {
                // Find conversation and recipient user ID
                const conversation = await prisma.conversation.findUnique({
                    where: { id: conversationId }
                });

                if (!conversation) return;

                let recipientUserId = "";
                if (message.senderId === conversation.userId) {
                    const doctorUser = await prisma.user.findUnique({
                        where: { doctorId: conversation.doctorId }
                    });
                    if (doctorUser) recipientUserId = doctorUser.id;
                } else {
                    recipientUserId = conversation.userId;
                }

                // Determine message status
                let status = "SENT";
                let isRead = false;

                if (recipientUserId) {
                    const recipientSockets = onlineUsers.get(recipientUserId);
                    if (recipientSockets && recipientSockets.size > 0) {
                        status = "DELIVERED";

                        const chatRoom = io.sockets.adapter.rooms.get(`chat_${conversationId}`);
                        if (chatRoom) {
                            for (const socketId of recipientSockets) {
                                if (chatRoom.has(socketId)) {
                                    status = "SEEN";
                                    isRead = true;
                                    break;
                                }
                            }
                        }
                    }
                }

                // Update in DB
                const updatedMessage = await prisma.message.update({
                    where: { id: message.id },
                    data: { status, isRead }
                });

                // Emit to chat room, and recipient/sender personal rooms
                io.to(`chat_${conversationId}`).emit("receive-direct-message", { conversationId, message: updatedMessage });
                
                if (recipientUserId) {
                    io.to(`user_${recipientUserId}`).emit("receive-direct-message", { conversationId, message: updatedMessage });
                }
                if (conversation.doctorId) {
                    io.to(`doctor_${conversation.doctorId}`).emit("receive-direct-message", { conversationId, message: updatedMessage });
                }
                
                // For sender multi-tab sync
                if (message.senderId) {
                    io.to(`user_${message.senderId}`).emit("receive-direct-message", { conversationId, message: updatedMessage });
                }
            } catch (err) {
                console.error("Error in send-direct-message socket:", err);
                // Fallback: emit original message to chat room
                io.to(`chat_${conversationId}`).emit("receive-direct-message", { conversationId, message });
            }
        });

        // --- Video Call Invite Flow ---
        socket.on("video_call_invite", async (data) => {
            // data: { conversationId, doctorId, callerId, callerName, callerAvatar, callerRole, isDoctor }
            try {
                const conversation = await prisma.conversation.findUnique({
                    where: { id: data.conversationId },
                    include: {
                        doctor: {
                            include: {
                                userAccount: true
                            }
                        }
                    }
                });

                if (!conversation) {
                    console.error("Conversation not found for video call invite");
                    return;
                }

                let callerUserId = data.callerId;
                let calleeUserId = "";
                let isCallerDoctor = data.callerRole === "DOCTOR" || data.isDoctor === true;

                if (isCallerDoctor) {
                    // Doctor is calling patient
                    calleeUserId = conversation.userId;
                } else {
                    // Patient is calling doctor
                    calleeUserId = conversation.doctor?.userAccount?.id || "";
                }

                if (!calleeUserId) {
                    console.error("Callee user ID not found for video call");
                    return;
                }

                // Create Video Call Log in DB
                const callLog = await prisma.videoCallLog.create({
                    data: {
                        callerId: callerUserId,
                        calleeId: calleeUserId,
                        conversationId: data.conversationId,
                        status: "RINGING",
                        startedAt: new Date(),
                        callType: "DIRECT"
                    }
                });

                const inviteData = {
                    ...data,
                    callId: callLog.id,
                    calleeUserId,
                    callerUserId
                };

                // Emit to callee's personal room using user_${calleeUserId}
                io.to(`user_${calleeUserId}`).emit("video_call_invite", inviteData);
                // Also emit to chat room for active session tracking
                io.to(`chat_${data.conversationId}`).emit("video_call_invite", inviteData);
            } catch (err) {
                console.error("Error starting video call log:", err);
            }
        });

        socket.on("video_call_accepted", async (data) => {
            // data: { conversationId, callId }
            try {
                if (data.callId) {
                    await prisma.videoCallLog.update({
                        where: { id: data.callId },
                        data: {
                            status: "ACCEPTED",
                            startedAt: new Date() // reset start time to connection time
                        }
                    });
                }
            } catch (err) {
                console.error("Error accepting video call log:", err);
            }
            io.to(`chat_${data.conversationId}`).emit("video_call_accepted", data);
        });

        socket.on("video_call_declined", async (data) => {
            // data: { conversationId, callId }
            try {
                if (data.callId) {
                    await prisma.videoCallLog.update({
                        where: { id: data.callId },
                        data: {
                            status: "REJECTED",
                            endedAt: new Date()
                        }
                    });
                }
            } catch (err) {
                console.error("Error declining video call log:", err);
            }
            io.to(`chat_${data.conversationId}`).emit("video_call_declined", data);
        });

        socket.on("video_call_missed", async (data) => {
            // data: { conversationId, callId }
            try {
                if (data.callId) {
                    await prisma.videoCallLog.update({
                        where: { id: data.callId },
                        data: {
                            status: "MISSED",
                            endedAt: new Date()
                        }
                    });
                }
            } catch (err) {
                console.error("Error setting video call to missed:", err);
            }
            io.to(`chat_${data.conversationId}`).emit("video_call_missed", data);
        });

        socket.on("end-call", async (data) => {
            // data: { conversationId, callId }
            try {
                if (data.callId) {
                    const log = await prisma.videoCallLog.findUnique({
                        where: { id: data.callId }
                    });
                    if (log) {
                        const endedAt = new Date();
                        let durationSeconds = 0;
                        let finalStatus = "COMPLETED";

                        if (log.status === "ACCEPTED") {
                            durationSeconds = Math.round((endedAt.getTime() - log.startedAt.getTime()) / 1000);
                        } else if (log.status === "RINGING") {
                            finalStatus = "MISSED";
                        }

                        await prisma.videoCallLog.update({
                            where: { id: data.callId },
                            data: {
                                status: finalStatus,
                                endedAt,
                                durationSeconds: durationSeconds > 0 ? durationSeconds : null
                            }
                        });
                    }
                }
            } catch (err) {
                console.error("Error ending video call log:", err);
            }
            socket.to(`chat_${data.conversationId}`).emit("call-ended", data);
        });

        socket.on("disconnecting", () => {
            const rooms = Array.from(socket.rooms);
            rooms.forEach((room) => {
                if (room !== socket.id) {
                    socket.to(room).emit("user-disconnected", { socketId: socket.id });
                }
            });
        });

        socket.on("disconnect", () => {
            const userId = socket.data.userId;
            if (userId && onlineUsers.has(userId)) {
                const sockets = onlineUsers.get(userId)!;
                sockets.delete(socket.id);
                if (sockets.size === 0) {
                    onlineUsers.delete(userId);
                    console.log(`User ${userId} went offline.`);
                    io.emit("user-status-changed", { userId, status: "offline" });
                }
            }
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });

    return io;
}