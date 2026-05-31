"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const passport_1 = __importDefault(require("passport"));
require("./config/passport"); // Load passport strategies config
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const authGoogle_1 = __importDefault(require("./routes/authGoogle"));
const doctor_routes_1 = __importDefault(require("./routes/doctor.routes"));
const appointment_routes_1 = __importDefault(require("./routes/appointment.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const chat_routes_1 = __importDefault(require("./routes/chat.routes"));
const doctor_dashboard_routes_1 = __importDefault(require("./routes/doctor-dashboard.routes"));
const medical_record_routes_1 = __importDefault(require("./routes/medical-record.routes"));
const complaint_routes_1 = __importDefault(require("./routes/complaint.routes"));
const article_routes_1 = __importDefault(require("./routes/article.routes"));
const review_routes_1 = __importDefault(require("./routes/review.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const health_profile_routes_1 = __importDefault(require("./routes/health-profile.routes"));
const gps_routes_1 = __importDefault(require("./routes/gps.routes"));
const consent_routes_1 = __importDefault(require("./routes/consent.routes"));
const auth_middleware_1 = require("./middleware/auth.middleware");
const error_middleware_1 = require("./middleware/error.middleware");
const auth_controller_1 = require("./controllers/auth.controller");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(passport_1.default.initialize()); // Initialize Passport
// Production CORS Configuration
const corsOrigin = process.env.CORS_ORIGIN;
const allowedOrigins = corsOrigin && corsOrigin !== "*" ? corsOrigin.split(",") : ["http://localhost:3000"];
app.use((0, cors_1.default)({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express_1.default.json());
app.use("/public", express_1.default.static(path_1.default.join(__dirname, "../public")));
app.use("/api/users", user_routes_1.default);
app.use("/api/auth", auth_routes_1.default);
app.use(authGoogle_1.default); // Register Google Auth Routes
app.use("/api", doctor_routes_1.default);
app.use("/api", appointment_routes_1.default);
app.use("/api", admin_routes_1.default);
app.use("/api", chat_routes_1.default);
app.use("/api/doctor", doctor_dashboard_routes_1.default);
app.use("/api", medical_record_routes_1.default);
app.use("/api", complaint_routes_1.default);
app.use("/api", article_routes_1.default);
app.use("/api", review_routes_1.default);
app.use("/api", notification_routes_1.default);
app.use("/api", health_profile_routes_1.default);
app.use("/api", gps_routes_1.default);
app.use("/api", consent_routes_1.default);
app.get("/api/profile", auth_middleware_1.verifyToken, auth_controller_1.getProfile);
app.get("/", (req, res) => {
    res.send("Healthcare Booking API Running...");
});
app.use(error_middleware_1.errorHandler);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
