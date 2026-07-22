"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProfile = exports.updateProfile = exports.createProfile = exports.getMyProfiles = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const apiError_1 = require("../utils/apiError");
const getMyProfiles = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            throw new apiError_1.ApiError("Unauthorized", 401);
        const profiles = await client_1.default.bookingProfile.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json({ data: profiles });
    }
    catch (error) {
        if (error instanceof apiError_1.ApiError)
            throw error;
        console.error("getMyProfiles error:", error);
        res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
    }
};
exports.getMyProfiles = getMyProfiles;
const createProfile = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            throw new apiError_1.ApiError("Unauthorized", 401);
        const { fullName, phone, email, gender, dateOfBirth, relationship, province, district, ward, street, bloodType, allergies, chronicDiseases, personalHistory, familyHistory } = req.body;
        if (!fullName || !relationship) {
            throw new apiError_1.ApiError("Họ tên và mối quan hệ là bắt buộc", 400);
        }
        const profile = await client_1.default.bookingProfile.create({
            data: {
                userId,
                fullName,
                phone,
                email,
                gender,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                relationship,
                province,
                district,
                ward,
                street,
                bloodType,
                allergies,
                chronicDiseases,
                personalHistory,
                familyHistory
            }
        });
        res.status(201).json({ data: profile, message: "Đã lưu hồ sơ thành công" });
    }
    catch (error) {
        if (error instanceof apiError_1.ApiError)
            throw error;
        console.error("createProfile error:", error);
        res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
    }
};
exports.createProfile = createProfile;
const updateProfile = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            throw new apiError_1.ApiError("Unauthorized", 401);
        const profileId = req.params.id;
        const { fullName, phone, email, gender, dateOfBirth, relationship, province, district, ward, street, bloodType, allergies, chronicDiseases, personalHistory, familyHistory } = req.body;
        const existing = await client_1.default.bookingProfile.findUnique({ where: { id: profileId } });
        if (!existing || existing.userId !== userId) {
            throw new apiError_1.ApiError("Hồ sơ không tồn tại hoặc không có quyền truy cập", 404);
        }
        const profile = await client_1.default.bookingProfile.update({
            where: { id: profileId },
            data: {
                fullName,
                phone,
                email,
                gender,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                relationship,
                province,
                district,
                ward,
                street,
                bloodType,
                allergies,
                chronicDiseases,
                personalHistory,
                familyHistory
            }
        });
        res.status(200).json({ data: profile, message: "Đã cập nhật hồ sơ" });
    }
    catch (error) {
        if (error instanceof apiError_1.ApiError)
            throw error;
        console.error("updateProfile error:", error);
        res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
    }
};
exports.updateProfile = updateProfile;
const deleteProfile = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            throw new apiError_1.ApiError("Unauthorized", 401);
        const profileId = req.params.id;
        const existing = await client_1.default.bookingProfile.findUnique({ where: { id: profileId } });
        if (!existing || existing.userId !== userId) {
            throw new apiError_1.ApiError("Hồ sơ không tồn tại hoặc không có quyền truy cập", 404);
        }
        await client_1.default.bookingProfile.delete({ where: { id: profileId } });
        res.status(200).json({ message: "Đã xoá hồ sơ" });
    }
    catch (error) {
        if (error instanceof apiError_1.ApiError)
            throw error;
        console.error("deleteProfile error:", error);
        res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
    }
};
exports.deleteProfile = deleteProfile;
