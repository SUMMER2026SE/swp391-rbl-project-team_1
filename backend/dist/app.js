"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_rate_limit_1 = require("express-rate-limit");
const path_1 = __importDefault(require("path"));
const error_middleware_1 = require("./middleware/error.middleware");
// Import Routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const workspace_routes_1 = __importDefault(require("./routes/workspace.routes"));
const quiz_routes_1 = __importDefault(require("./routes/quiz.routes"));
const bkt_routes_1 = __importDefault(require("./routes/bkt.routes"));
const risk_routes_1 = __importDefault(require("./routes/risk.routes"));
const pomodoro_routes_1 = __importDefault(require("./routes/pomodoro.routes"));
const roadmap_routes_1 = __importDefault(require("./routes/roadmap.routes"));
const leaderboard_routes_1 = __importDefault(require("./routes/leaderboard.routes"));
const mentor_routes_1 = __importDefault(require("./routes/mentor.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const app = (0, express_1.default)();
// Middlewares
app.use((0, cors_1.default)({
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// Serve static files from 'uploads'
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// Rate Limiter for AI Endpoints
const aiLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // Limit each IP to 5 requests per `window`
    message: { success: false, message: 'Too many requests to AI services, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
// Routes Mount
app.use('/api/auth', auth_routes_1.default);
app.use('/api/workspace/ai-tasks', aiLimiter);
app.use('/api/workspace', workspace_routes_1.default);
// Apply rate limiter to the quiz generate endpoint specifically or whole route if we want
app.use('/api/quiz/questions', aiLimiter);
app.use('/api/quiz', quiz_routes_1.default);
app.use('/api/bkt', bkt_routes_1.default);
app.use('/api/risk', risk_routes_1.default);
app.use('/api/pomodoro', pomodoro_routes_1.default);
app.use('/api/roadmap', roadmap_routes_1.default);
app.use('/api/leaderboard', leaderboard_routes_1.default);
app.use('/api/mentor', mentor_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
// Simple Healthcheck
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date() });
});
// Global Error Handler Middleware
app.use(error_middleware_1.errorHandler);
exports.default = app;
