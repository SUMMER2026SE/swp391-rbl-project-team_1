"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateConsentToken = generateConsentToken;
exports.verifyAndRetrieveProfile = verifyAndRetrieveProfile;
const client_1 = __importDefault(require("../prisma/client"));
const apiError_1 = require("../utils/apiError");
const crypto_1 = __importDefault(require("crypto"));
/**
 * Tạo token ủy quyền bệnh án tạm thời (hết hạn trong 30 phút)
 */
async function generateConsentToken(userId) {
    const user = await client_1.default.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new apiError_1.ApiError("Không tìm thấy người dùng", 404);
    }
    // Xóa các token hết hạn của user này trước để tối ưu hóa DB
    await client_1.default.medicalConsentToken.deleteMany({
        where: {
            OR: [
                { userId },
                { expiresAt: { lt: new Date() } }
            ]
        }
    });
    // Tạo token ngẫu nhiên gồm 16 ký tự hexa
    const tokenString = crypto_1.default.randomBytes(8).toString("hex").toUpperCase();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 phút
    const consentToken = await client_1.default.medicalConsentToken.create({
        data: {
            userId,
            token: tokenString,
            expiresAt,
        },
    });
    return consentToken;
}
/**
 * Bác sĩ xác thực token và truy xuất hồ sơ bệnh án của bệnh nhân
 */
async function verifyAndRetrieveProfile(token, doctorId) {
    const consent = await client_1.default.medicalConsentToken.findUnique({
        where: { token },
        include: {
            user: {
                include: {
                    healthProfile: true,
                    medicalRecords: {
                        include: {
                            prescriptions: true,
                            doctor: true,
                        },
                        orderBy: {
                            createdAt: "desc",
                        },
                    },
                },
            },
        },
    });
    if (!consent) {
        throw new apiError_1.ApiError("Mã ủy quyền không hợp lệ hoặc đã bị hủy", 400);
    }
    if (consent.expiresAt < new Date()) {
        // Xóa token hết hạn
        await client_1.default.medicalConsentToken.delete({ where: { id: consent.id } });
        throw new apiError_1.ApiError("Mã ủy quyền đã hết hạn", 400);
    }
    // Lưu lại ID bác sĩ đã quét để kiểm tra nhật ký truy cập (audit trail)
    await client_1.default.medicalConsentToken.update({
        where: { id: consent.id },
        data: { doctorId },
    });
    // Trả về hồ sơ bệnh án chi tiết một cách an toàn
    const { password, ...safeUser } = consent.user;
    return safeUser;
}
