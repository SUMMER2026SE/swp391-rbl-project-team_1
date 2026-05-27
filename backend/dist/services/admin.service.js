"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUsers = getAllUsers;
exports.getAllAppointments = getAllAppointments;
exports.deleteUser = deleteUser;
exports.linkDoctorToUser = linkDoctorToUser;
exports.updateAppointmentStatus = updateAppointmentStatus;
const client_1 = __importDefault(require("../prisma/client"));
const client_2 = require("@prisma/client");
const apiError_1 = require("../utils/apiError");
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
async function updateAppointmentStatus(appointmentId, status) {
    const appointment = await client_1.default.appointment.findUnique({
        where: { id: appointmentId },
    });
    if (!appointment) {
        throw new apiError_1.ApiError("Appointment not found", 404);
    }
    return client_1.default.appointment.update({
        where: { id: appointmentId },
        data: { status },
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
    });
}
