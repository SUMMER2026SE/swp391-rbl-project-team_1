import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

import userRoutes from "./routes/user.routes";
import authRoutes from "./routes/auth.routes";
import doctorRoutes from "./routes/doctor.routes";
import appointmentRoutes from "./routes/appointment.routes";
import adminRoutes from "./routes/admin.routes";
import chatRoutes from "./routes/chat.routes";
import doctorDashboardRoutes from "./routes/doctor-dashboard.routes";
import { verifyToken } from "./middleware/auth.middleware";
import { errorHandler } from "./middleware/error.middleware";
import { getProfile } from "./controllers/auth.controller";

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
app.use("/api/doctor", doctorDashboardRoutes);
app.get("/api/profile", verifyToken, getProfile);

app.get("/", (req, res) => {
  res.send("Healthcare Booking API Running...");
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});