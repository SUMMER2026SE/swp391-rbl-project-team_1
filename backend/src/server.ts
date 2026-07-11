import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { createServer } from "http";
import { initSocket } from "./utils/socket";

import userRoutes from "./routes/user.routes";
import authRoutes from "./routes/auth.routes";
import doctorRoutes from "./routes/doctor.routes";
import appointmentRoutes from "./routes/appointment.routes";
import adminRoutes from "./routes/admin.routes";
import chatRoutes from "./routes/chat.routes";
import doctorDashboardRoutes from "./routes/doctor-dashboard.routes";
import articleRoutes from "./routes/article.routes";
import reviewRoutes from "./routes/review.routes";
import paymentRoutes from "./routes/payment.routes";
import packageRoutes from "./routes/package.routes";
import patientProfileRoutes from "./routes/patient-profile.routes";
import messageRoutes from "./routes/message.routes";
import { initReminderScheduler } from "./utils/emailService";
import { verifyToken } from "./middleware/auth.middleware";
import { errorHandler } from "./middleware/error.middleware";
import { getProfile } from "./controllers/auth.controller";
import { autoCancelExpiredAppointments } from "./services/appointment.service";

dotenv.config();

const app = express();

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
app.use(express.json());
app.use("/public", express.static(path.join(__dirname, "../public")));

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", doctorRoutes);
app.use("/api", appointmentRoutes);
app.use("/api", adminRoutes);
app.use("/api", chatRoutes);
app.use("/api", articleRoutes);
app.use("/api", reviewRoutes);
app.use("/api", paymentRoutes);
app.use("/api", packageRoutes);
app.use("/api/patient-profiles", patientProfileRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/doctor", doctorDashboardRoutes);
app.get("/api/profile", verifyToken, getProfile);


app.get("/", (req, res) => {
  res.send("Healthcare Booking API Running...");
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const httpServer = createServer(app);
initSocket(httpServer, allowedOrigins);

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  initReminderScheduler();
  
  // Run expired payment check immediately on startup
  console.log("[Scheduler] Initializing auto-cancellation scheduler for expired payments...");
  autoCancelExpiredAppointments().catch((err) =>
    console.error("[Scheduler] Expired payments cleanup failed on startup:", err)
  );

  // Run expired payment check every 5 minutes (300000 ms)
  setInterval(() => {
    autoCancelExpiredAppointments().catch((err) =>
      console.error("[Scheduler] Scheduled expired payments cleanup failed:", err)
    );
  }, 5 * 60 * 1000);
});