import prisma from "../prisma/client";
import { Role, AppointmentStatus } from "@prisma/client";
import { ApiError } from "../utils/apiError";
import { AdminUserDto } from "../types/user.types";
import { sendBookingStatusUpdateEmail, sendBookingNotificationToDoctorEmail } from "../utils/emailService";

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
            isLocked: true,
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

/**
 * Locks or unlocks a user account.
 */
export async function lockUser(userId: string, isLocked: boolean): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
        throw new ApiError("User not found", 404);
    }

    if (user.role === Role.ADMIN) {
        throw new ApiError("Cannot lock admin users", 403);
    }

    await prisma.user.update({
        where: { id: userId },
        data: { isLocked },
    });
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

    const updated = await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status, cancellationReason },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    role: true,
                    fullName: true,
                },
            },
            doctor: {
                select: {
                    id: true,
                    name: true,
                    specialty: true,
                    clinic: true,
                    hospital: true,
                    userAccount: {
                        select: { email: true }
                    }
                },
            },
        },
    });

    if (updated.user?.email && updated.doctor && (status === "CONFIRMED" || status === "CANCELLED")) {
        sendBookingStatusUpdateEmail(updated.user.email, {
            patientName: updated.user.fullName || updated.user.email,
            doctorName: updated.doctor.name,
            specialtyName: updated.doctor.specialty.name,
            clinicName: updated.doctor.clinic?.name || updated.doctor.hospital,
            appointmentDate: updated.appointmentDate,
            status,
            cancellationReason,
            notes: updated.notes,
        }).catch((err) => console.error("Error sending status update email:", err));
    }

    if (updated.doctor?.userAccount?.email && status === "CONFIRMED") {
        sendBookingNotificationToDoctorEmail(updated.doctor.userAccount.email, {
            patientName: updated.user?.fullName || updated.user?.email || "Bệnh nhân",
            doctorName: updated.doctor.name,
            appointmentDate: updated.appointmentDate,
            notes: updated.notes,
            appointmentId: updated.id,
        }).catch((err) => console.error("Error sending doctor notification email:", err));
    }

    return updated as unknown as AppointmentWithRelations;
}

/**
 * Returns appointments that are pending approval (status PENDING and has paymentProof)
 */
export async function getPendingPayments() {
    return prisma.appointment.findMany({
        where: {
            status: "PENDING",
            paymentProof: {
                not: null
            }
        },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    avatar: true,
                },
            },
            doctor: {
                select: {
                    id: true,
                    name: true,
                    specialty: true,
                    hospital: true,
                },
            },
        },
        orderBy: { paymentAt: "asc" },
    });
}

/**
 * Returns all appointments that have a payment record or a payment proof, sorted by newest.
 */
export async function getAllPayments() {
    return prisma.appointment.findMany({
        where: {
            OR: [
                { payment: { isNot: null } },
                { paymentProof: { not: null } }
            ]
        },
        include: {
            payment: true,
            user: {
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    avatar: true,
                },
            },
            doctor: {
                select: {
                    id: true,
                    name: true,
                    specialty: true,
                    hospital: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
}
