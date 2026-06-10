"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.allowedOrigins = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const workspace_routes_1 = __importDefault(require("./routes/workspace.routes"));
const quiz_routes_1 = __importDefault(require("./routes/quiz.routes"));
const bkt_routes_1 = __importDefault(require("./routes/bkt.routes"));
const risk_routes_1 = __importDefault(require("./routes/risk.routes"));
const pomodoro_routes_1 = __importDefault(require("./routes/pomodoro.routes"));
const roadmap_routes_1 = __importDefault(require("./routes/roadmap.routes"));
const leaderboard_routes_1 = __importDefault(require("./routes/leaderboard.routes"));
const mentor_routes_1 = __importDefault(require("./routes/mentor.routes"));
const auth_middleware_1 = require("./middleware/auth.middleware");
const error_middleware_1 = require("./middleware/error.middleware");
const auth_controller_1 = require("./controllers/auth.controller");
dotenv_1.default.config();
const app = (0, express_1.default)();
// Production CORS Configuration
const corsOrigin = process.env.CORS_ORIGIN;
exports.allowedOrigins = corsOrigin && corsOrigin !== "*" ? corsOrigin.split(",") : ["http://localhost:3000"];
app.use((0, cors_1.default)({
    origin: exports.allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express_1.default.json());
app.use("/public", express_1.default.static(path_1.default.join(__dirname, "../public")));
app.use("/api/auth", auth_routes_1.default);
app.use("/api/admin", admin_routes_1.default);
app.use("/api/workspace", workspace_routes_1.default);
app.use("/api/quiz", quiz_routes_1.default);
app.use("/api/bkt", bkt_routes_1.default);
app.use("/api/risk", risk_routes_1.default);
app.use("/api/pomodoro", pomodoro_routes_1.default);
app.use("/api/roadmap", roadmap_routes_1.default);
app.use("/api/leaderboard", leaderboard_routes_1.default);
app.use("/api/mentor", mentor_routes_1.default);
app.get("/api/profile", auth_middleware_1.verifyToken, auth_controller_1.getProfile);
app.get("/", (req, res) => {
    res.send("EduPath Platform API Running...");
});
app.use(error_middleware_1.errorHandler);
exports.default = app;
