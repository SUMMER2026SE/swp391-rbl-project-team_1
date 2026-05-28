import prisma from "../prisma/client";
import { Role, AppointmentStatus } from "@prisma/client";
import { ApiError } from "../utils/apiError";
import { AdminUserDto } from "../types/user.types";

export interface AppointmentWithRelations {
    id: string;
    userId: string;
    doctorId: string;
    appointmentDate: Date;
    status: string;
    notes: string | null;
    createdAt: Date;
    user: {
        id: string;
        email: string;
        role: Role;
    };
    doctor: {
        id: string;
        name: string;
        specialty: {
            id: string;
            name: string;
            slug: string;
            icon: string | null;
        };
    };
}

/**
 * Returns all users for admin (without password field).
 */
export async function getAllUsers(): Promise<AdminUserDto[]> {
    return prisma.user.findMany({
        select: {
            id: true,
            email: true,
            role: true,
            doctorId: true,
            createdAt: true,
        },
        orderBy: { createdAt: "desc" },
    });
}

/**
 * Returns all appointments with user and doctor details.
 */
export async function getAllAppointments(): Promise<AppointmentWithRelations[]> {
    return prisma.appointment.findMany({
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    role: true,
                },
            },
            doctor: {
                select: {
                    id: true,
                    name: true,
                    specialty: true,
                },
            },
        },
        orderBy: { appointmentDate: "desc" },
    }) as unknown as Promise<AppointmentWithRelations[]>;
}

/**
 * Deletes a user and their appointments. Prevents deleting admins.
 */
export async function deleteUser(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
        throw new ApiError("User not found", 404);
    }

    if (user.role === Role.ADMIN) {
        throw new ApiError("Cannot delete admin users", 403);
    }

    // Delete appointments first due to foreign key constraint
    await prisma.appointment.deleteMany({ where: { userId } });

    await prisma.user.delete({ where: { id: userId } });
}

export interface LinkDoctorResult {
    userId: string;
    doctorId: string;
    message: string;
}

/**
 * Links a User account to a Doctor record.
 * User must have DOCTOR role.
 * Doctor must not already be linked to another User.
 */
export async function linkDoctorToUser(
    userId: string,
    doctorId: string
): Promise<LinkDoctorResult> {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
        throw new ApiError("User not found", 404);
    }

    if (user.role !== Role.DOCTOR) {
        throw new ApiError("User must have DOCTOR role to be linked to a Doctor profile", 400);
    }

    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });

    if (!doctor) {
        throw new ApiError("Doctor not found", 404);
    }

    // Check if doctor already linked to another user
    const existingLink = await prisma.user.findUnique({
        where: { doctorId },
    });

    if (existingLink && existingLink.id !== userId) {
        throw new ApiError("This Doctor is already linked to another User account", 409);
    }

    await prisma.user.update({
        where: { id: userId },
        data: { doctorId },
    });

    return {
        userId,
        doctorId,
        message: `User account successfully linked to Doctor "${doctor.name}"`,
    };
}

/**
 * Updates an appointment's status.
 */
export async function updateAppointmentStatus(
    appointmentId: string,
    status: AppointmentStatus,
    cancellationReason?: string
): Promise<AppointmentWithRelations> {
    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
    });

    if (!appointment) {
        throw new ApiError("Appointment not found", 404);
    }

    return prisma.appointment.update({
        where: { id: appointmentId },
        data: { status, cancellationReason },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    role: true,
                },
            },
            doctor: {
                select: {
                    id: true,
                    name: true,
                    specialty: true,
                },
            },
        },
    }) as unknown as Promise<AppointmentWithRelations>;
}
