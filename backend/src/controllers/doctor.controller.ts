import { NextFunction, Request, Response } from "express";
import fs from "fs";
import path from "path";

import { getAllDoctors, getDoctorById, getDoctorByUserId, getAllSpecialties } from "../services/doctor.service";
import { getDoctorAppointments } from "../services/appointment.service";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { ApiError } from "../utils/apiError";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DOCTORS_DIR = path.join(process.cwd(), "public", "doctors");

/**
 * GET /api/doctors
 * Public: List all doctors.
 */
export async function listDoctors(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { specialty } = req.query as { specialty?: string };
        const doctors = await getAllDoctors(specialty);
        res.json({
            message: "Doctors fetched successfully",
            count: doctors.length,
            doctors,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/specialties
 * Public: List all specialties.
 */
export async function listSpecialties(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const specialties = await getAllSpecialties();
        res.json({
            message: "Specialties fetched successfully",
            count: specialties.length,
            specialties,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/doctors/:id
 * Public: Get a single doctor by ID.
 */
export async function getDoctor(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const id = req.params.id as string;

        if (!id) {
            throw new ApiError("Doctor ID is required", 400);
        }

        const doctor = await getDoctorById(id);
        res.json({ message: "Doctor details fetched successfully", doctor });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/doctor/appointments
 * Protected (DOCTOR role): Get all appointments for the authenticated doctor.
 *
 * Flow: JWT userId → User.doctorId → Doctor.id → appointments
 */
export async function getDoctorAppointmentsController(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user?.userId) {
            throw new ApiError("User not authenticated", 401);
        }

        // Resolve Doctor record from User account via User.doctorId link
        const doctor = await getDoctorByUserId(req.user.userId);

        const appointments = await getDoctorAppointments(doctor.id);

        res.json({
            message: "Doctor appointments retrieved successfully",
            doctor: {
                id: doctor.id,
                name: doctor.name,
                specialty: doctor.specialty?.name || "",
            },
            count: appointments.length,
            data: appointments,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/admin/doctors/:id/avatar
 * Protected (ADMIN role): Update doctor avatar with image URL or local file path
 *
 * Body: { avatarUrl: string }  OR  { avatarPath: string }
 */
export async function updateDoctorAvatar(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const doctorId = req.params.id as string;
        const { avatarUrl, avatarPath } = req.body;

        if (!doctorId) {
            throw new ApiError("Doctor ID is required", 400);
        }

        if (!avatarUrl && !avatarPath) {
            throw new ApiError("Either avatarUrl or avatarPath is required", 400);
        }

        // Verify doctor exists
        const doctor = await getDoctorById(doctorId);
        if (!doctor) {
            throw new ApiError("Doctor not found", 404);
        }

        const imageUrl = avatarUrl || avatarPath;

        // Update database
        const updatedDoctor = await prisma.doctor.update({
            where: { id: doctorId },
            data: { avatar: imageUrl },
        });

        res.json({
            message: "Doctor avatar updated successfully",
            doctor: updatedDoctor,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/admin/doctors/batch-update-avatars
 * Protected (ADMIN role): Batch update doctor avatars from local images
 *
 * Scans public/doctors/ directory for files matching pattern: doctor_X.{jpg,png,etc}
 */
export async function batchUpdateAvatars(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        // Create directory if it doesn't exist
        if (!fs.existsSync(DOCTORS_DIR)) {
            fs.mkdirSync(DOCTORS_DIR, { recursive: true });
        }

        // Get all image files
        const imageFiles = fs.readdirSync(DOCTORS_DIR);
        const supportedFormats = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
        const doctorImages = imageFiles.filter((file) =>
            supportedFormats.some((ext) => file.toLowerCase().endsWith(ext))
        );

        let updatedCount = 0;
        const results: { doctorId: string; avatarPath: string; status: string }[] = [];

        // Update each doctor with matching image
        for (const imageFile of doctorImages) {
            const imagePath = `/public/doctors/${imageFile}`;
            const doctorIdMatch = imageFile.match(/doctor_(\d+)/i);

            if (!doctorIdMatch) {
                results.push({
                    doctorId: imageFile,
                    avatarPath: imagePath,
                    status: "SKIPPED - Invalid filename format",
                });
                continue;
            }

            const doctorId = `doctor_${doctorIdMatch[1]}`;

            try {
                const doctor = await prisma.doctor.findUnique({
                    where: { id: doctorId },
                });

                if (!doctor) {
                    results.push({
                        doctorId,
                        avatarPath: imagePath,
                        status: "SKIPPED - Doctor not found",
                    });
                    continue;
                }

                await prisma.doctor.update({
                    where: { id: doctorId },
                    data: { avatar: imagePath },
                });

                results.push({
                    doctorId,
                    avatarPath: imagePath,
                    status: "SUCCESS",
                });
                updatedCount++;
            } catch (error) {
                results.push({
                    doctorId,
                    avatarPath: imagePath,
                    status: `ERROR - ${error instanceof Error ? error.message : "Unknown error"}`,
                });
            }
        }

        res.json({
            message: `Batch update completed. Updated ${updatedCount} doctors.`,
            totalProcessed: doctorImages.length,
            updatedCount,
            results,
        });
    } catch (error) {
        next(error);
    }
}
