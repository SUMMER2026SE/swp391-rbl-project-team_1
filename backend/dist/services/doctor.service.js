"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllDoctors = getAllDoctors;
exports.getAllSpecialties = getAllSpecialties;
exports.getDoctorById = getDoctorById;
exports.getDoctorByUserId = getDoctorByUserId;
const client_1 = __importDefault(require("../prisma/client"));
const apiError_1 = require("../utils/apiError");
async function getAllDoctors(specialtySlug, clinicId) {
    const whereClause = {};
    if (specialtySlug) {
        whereClause.specialty = { slug: specialtySlug };
    }
    if (clinicId) {
        whereClause.clinicId = clinicId;
    }
    const doctors = await client_1.default.doctor.findMany({
        where: whereClause,
        include: {
            specialty: true,
            clinic: true,
            certificates: true,
        },
        orderBy: { name: "asc" },
    });
    // Batch fetch completed appointments count to avoid connection pool exhaustion (N+1 problem)
    const completedCounts = await client_1.default.appointment.groupBy({
        by: ['doctorId'],
        where: {
            doctorId: { in: doctors.map(d => d.id) },
            status: 'COMPLETED'
        },
        _count: {
            id: true
        }
    });
    const countsMap = new Map();
    for (const c of completedCounts) {
        countsMap.set(c.doctorId, c._count.id);
    }
    // Check system verified status and appointments for all doctors
    const doctorsWithVerification = doctors.map((doc) => {
        const hasVerifiedLicense = doc.certificates.some(c => c.type === 'PRACTICE_LICENSE' && c.verificationStatus === 'VERIFIED');
        const completedAppointments = countsMap.get(doc.id) || 0;
        return {
            ...doc,
            isSystemVerified: doc.status === 'APPROVED' && hasVerifiedLicense && completedAppointments > 0
        };
    });
    return doctorsWithVerification;
}
async function getAllSpecialties() {
    return client_1.default.specialty.findMany({
        include: {
            _count: {
                select: { doctors: true },
            },
        },
        orderBy: { name: "asc" },
    });
}
async function getDoctorById(id) {
    const doctor = await client_1.default.doctor.findUnique({
        where: { id },
        include: {
            certificates: {
                where: { verificationStatus: 'VERIFIED' }, // Only public verified certs
                orderBy: { issuedYear: 'desc' }
            },
            specialty: true,
            clinic: true,
            doctorSchedules: true,
            reviews: {
                include: {
                    user: {
                        select: { fullName: true, avatar: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }
        }
    });
    if (!doctor) {
        throw new apiError_1.ApiError("Doctor not found", 404);
    }
    // Determine verification status
    // Need to fetch ALL certificates just to check PRACTICE_LICENSE if we only filtered VERIFIED above
    // Actually, if we only fetched VERIFIED above, we just check if any is PRACTICE_LICENSE
    const hasVerifiedLicense = doctor.certificates.some(c => c.type === 'PRACTICE_LICENSE');
    const hasCompletedAppointments = await client_1.default.appointment.count({
        where: { doctorId: doctor.id, status: 'COMPLETED' }
    });
    return {
        ...doctor,
        isSystemVerified: doctor.status === 'APPROVED' && hasVerifiedLicense && hasCompletedAppointments > 0
    };
}
/**
 * Finds the Doctor record linked to a User account.
 * Used when a DOCTOR-role user accesses protected doctor endpoints.
 *
 * @param userId - The User.id from the JWT token
 * @returns Doctor record or throws 404/403
 */
async function getDoctorByUserId(userId) {
    // User.doctorId links the User account to the Doctor record
    const user = await client_1.default.user.findUnique({
        where: { id: userId },
        select: { doctorId: true, role: true },
    });
    if (!user) {
        throw new apiError_1.ApiError("User account not found", 404);
    }
    if (!user.doctorId) {
        throw new apiError_1.ApiError("Doctor profile not linked to this account. Contact an administrator.", 403);
    }
    const doctor = await client_1.default.doctor.findUnique({
        where: { id: user.doctorId },
        include: { specialty: true, certificates: true },
    });
    if (!doctor) {
        throw new apiError_1.ApiError("Doctor profile not found", 404);
    }
    return doctor;
}
