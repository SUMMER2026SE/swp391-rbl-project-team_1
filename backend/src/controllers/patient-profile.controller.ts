import { Request, Response, NextFunction } from "express";
import prisma from "../prisma/client";
import { ApiError } from "../utils/apiError";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

/**
 * GET /api/patient-profiles
 * Get all patient profiles for the authenticated user
 */
export async function getMyPatientProfiles(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.userId;
        if (!userId) throw new ApiError("Unauthorized", 401);

        const profiles = await prisma.patientProfile.findMany({
            where: { userId },
            orderBy: { createdAt: "asc" }
        });

        res.json({ profiles });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/patient-profiles
 * Create a new patient profile
 */
export async function createPatientProfile(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.userId;
        if (!userId) throw new ApiError("Unauthorized", 401);

        const {
            fullName, dateOfBirth, gender, phoneNumber, cccd, 
            ethnicity, nationality, address, 
            bloodType, allergies, chronicDiseases, personalHistory, familyHistory,
            isPrimary
        } = req.body;

        if (!fullName) {
            throw new ApiError("Họ tên là bắt buộc", 400);
        }

        // If this is set as primary, unset other primary profiles for this user
        if (isPrimary) {
            await prisma.patientProfile.updateMany({
                where: { userId, isPrimary: true },
                data: { isPrimary: false }
            });
        }

        const profile = await prisma.patientProfile.create({
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
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/patient-profiles/:id
 * Update an existing patient profile
 */
export async function updatePatientProfile(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.userId;
        const profileId = req.params.id;
        if (!userId) throw new ApiError("Unauthorized", 401);

        const profile = await prisma.patientProfile.findUnique({ where: { id: profileId } });
        if (!profile || profile.userId !== userId) {
            throw new ApiError("Không tìm thấy hồ sơ hoặc bạn không có quyền sửa", 404);
        }

        const {
            fullName, dateOfBirth, gender, phoneNumber, cccd, 
            ethnicity, nationality, address, 
            bloodType, allergies, chronicDiseases, personalHistory, familyHistory,
            isPrimary
        } = req.body;

        if (isPrimary) {
            await prisma.patientProfile.updateMany({
                where: { userId, id: { not: profileId }, isPrimary: true },
                data: { isPrimary: false }
            });
        }

        const updatedProfile = await prisma.patientProfile.update({
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
    } catch (error) {
        next(error);
    }
}

/**
 * DELETE /api/patient-profiles/:id
 * Delete a patient profile
 */
export async function deletePatientProfile(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.userId;
        const profileId = req.params.id;
        if (!userId) throw new ApiError("Unauthorized", 401);

        const profile = await prisma.patientProfile.findUnique({ where: { id: profileId } });
        if (!profile || profile.userId !== userId) {
            throw new ApiError("Không tìm thấy hồ sơ hoặc bạn không có quyền xóa", 404);
        }

        if (profile.isPrimary) {
            throw new ApiError("Không thể xóa hồ sơ mặc định", 400);
        }

        await prisma.patientProfile.delete({ where: { id: profileId } });
        res.json({ message: "Xóa hồ sơ thành công" });
    } catch (error) {
        next(error);
    }
}
