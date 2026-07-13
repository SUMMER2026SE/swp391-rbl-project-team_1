"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocket = initSocket;
const socket_io_1 = require("socket.io");
function initSocket(httpServer, allowedOrigins) {
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: allowedOrigins,
            methods: ["GET", "POST"],
            credentials: true
        }
    });
    io.on("connection", (socket) => {
        console.log(`Socket connected: ${socket.id}`);
        // Join room for a specific appointment
        socket.on("join-room", ({ appointmentId, role, name, avatar }) => {
            socket.join(appointmentId);
            console.log(`User ${name} (${role}) joined room ${appointmentId}`);
            // Broadcast to other users in room that a user has connected
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
        // End call signal
        socket.on("end-call", ({ appointmentId }) => {
            socket.to(appointmentId).emit("call-ended");
        });
        // Chat functionality
        socket.on("join-chat", ({ conversationId }) => {
            socket.join(`chat_${conversationId}`);
            console.log(`Socket ${socket.id} joined chat_${conversationId}`);
        });
        socket.on("send-direct-message", ({ conversationId, message }) => {
            socket.to(`chat_${conversationId}`).emit("receive-direct-message", message);
        });
        // --- Video Call Invite Flow ---
        socket.on("video_call_invite", (data) => {
            socket.to(`chat_${data.conversationId}`).emit("video_call_invite", data);
        });
        socket.on("video_call_accepted", (data) => {
            socket.to(`chat_${data.conversationId}`).emit("video_call_accepted", data);
        });
        socket.on("video_call_declined", (data) => {
            socket.to(`chat_${data.conversationId}`).emit("video_call_declined", data);
        });
        socket.on("disconnecting", () => {
            // Find all rooms this socket is in
            const rooms = Array.from(socket.rooms);
            rooms.forEach((room) => {
                if (room !== socket.id) {
                    socket.to(room).emit("user-disconnected", { socketId: socket.id });
                }
            });
        });
        socket.on("disconnect", () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });
    return io;
}
