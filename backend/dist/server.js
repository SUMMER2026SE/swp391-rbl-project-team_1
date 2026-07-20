"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const http_1 = require("http");
const socket_1 = require("./utils/socket");
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const doctor_routes_1 = __importDefault(require("./routes/doctor.routes"));
const appointment_routes_1 = __importDefault(require("./routes/appointment.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const chat_routes_1 = __importDefault(require("./routes/chat.routes"));
const doctor_dashboard_routes_1 = __importDefault(require("./routes/doctor-dashboard.routes"));
const article_routes_1 = __importDefault(require("./routes/article.routes"));
const review_routes_1 = __importDefault(require("./routes/review.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const package_routes_1 = __importDefault(require("./routes/package.routes"));
const message_routes_1 = __importDefault(require("./routes/message.routes"));
const medicine_routes_1 = __importDefault(require("./routes/medicine.routes"));
const medical_record_routes_1 = __importDefault(require("./routes/medical-record.routes"));
const video_call_routes_1 = __importDefault(require("./routes/video-call.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const voucher_routes_1 = __importDefault(require("./routes/voucher.routes"));
const emailService_1 = require("./utils/emailService");
const reminderJob_1 = require("./jobs/reminderJob");
const auth_middleware_1 = require("./middleware/auth.middleware");
const error_middleware_1 = require("./middleware/error.middleware");
const auth_controller_1 = require("./controllers/auth.controller");
const appointment_service_1 = require("./services/appointment.service");
dotenv_1.default.config();
// Patch BigInt to be serialized as string in JSON responses
BigInt.prototype.toJSON = function () {
    return this.toString();
};
const app = (0, express_1.default)();
// Production CORS Configuration
const corsOrigin = process.env.CORS_ORIGIN;
const allowedOrigins = corsOrigin && corsOrigin !== "*"
    ? corsOrigin.split(",")
    : ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"];
app.use((0, cors_1.default)({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use("/public", express_1.default.static(path_1.default.join(__dirname, "../public")));
app.use("/api/users", user_routes_1.default);
app.use("/api/auth", auth_routes_1.default);
app.use("/api", doctor_routes_1.default);
app.use("/api", appointment_routes_1.default);
app.use("/api", admin_routes_1.default);
app.use("/api", chat_routes_1.default);
app.use("/api", article_routes_1.default);
app.use("/api", review_routes_1.default);
app.use("/api/payment", payment_routes_1.default);
app.use("/api/payments", payment_routes_1.default); // /api/payments/status/:orderCode (public polling)
app.use("/api", package_routes_1.default);
app.use("/api/messages", message_routes_1.default);
app.use("/api/doctor", doctor_dashboard_routes_1.default);
app.use("/api/medicines", medicine_routes_1.default);
app.use("/api/medical-records", medical_record_routes_1.default);
app.use("/api/video-calls", video_call_routes_1.default);
app.get("/api/profile", auth_middleware_1.verifyToken, auth_controller_1.getProfile);
app.use("/api/notifications", notification_routes_1.default);
app.use("/api/vouchers", voucher_routes_1.default);
app.get("/", (req, res) => {
    res.send("Healthcare Booking API Running...");
});
app.use(error_middleware_1.errorHandler);
const PORT = process.env.PORT || 5000;
const httpServer = (0, http_1.createServer)(app);
(0, socket_1.initSocket)(httpServer, allowedOrigins);
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    (0, emailService_1.initReminderScheduler)();
    (0, reminderJob_1.startReminderJob)();
    // Run expired payment check immediately on startup
    console.log("[Scheduler] Initializing auto-cancellation scheduler for expired payments...");
    (0, appointment_service_1.autoCancelExpiredAppointments)().catch((err) => console.error("[Scheduler] Expired payments cleanup failed on startup:", err));
    // Run expired payment check every 1 minute (60000 ms)
    setInterval(() => {
        (0, appointment_service_1.autoCancelExpiredAppointments)().catch((err) => console.error("[Scheduler] Scheduled expired payments cleanup failed:", err));
    }, 1 * 60 * 1000);
});
