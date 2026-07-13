"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listDoctors = listDoctors;
exports.listSpecialties = listSpecialties;
exports.getDoctor = getDoctor;
exports.getDoctorAppointmentsController = getDoctorAppointmentsController;
exports.updateDoctorAvatar = updateDoctorAvatar;
exports.batchUpdateAvatars = batchUpdateAvatars;
exports.getFeaturedDoctors = getFeaturedDoctors;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const doctor_service_1 = require("../services/doctor.service");
const appointment_service_1 = require("../services/appointment.service");
const apiError_1 = require("../utils/apiError");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const DOCTORS_DIR = path_1.default.join(process.cwd(), "public", "doctors");
/**
 * GET /api/doctors
 * Public: List all doctors.
 */
async function listDoctors(req, res, next) {
    try {
        const { specialty, clinicId } = req.query;
        const doctors = await (0, doctor_service_1.getAllDoctors)(specialty, clinicId);
        res.json({
            message: "Doctors fetched successfully",
            count: doctors.length,
            doctors,
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/specialties
 * Public: List all specialties.
 */
async function listSpecialties(req, res, next) {
    try {
        const specialties = await (0, doctor_service_1.getAllSpecialties)();
        res.json({
            message: "Specialties fetched successfully",
            count: specialties.length,
            specialties,
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/doctors/:id
 * Public: Get a single doctor by ID.
 */
async function getDoctor(req, res, next) {
    try {
        const id = req.params.id;
        if (!id) {
            throw new apiError_1.ApiError("Doctor ID is required", 400);
        }
        const doctor = await (0, doctor_service_1.getDoctorById)(id);
        res.json({ message: "Doctor details fetched successfully", doctor });
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/doctor/appointments
 * Protected (DOCTOR role): Get all appointments for the authenticated doctor.
 *
 * Flow: JWT userId → User.doctorId → Doctor.id → appointments
 */
async function getDoctorAppointmentsController(req, res, next) {
    try {
        if (!req.user?.userId) {
            throw new apiError_1.ApiError("User not authenticated", 401);
        }
        // Resolve Doctor record from User account via User.doctorId link
        const doctor = await (0, doctor_service_1.getDoctorByUserId)(req.user.userId);
        const appointments = await (0, appointment_service_1.getDoctorAppointments)(doctor.id);
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
    }
    catch (error) {
        next(error);
    }
}
/**
 * POST /api/admin/doctors/:id/avatar
 * Protected (ADMIN role): Update doctor avatar with image URL or local file path
 *
 * Body: { avatarUrl: string }  OR  { avatarPath: string }
 */
async function updateDoctorAvatar(req, res, next) {
    try {
        const doctorId = req.params.id;
        const { avatarUrl, avatarPath } = req.body;
        if (!doctorId) {
            throw new apiError_1.ApiError("Doctor ID is required", 400);
        }
        if (!avatarUrl && !avatarPath) {
            throw new apiError_1.ApiError("Either avatarUrl or avatarPath is required", 400);
        }
        // Verify doctor exists
        const doctor = await (0, doctor_service_1.getDoctorById)(doctorId);
        if (!doctor) {
            throw new apiError_1.ApiError("Doctor not found", 404);
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
    }
    catch (error) {
        next(error);
    }
}
/**
 * POST /api/admin/doctors/batch-update-avatars
 * Protected (ADMIN role): Batch update doctor avatars from local images
 *
 * Scans public/doctors/ directory for files matching pattern: doctor_X.{jpg,png,etc}
 */
async function batchUpdateAvatars(req, res, next) {
    try {
        // Create directory if it doesn't exist
        if (!fs_1.default.existsSync(DOCTORS_DIR)) {
            fs_1.default.mkdirSync(DOCTORS_DIR, { recursive: true });
        }
        // Get all image files
        const imageFiles = fs_1.default.readdirSync(DOCTORS_DIR);
        const supportedFormats = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
        const doctorImages = imageFiles.filter((file) => supportedFormats.some((ext) => file.toLowerCase().endsWith(ext)));
        let updatedCount = 0;
        const results = [];
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
            }
            catch (error) {
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
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/doctors/featured
 * Public: Get featured doctors (rating >= 4.5, most appointments this month, approved status)
 */
async function getFeaturedDoctors(req, res, next) {
    try {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        // Fetch approved doctors with reviews and appointments this month
        const doctors = await prisma.doctor.findMany({
            where: { status: 'APPROVED' },
            include: {
                specialty: { select: { name: true, slug: true } },
                clinic: { select: { name: true } },
                reviews: { select: { rating: true } },
                appointments: {
                    where: { appointmentDate: { gte: startOfMonth } },
                    select: { id: true }
                }
            }
        });
        const mappedDoctors = doctors.map(doctor => {
            const avgRating = doctor.reviews.length > 0
                ? doctor.reviews.reduce((sum, r) => sum + r.rating, 0) / doctor.reviews.length
                : 0;
            return {
                ...doctor,
                avgRating: Number(avgRating.toFixed(1)),
                reviewCount: doctor.reviews.length,
                appointmentsThisMonthCount: doctor.appointments.length,
            };
        });
        // Filter: avgRating >= 4.5, then sort by appointments count (descending)
        const featured = mappedDoctors
            .filter(d => d.avgRating >= 4.5)
            .sort((a, b) => b.appointmentsThisMonthCount - a.appointmentsThisMonthCount)
            .slice(0, 6)
            .map(d => ({
            id: d.id,
            name: d.name,
            avatar: d.avatar,
            specialty: d.specialty,
            clinic: d.clinic,
            experience: d.experience,
            price: d.price,
            avgRating: d.avgRating,
            reviewCount: d.reviewCount,
        }));
        // If not enough doctors have >= 4.5 rating, just return the ones with most appointments
        if (featured.length < 6) {
            const others = mappedDoctors
                .filter(d => d.avgRating < 4.5 && !featured.find(f => f.id === d.id))
                .sort((a, b) => b.appointmentsThisMonthCount - a.appointmentsThisMonthCount)
                .slice(0, 6 - featured.length)
                .map(d => ({
                id: d.id,
                name: d.name,
                avatar: d.avatar,
                specialty: d.specialty,
                clinic: d.clinic,
                experience: d.experience,
                price: d.price,
                avgRating: d.avgRating,
                reviewCount: d.reviewCount,
            }));
            featured.push(...others);
        }
        res.json({ message: "Featured doctors fetched successfully", doctors: featured });
    }
    catch (error) {
        next(error);
    }
}
