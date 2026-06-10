import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

import authRoutes from "./routes/auth.routes";
import adminRoutes from "./routes/admin.routes";
import workspaceRoutes from "./routes/workspace.routes";
import quizRoutes from "./routes/quiz.routes";
import bktRoutes from "./routes/bkt.routes";
import riskRoutes from "./routes/risk.routes";
import pomodoroRoutes from "./routes/pomodoro.routes";
import roadmapRoutes from "./routes/roadmap.routes";
import leaderboardRoutes from "./routes/leaderboard.routes";
import mentorRoutes from "./routes/mentor.routes";

import { verifyToken } from "./middleware/auth.middleware";
import { errorHandler } from "./middleware/error.middleware";
import { getProfile } from "./controllers/auth.controller";

dotenv.config();

const app = express();

// Production CORS Configuration
const corsOrigin = process.env.CORS_ORIGIN;
export const allowedOrigins = corsOrigin && corsOrigin !== "*" ? corsOrigin.split(",") : ["http://localhost:3000"];

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

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/workspace", workspaceRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/bkt", bktRoutes);
app.use("/api/risk", riskRoutes);
app.use("/api/pomodoro", pomodoroRoutes);
app.use("/api/roadmap", roadmapRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/mentor", mentorRoutes);

app.get("/api/profile", verifyToken, getProfile);

app.get("/", (req, res) => {
  res.send("EduPath Platform API Running...");
});

app.use(errorHandler);

export default app;
