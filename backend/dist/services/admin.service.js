"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUsers = getAllUsers;
exports.getAllAppointments = getAllAppointments;
exports.deleteUser = deleteUser;
exports.lockUser = lockUser;
exports.linkDoctorToUser = linkDoctorToUser;
exports.updateAppointmentStatus = updateAppointmentStatus;
exports.getPendingPayments = getPendingPayments;
const client_1 = __importDefault(require("../prisma/client"));
const client_2 = require("@prisma/client");
const apiError_1 = require("../utils/apiError");
const emailService_1 = require("../utils/emailService");
/**
 * Returns all users for admin (without password field).
 */
async function getAllUsers() {
    return client_1.default.user.findMany({
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
async function getAllAppointments() {
    return client_1.default.appointment.findMany({
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
    });
}
/**
 * Deletes a user and their appointments. Prevents deleting admins.
 */
async function deleteUser(userId) {
    const user = await client_1.default.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new apiError_1.ApiError("User not found", 404);
    }
    if (user.role === client_2.Role.ADMIN) {
        throw new apiError_1.ApiError("Cannot delete admin users", 403);
    }
    // Delete appointments first due to foreign key constraint
    await client_1.default.appointment.deleteMany({ where: { userId } });
    await client_1.default.user.delete({ where: { id: userId } });
}
/**
 * Locks or unlocks a user account.
 */
async function lockUser(userId, isLocked) {
    const user = await client_1.default.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new apiError_1.ApiError("User not found", 404);
    }
    if (user.role === client_2.Role.ADMIN) {
        throw new apiError_1.ApiError("Cannot lock admin users", 403);
    }
    await client_1.default.user.update({
        where: { id: userId },
        data: { isLocked },
    });
}
/**
 * Links a User account to a Doctor record.
 * User must have DOCTOR role.
 * Doctor must not already be linked to another User.
 */
async function linkDoctorToUser(userId, doctorId) {
    const user = await client_1.default.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new apiError_1.ApiError("User not found", 404);
    }
    if (user.role !== client_2.Role.DOCTOR) {
        throw new apiError_1.ApiError("User must have DOCTOR role to be linked to a Doctor profile", 400);
    }
    const doctor = await client_1.default.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor) {
        throw new apiError_1.ApiError("Doctor not found", 404);
    }
    // Check if doctor already linked to another user
    const existingLink = await client_1.default.user.findUnique({
        where: { doctorId },
    });
    if (existingLink && existingLink.id !== userId) {
        throw new apiError_1.ApiError("This Doctor is already linked to another User account", 409);
    }
    await client_1.default.user.update({
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
async function updateAppointmentStatus(appointmentId, status, cancellationReason) {
    const appointment = await client_1.default.appointment.findUnique({
        where: { id: appointmentId },
    });
    if (!appointment) {
        throw new apiError_1.ApiError("Appointment not found", 404);
    }
    const updated = await client_1.default.appointment.update({
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
        (0, emailService_1.sendBookingStatusUpdateEmail)(updated.user.email, {
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
        (0, emailService_1.sendBookingNotificationToDoctorEmail)(updated.doctor.userAccount.email, {
            patientName: updated.user?.fullName || updated.user?.email || "Bệnh nhân",
            doctorName: updated.doctor.name,
            appointmentDate: updated.appointmentDate,
            notes: updated.notes,
            appointmentId: updated.id,
        }).catch((err) => console.error("Error sending doctor notification email:", err));
    }
    return updated;
}
/**
 * Returns appointments that are pending approval (status PENDING and has paymentProof)
 */
async function getPendingPayments() {
    return client_1.default.appointment.findMany({
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
