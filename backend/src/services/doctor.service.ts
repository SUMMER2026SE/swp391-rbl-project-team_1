import { Doctor } from "@prisma/client";

import prisma from "../prisma/client";
import { ApiError } from "../utils/apiError";

export async function getAllDoctors(specialtySlug?: string, clinicId?: string) {
    const whereClause: any = {};
    
    if (specialtySlug) {
        whereClause.specialty = { slug: specialtySlug };
    }
    
    if (clinicId) {
        whereClause.clinicId = clinicId;
    }

    const doctors = await prisma.doctor.findMany({
        where: whereClause,
        include: {
            specialty: true,
            clinic: true,
            certificates: true,
        },
        orderBy: { name: "asc" },
    });

    // Batch fetch completed appointments count to avoid connection pool exhaustion (N+1 problem)
    const completedCounts = await prisma.appointment.groupBy({
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

export async function getAllSpecialties() {
    return prisma.specialty.findMany({
        include: {
            _count: {
                select: { doctors: true },
            },
        },
        orderBy: { name: "asc" },
    });
}

export async function getDoctorById(id: string) {
    const doctor = await prisma.doctor.findUnique({
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
        throw new ApiError("Doctor not found", 404);
    }

    // Determine verification status
    // Need to fetch ALL certificates just to check PRACTICE_LICENSE if we only filtered VERIFIED above
    // Actually, if we only fetched VERIFIED above, we just check if any is PRACTICE_LICENSE
    const hasVerifiedLicense = doctor.certificates.some(c => c.type === 'PRACTICE_LICENSE');
    const hasCompletedAppointments = await prisma.appointment.count({
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
export async function getDoctorByUserId(userId: string) {
    // User.doctorId links the User account to the Doctor record
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { doctorId: true, role: true },
    });

    if (!user) {
        throw new ApiError("User account not found", 404);
    }

    if (!user.doctorId) {
        throw new ApiError(
            "Doctor profile not linked to this account. Contact an administrator.",
            403
        );
    }

    const doctor = await prisma.doctor.findUnique({
        where: { id: user.doctorId },
        include: { specialty: true, certificates: true },
    });

    if (!doctor) {
        throw new ApiError("Doctor profile not found", 404);
    }

    return doctor;
}
