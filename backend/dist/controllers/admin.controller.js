"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsers = getUsers;
exports.getAppointments = getAppointments;
exports.updateUser = updateUser;
exports.removeUser = removeUser;
exports.linkDoctorToUser = linkDoctorToUser;
exports.updateAppointmentStatusHandler = updateAppointmentStatusHandler;
const client_1 = require("@prisma/client");
const admin_service_1 = require("../services/admin.service");
const user_service_1 = require("../services/user.service");
const apiError_1 = require("../utils/apiError");
/**
 * GET /api/admin/users
 * Returns all users (without passwords). ADMIN only.
 */
async function getUsers(_req, res, next) {
    try {
        const users = await (0, admin_service_1.getAllUsers)();
        res.json({
            message: "Users retrieved successfully",
            count: users.length,
            data: users,
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/admin/appointments
 * Returns all appointments with user and doctor details. ADMIN only.
 */
async function getAppointments(_req, res, next) {
    try {
        const appointments = await (0, admin_service_1.getAllAppointments)();
        res.json({
            message: "Appointments retrieved successfully",
            count: appointments.length,
            data: appointments,
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * PUT /api/admin/users/:id
 * Updates a user's role. ADMIN only.
 */
async function updateUser(req, res, next) {
    try {
        const id = req.params.id;
        if (!id) {
            throw new apiError_1.ApiError("User ID is required", 400);
        }
        const { role } = req.body;
        if (!role || !Object.values(client_1.Role).includes(role)) {
            throw new apiError_1.ApiError(`Invalid role. Must be one of: ${Object.values(client_1.Role).join(", ")}`, 400);
        }
        const updatedUser = await (0, user_service_1.updateUserRole)(id, role);
        res.json({
            message: "User role updated successfully",
            data: updatedUser,
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * DELETE /api/admin/users/:id
 * Deletes a user and their appointments. ADMIN only. Cannot delete admins.
 */
async function removeUser(req, res, next) {
    try {
        const id = req.params.id;
        if (!id) {
            throw new apiError_1.ApiError("User ID is required", 400);
        }
        // Prevent admin from deleting themselves
        if (req.user?.userId === id) {
            throw new apiError_1.ApiError("Cannot delete your own account", 400);
        }
        await (0, admin_service_1.deleteUser)(id);
        res.json({
            message: "User deleted successfully",
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * POST /api/admin/users/:userId/link-doctor/:doctorId
 * Links a User account (with DOCTOR role) to a Doctor record.
 * ADMIN only. Required for DOCTOR-role users to access /doctor/appointments.
 */
async function linkDoctorToUser(req, res, next) {
    try {
        const userId = req.params.userId;
        const doctorId = req.params.doctorId;
        if (!userId || !doctorId) {
            throw new apiError_1.ApiError("userId and doctorId are required", 400);
        }
        const result = await (0, admin_service_1.linkDoctorToUser)(userId, doctorId);
        res.json({
            message: result.message,
            data: { userId: result.userId, doctorId: result.doctorId },
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * PUT /api/admin/appointments/:id/status
 * Updates an appointment's status.
 */
async function updateAppointmentStatusHandler(req, res, next) {
    try {
        const id = req.params.id;
        if (!id) {
            throw new apiError_1.ApiError("Appointment ID is required", 400);
        }
        const { status } = req.body;
        if (!status || !Object.values(client_1.AppointmentStatus).includes(status)) {
            throw new apiError_1.ApiError(`Invalid status. Must be one of: ${Object.values(client_1.AppointmentStatus).join(", ")}`, 400);
        }
        const appointment = await (0, admin_service_1.updateAppointmentStatus)(id, status);
        res.json({
            message: "Appointment status updated successfully",
            data: appointment,
        });
    }
    catch (error) {
        next(error);
    }
}
