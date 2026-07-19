import { Request, Response } from "express";
import prisma from "../prisma/client";

// GET /api/booking-profiles
export async function getMyBookingProfiles(req: Request, res: Response) {
    try {
        // req.user is set by authenticateToken
        const userId = (req as any).user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const profiles = await prisma.bookingProfile.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });

        res.json({ message: "Success", data: profiles });
    } catch (error) {
        console.error("Error getting booking profiles:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// POST /api/booking-profiles
export async function createBookingProfile(req: Request, res: Response) {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const { fullName, phone, gender, yearOfBirth, relationship } = req.body;

        if (!fullName || !relationship) {
            return res.status(400).json({ message: "Vui lòng nhập họ tên và mối quan hệ" });
        }

        const newProfile = await prisma.bookingProfile.create({
            data: {
                userId,
                fullName,
                phone: phone || null,
                gender: gender || null,
                yearOfBirth: yearOfBirth ? parseInt(yearOfBirth) : null,
                relationship,
            },
        });

        res.status(201).json({ message: "Tạo hồ sơ thành công", data: newProfile });
    } catch (error) {
        console.error("Error creating booking profile:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// PUT /api/booking-profiles/:id
export async function updateBookingProfile(req: Request, res: Response) {
    try {
        const userId = (req as any).user?.id || (req as any).user?.userId;
        const id = req.params.id as string;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const { fullName, phone, gender, yearOfBirth, relationship } = req.body;

        // Verify ownership
        const existing = await prisma.bookingProfile.findUnique({
            where: { id },
        });

        if (!existing || existing.userId !== userId) {
            return res.status(404).json({ message: "Không tìm thấy hồ sơ hoặc không có quyền sửa" });
        }

        const updatedProfile = await prisma.bookingProfile.update({
            where: { id },
            data: {
                fullName: fullName !== undefined ? fullName : existing.fullName,
                phone: phone !== undefined ? phone : existing.phone,
                gender: gender !== undefined ? gender : existing.gender,
                yearOfBirth: yearOfBirth !== undefined ? parseInt(yearOfBirth) : existing.yearOfBirth,
                relationship: relationship !== undefined ? relationship : existing.relationship,
            },
        });

        res.json({ message: "Cập nhật hồ sơ thành công", data: updatedProfile });
    } catch (error) {
        console.error("Error updating booking profile:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// DELETE /api/booking-profiles/:id
export async function deleteBookingProfile(req: Request, res: Response) {
    try {
        const userId = (req as any).user?.id || (req as any).user?.userId;
        const id = req.params.id as string;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // Verify ownership
        const existing = await prisma.bookingProfile.findUnique({
            where: { id },
        });

        if (!existing || existing.userId !== userId) {
            return res.status(404).json({ message: "Không tìm thấy hồ sơ hoặc không có quyền xóa" });
        }

        await prisma.bookingProfile.delete({
            where: { id },
        });

        res.json({ message: "Xóa hồ sơ thành công" });
    } catch (error) {
        console.error("Error deleting booking profile:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}
