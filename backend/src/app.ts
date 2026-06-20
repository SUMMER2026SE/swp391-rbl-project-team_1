import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import path from 'path';
import { errorHandler } from './middleware/error.middleware';

// Import Routes
import authRoutes from './routes/auth.routes';
import workspaceRoutes from './routes/workspace.routes';
import quizRoutes from './routes/quiz.routes';
import bktRoutes from './routes/bkt.routes';
import riskRoutes from './routes/risk.routes';
import pomodoroRoutes from './routes/pomodoro.routes';
import roadmapRoutes from './routes/roadmap.routes';
import leaderboardRoutes from './routes/leaderboard.routes';
import mentorRoutes from './routes/mentor.routes';
import adminRoutes from './routes/admin.routes';
import communityRoutes from './routes/community.routes';
import walletRoutes from './routes/wallet.routes';

const app = express();

// Middlewares
app.use(cors({ 
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'], 
  credentials: true 
}));
app.use(express.json());
app.use(cookieParser());

// Serve static files from 'uploads'
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rate Limiter for AI Endpoints
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 requests per `window`
  message: { success: false, message: 'Too many requests to AI services, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Routes Mount
app.use('/api/auth', authRoutes);
app.use('/api/workspace/ai-tasks', aiLimiter);
app.use('/api/workspace', workspaceRoutes);
// Apply rate limiter to the quiz generate endpoint specifically or whole route if we want
app.use('/api/quiz/questions', aiLimiter);
app.use('/api/quiz', quizRoutes);
app.use('/api/bkt', bktRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/pomodoro', pomodoroRoutes);
app.use('/api/roadmap', roadmapRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/mentor', mentorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/wallet', walletRoutes);

// Simple Healthcheck
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Global Error Handler Middleware
app.use(errorHandler);

export default app;
