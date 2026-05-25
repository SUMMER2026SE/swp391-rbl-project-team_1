import { Doctor } from "@prisma/client";

import prisma from "../prisma/client";
import { ApiError } from "../utils/apiError";

export async function getAllDoctors(): Promise<Doctor[]> {
    return prisma.doctor.findMany({
        orderBy: { name: "asc" },
    });
}

export async function getDoctorById(id: string): Promise<Doctor> {
    const doctor = await prisma.doctor.findUnique({
        where: { id },
    });

    if (!doctor) {
        throw new ApiError("Doctor not found", 404);
    }

    return doctor;
}

/**
 * Finds the Doctor record linked to a User account.
 * Used when a DOCTOR-role user accesses protected doctor endpoints.
 *
 * @param userId - The User.id from the JWT token
 * @returns Doctor record or throws 404/403
 */
export async function getDoctorByUserId(userId: string): Promise<Doctor> {
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
    });

    if (!doctor) {
        throw new ApiError("Doctor profile not found", 404);
    }

    return doctor;
}
