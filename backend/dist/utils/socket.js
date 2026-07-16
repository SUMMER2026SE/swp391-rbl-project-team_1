"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIO = getIO;
exports.initSocket = initSocket;
const socket_io_1 = require("socket.io");
// Global io instance - used by services to emit events
let io;
function getIO() {
    if (!io)
        throw new Error("Socket.io not initialized");
    return io;
}
function initSocket(httpServer, allowedOrigins) {
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: allowedOrigins,
            methods: ["GET", "POST"],
            credentials: true
        }
    });
    io.on("connection", (socket) => {
        console.log(`Socket connected: ${socket.id}`);
        // --- Payment notification rooms ---
        socket.on("join_user_room", ({ userId }) => {
            socket.join(`user_${userId}`);
            console.log(`Socket ${socket.id} joined user_${userId}`);
        });
        socket.on("join_doctor_room", ({ doctorId }) => {
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
