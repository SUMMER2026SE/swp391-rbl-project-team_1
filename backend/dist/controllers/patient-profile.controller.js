"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyPatientProfiles = getMyPatientProfiles;
exports.createPatientProfile = createPatientProfile;
exports.updatePatientProfile = updatePatientProfile;
exports.deletePatientProfile = deletePatientProfile;
const client_1 = __importDefault(require("../prisma/client"));
const apiError_1 = require("../utils/apiError");
/**
 * GET /api/patient-profiles
 * Get all patient profiles for the authenticated user
 */
async function getMyPatientProfiles(req, res, next) {
    try {
        const userId = req.user?.userId;
        if (!userId)
            throw new apiError_1.ApiError("Unauthorized", 401);
        const profiles = await client_1.default.patientProfile.findMany({
            where: { userId, isTemporary: false },
            orderBy: { createdAt: "asc" }
        });
        res.json({ profiles });
    }
    catch (error) {
        next(error);
    }
}
/**
 * POST /api/patient-profiles
 * Create a new patient profile
 */
async function createPatientProfile(req, res, next) {
    try {
        const userId = req.user?.userId;
        if (!userId)
            throw new apiError_1.ApiError("Unauthorized", 401);
        const { fullName, dateOfBirth, gender, phoneNumber, cccd, ethnicity, nationality, address, bloodType, allergies, chronicDiseases, personalHistory, familyHistory, isPrimary } = req.body;
        if (!fullName) {
            throw new apiError_1.ApiError("Họ tên là bắt buộc", 400);
        }
        // If this is set as primary, unset other primary profiles for this user
        if (isPrimary) {
            await client_1.default.patientProfile.updateMany({
                where: { userId, isPrimary: true },
                data: { isPrimary: false }
            });
        }
        const profile = await client_1.default.patientProfile.create({
            data: {
                userId,
                fullName,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                gender,
                phoneNumber,
                cccd,
                ethnicity,
                nationality,
                address,
                bloodType,
                allergies,
                chronicDiseases,
                personalHistory,
                familyHistory,
                isPrimary: isPrimary || false
            }
        });
        res.status(201).json({ message: "Tạo hồ sơ thành công", profile });
    }
    catch (error) {
        next(error);
    }
}
/**
 * PUT /api/patient-profiles/:id
 * Update an existing patient profile
 */
async function updatePatientProfile(req, res, next) {
    try {
        const userId = req.user?.userId;
        const profileId = req.params.id;
        if (!userId)
            throw new apiError_1.ApiError("Unauthorized", 401);
        const profile = await client_1.default.patientProfile.findUnique({ where: { id: profileId } });
        if (!profile || profile.userId !== userId) {
            throw new apiError_1.ApiError("Không tìm thấy hồ sơ hoặc bạn không có quyền sửa", 404);
        }
        const { fullName, dateOfBirth, gender, phoneNumber, cccd, ethnicity, nationality, address, bloodType, allergies, chronicDiseases, personalHistory, familyHistory, isPrimary } = req.body;
        if (isPrimary) {
            await client_1.default.patientProfile.updateMany({
                where: { userId, id: { not: profileId }, isPrimary: true },
                data: { isPrimary: false }
            });
        }
        const updatedProfile = await client_1.default.patientProfile.update({
            where: { id: profileId },
            data: {
                fullName,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                gender,
                phoneNumber,
                cccd,
                ethnicity,
                nationality,
                address,
                bloodType,
                allergies,
                chronicDiseases,
                personalHistory,
                familyHistory,
                isPrimary
            }
        });
        res.json({ message: "Cập nhật hồ sơ thành công", profile: updatedProfile });
    }
    catch (error) {
        next(error);
    }
}
/**
 * DELETE /api/patient-profiles/:id
 * Delete a patient profile
 */
async function deletePatientProfile(req, res, next) {
    try {
        const userId = req.user?.userId;
        const profileId = req.params.id;
        if (!userId)
            throw new apiError_1.ApiError("Unauthorized", 401);
        const profile = await client_1.default.patientProfile.findUnique({ where: { id: profileId } });
        if (!profile || profile.userId !== userId) {
            throw new apiError_1.ApiError("Không tìm thấy hồ sơ hoặc bạn không có quyền xóa", 404);
        }
        if (profile.isPrimary) {
            throw new apiError_1.ApiError("Không thể xóa hồ sơ mặc định", 400);
        }
        await client_1.default.patientProfile.delete({ where: { id: profileId } });
        res.json({ message: "Xóa hồ sơ thành công" });
    }
    catch (error) {
        next(error);
    }
}
