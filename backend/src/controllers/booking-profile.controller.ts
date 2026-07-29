import { Response } from "express";
import prisma from "../prisma/client";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { ApiError } from "../utils/apiError";

export const getMyProfiles = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) throw new ApiError("Unauthorized", 401);

        const profiles = await prisma.bookingProfile.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json({ data: profiles });
    } catch (error) {
        if (error instanceof ApiError) throw error;
        console.error("getMyProfiles error:", error);
        res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
    }
};

export const createProfile = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) throw new ApiError("Unauthorized", 401);

        const { fullName, phone, email, gender, dateOfBirth, relationship, province, district, ward, street, bloodType, allergies, chronicDiseases, personalHistory, familyHistory } = req.body;

        if (!fullName || !relationship) {
            throw new ApiError("Họ tên và mối quan hệ là bắt buộc", 400);
        }

        const profile = await prisma.bookingProfile.create({
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
    } catch (error) {
        if (error instanceof ApiError) throw error;
        console.error("createProfile error:", error);
        res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
    }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) throw new ApiError("Unauthorized", 401);

        const profileId = req.params.id as string;
        const { fullName, phone, email, gender, dateOfBirth, relationship, province, district, ward, street, bloodType, allergies, chronicDiseases, personalHistory, familyHistory } = req.body;

        const existing = await prisma.bookingProfile.findUnique({ where: { id: profileId } });
        if (!existing || existing.userId !== userId) {
            throw new ApiError("Hồ sơ không tồn tại hoặc không có quyền truy cập", 404);
        }

        const profile = await prisma.bookingProfile.update({
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
    } catch (error) {
        if (error instanceof ApiError) throw error;
        console.error("updateProfile error:", error);
        res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
    }
};

export const deleteProfile = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) throw new ApiError("Unauthorized", 401);

        const profileId = req.params.id as string;

        const existing = await prisma.bookingProfile.findUnique({ where: { id: profileId } });
        if (!existing || existing.userId !== userId) {
            throw new ApiError("Hồ sơ không tồn tại hoặc không có quyền truy cập", 404);
        }

        await prisma.bookingProfile.delete({ where: { id: profileId } });

        res.status(200).json({ message: "Đã xoá hồ sơ" });
    } catch (error) {
        if (error instanceof ApiError) throw error;
        console.error("deleteProfile error:", error);
        res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
    }
};
