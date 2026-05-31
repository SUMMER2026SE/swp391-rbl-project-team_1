import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

import passport from "passport";
import "./config/passport"; // Load passport strategies config
import userRoutes from "./routes/user.routes";
import authRoutes from "./routes/auth.routes";
import authGoogleRoutes from "./routes/authGoogle";
import doctorRoutes from "./routes/doctor.routes";
import appointmentRoutes from "./routes/appointment.routes";
import adminRoutes from "./routes/admin.routes";
import chatRoutes from "./routes/chat.routes";
import doctorDashboardRoutes from "./routes/doctor-dashboard.routes";
import medicalRecordRoutes from "./routes/medical-record.routes";
import complaintRoutes from "./routes/complaint.routes";
import articleRoutes from "./routes/article.routes";
import reviewRoutes from "./routes/review.routes";
import healthProfileRoutes from "./routes/health-profile.routes";
import notificationRoutes from "./routes/notification.routes";
import clinicRoutes from "./routes/clinic.routes";
import clinicManagerRoutes from "./routes/clinic-manager.routes";
import { verifyToken } from "./middleware/auth.middleware";
import { errorHandler } from "./middleware/error.middleware";
import { getProfile } from "./controllers/auth.controller";

dotenv.config();

import { createServer } from "http";
import { Server } from "socket.io";
import prisma from "./prisma/client";

const app = express();
const httpServer = createServer(app);
app.use(passport.initialize()); // Initialize Passport


// Production CORS Configuration
const corsOrigin = process.env.CORS_ORIGIN;
const allowedOrigins = corsOrigin && corsOrigin !== "*" ? corsOrigin.split(",") : ["http://localhost:3000"];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use("/public", express.static(path.join(__dirname, "../public")));

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use(authGoogleRoutes); // Register Google Auth Routes
app.use("/api", doctorRoutes);
app.use("/api", appointmentRoutes);
app.use("/api", adminRoutes);
app.use("/api", chatRoutes);
app.use("/api/doctor", doctorDashboardRoutes);
app.use("/api", medicalRecordRoutes);
app.use("/api", complaintRoutes);
app.use("/api", articleRoutes);
app.use("/api", reviewRoutes);
app.use("/api", healthProfileRoutes);
app.use("/api", notificationRoutes);
app.use("/api", clinicRoutes);
app.use("/api", clinicManagerRoutes);
app.get("/api/profile", verifyToken, getProfile);

app.get("/", (req, res) => {
  res.send("Healthcare Booking API Running...");
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Map to track user socket associations: userId -> socketId
const userSocketMap = new Map<string, string>();

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId as string;
  if (userId) {
    userSocketMap.set(userId, socket.id);
    console.log(`🔌 User connected: ${userId} with socket ID: ${socket.id}`);
  }

  socket.on("doctor:call-patient", async (data) => {
    const { appointmentId, doctorId, patientId, roomId } = data;
    console.log(`📞 Doctor ${doctorId} calling patient ${patientId} for appointment ${appointmentId}`);

    try {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          videoCallStatus: "CALLING",
          videoCallRoomId: roomId,
        },
      });
    } catch (err) {
      console.error("Failed to update appointment on call start:", err);
    }

    const patientSocketId = userSocketMap.get(patientId);
    if (patientSocketId) {
      let doctorName = "Bác sĩ";
      try {
        const doctor = await prisma.doctor.findUnique({
          where: { id: doctorId },
          include: { userAccount: true },
        });
        if (doctor && doctor.userAccount) {
          doctorName = doctor.userAccount.fullName || doctorName;
        }
      } catch (err) {
        console.error("Failed to fetch doctor info for notification:", err);
      }

      io.to(patientSocketId).emit("patient:incoming-call", {
        appointmentId,
        doctorId,
        doctorName,
        roomId,
      });
    } else {
      socket.emit("doctor:call-failed", { message: "Bệnh nhân không trực tuyến." });
    }
  });

  socket.on("patient:accept-call", async (data) => {
    const { appointmentId, doctorId, patientId, roomId } = data;
    console.log(`✅ Patient ${patientId} accepted call for appointment ${appointmentId}`);

    try {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { videoCallStatus: "IN_CALL" },
      });
    } catch (err) {
      console.error("Failed to update appointment on accept:", err);
    }

    const doctorSocketId = userSocketMap.get(doctorId);
    if (doctorSocketId) {
      io.to(doctorSocketId).emit("patient:call-accepted", {
        appointmentId,
        patientId,
        roomId,
      });
    }
  });

  socket.on("patient:reject-call", async (data) => {
    const { appointmentId, doctorId, patientId } = data;
    console.log(`❌ Patient ${patientId} rejected call for appointment ${appointmentId}`);

    try {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { videoCallStatus: "ENDED" },
      });
    } catch (err) {
      console.error("Failed to update appointment on reject:", err);
    }

    const doctorSocketId = userSocketMap.get(doctorId);
    if (doctorSocketId) {
      io.to(doctorSocketId).emit("patient:call-rejected", {
        appointmentId,
        message: "Bệnh nhân đã từ chối cuộc gọi.",
      });
    }
  });

  socket.on("webrtc:signal", (data) => {
    const { toUserId, signal } = data;
    const targetSocketId = userSocketMap.get(toUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit("webrtc:signal", {
        fromUserId: userId,
        signal,
      });
    }
  });

  socket.on("call:ended", async (data) => {
    const { appointmentId, partnerId } = data;
    console.log(`🔌 Call ended for appointment ${appointmentId}`);

    try {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { videoCallStatus: "ENDED" },
      });
    } catch (err) {
      console.error("Failed to update appointment on end:", err);
    }

    const partnerSocketId = userSocketMap.get(partnerId);
    if (partnerSocketId) {
      io.to(partnerSocketId).emit("call:ended", { appointmentId });
    }
  });

  socket.on("disconnect", () => {
    if (userId) {
      userSocketMap.delete(userId);
      console.log(`🔌 User disconnected: ${userId}`);
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});