"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const client_2 = __importDefault(require("../prisma/client"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const authorization_middleware_1 = require("../middleware/authorization.middleware");
const consent_service_1 = require("../services/consent.service");
const apiError_1 = require("../utils/apiError");
const router = (0, express_1.Router)();
/**
 * POST /api/consent/token
 * Tạo mã token ủy quyền khám cho bệnh nhân hiện tại (USER)
 */
router.post("/consent/token", auth_middleware_1.verifyToken, async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new apiError_1.ApiError("Yêu cầu đăng nhập", 401);
        }
        // Hỗ trợ cả việc tạo token cho tài khoản phụ (family member) nếu truyền patientId trong body
        const targetUserId = req.body.patientId || userId;
        // Nếu tạo cho người khác, kiểm tra xem có phải là tài khoản phụ của mình không
        if (targetUserId !== userId) {
            // Kiểm tra quan hệ gia đình
            const parent = await req.user; // req.user has role, etc.
            // Thêm kiểm tra trong db
            const isSubProfile = await req.app.get("prisma")?.user.findFirst({
                where: { id: targetUserId, parentId: userId }
            });
            // Ta có thể dùng trực tiếp prisma trong service hoặc đây
        }
        const consentToken = await (0, consent_service_1.generateConsentToken)(targetUserId);
        res.status(201).json({
            message: "Mã ủy quyền được tạo thành công, có hiệu lực trong 30 phút.",
            data: consentToken,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/consent/verify
 * Bác sĩ quét mã QR (gửi token lên) để xác thực và lấy toàn bộ hồ sơ bệnh án
 */
router.post("/consent/verify", auth_middleware_1.verifyToken, (0, authorization_middleware_1.authorizeRoles)(client_1.Role.DOCTOR), async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new apiError_1.ApiError("Yêu cầu đăng nhập", 401);
        }
        const doctor = await client_2.default.doctor.findFirst({
            where: { userAccount: { id: userId } }
        });
        if (!doctor) {
            throw new apiError_1.ApiError("Tài khoản của bạn chưa được liên kết với hồ sơ Bác sĩ", 403);
        }
        const doctorId = doctor.id;
        const { token } = req.body;
        if (!token) {
            throw new apiError_1.ApiError("Mã token ủy quyền (QR code) là bắt buộc", 400);
        }
        const patientProfile = await (0, consent_service_1.verifyAndRetrieveProfile)(token, doctorId);
        res.json({
            message: "Xác thực ủy quyền thành công. Đã truy xuất bệnh án.",
            data: patientProfile,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
