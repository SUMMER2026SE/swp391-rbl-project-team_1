import { NextFunction, Response } from "express";
import { Role, AppointmentStatus } from "@prisma/client";

import { AuthenticatedRequest } from "../middleware/auth.middleware";
import {
    getAllUsers,
    getAllAppointments,
    deleteUser,
    linkDoctorToUser as linkDoctorToUserService,
    updateAppointmentStatus,
} from "../services/admin.service";
import { updateUserRole } from "../services/user.service";
import { ApiError } from "../utils/apiError";


/**
 * GET /api/admin/users
 * Returns all users (without passwords). ADMIN only.
 */
export async function getUsers(
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const users = await getAllUsers();
        res.json({
            message: "Users retrieved successfully",
            count: users.length,
            data: users,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/admin/appointments
 * Returns all appointments with user and doctor details. ADMIN only.
 */
export async function getAppointments(
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const appointments = await getAllAppointments();
        res.json({
            message: "Appointments retrieved successfully",
            count: appointments.length,
            data: appointments,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/admin/users/:id
 * Updates a user's role. ADMIN only.
 */
export async function updateUser(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const id = req.params.id as string;

        if (!id) {
            throw new ApiError("User ID is required", 400);
        }

        const { role } = req.body as { role?: string };

        if (!role || !Object.values(Role).includes(role as Role)) {
            throw new ApiError(
                `Invalid role. Must be one of: ${Object.values(Role).join(", ")}`,
                400
            );
        }

        const updatedUser = await updateUserRole(id, role as Role);
        res.json({
            message: "User role updated successfully",
            data: updatedUser,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * DELETE /api/admin/users/:id
 * Deletes a user and their appointments. ADMIN only. Cannot delete admins.
 */
export async function removeUser(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const id = req.params.id as string;

        if (!id) {
            throw new ApiError("User ID is required", 400);
        }

        // Prevent admin from deleting themselves
        if (req.user?.userId === id) {
            throw new ApiError("Cannot delete your own account", 400);
        }

        await deleteUser(id);
        res.json({
            message: "User deleted successfully",
        });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/admin/users/:userId/link-doctor/:doctorId
 * Links a User account (with DOCTOR role) to a Doctor record.
 * ADMIN only. Required for DOCTOR-role users to access /doctor/appointments.
 */
export async function linkDoctorToUser(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.params.userId as string;
        const doctorId = req.params.doctorId as string;

        if (!userId || !doctorId) {
            throw new ApiError("userId and doctorId are required", 400);
        }

        const result = await linkDoctorToUserService(userId, doctorId);
        res.json({
            message: result.message,
            data: { userId: result.userId, doctorId: result.doctorId },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/admin/appointments/:id/status
 * Updates an appointment's status.
 */
export async function updateAppointmentStatusHandler(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const id = req.params.id as string;

        if (!id) {
            throw new ApiError("Appointment ID is required", 400);
        }

        const { status, cancellationReason } = req.body as { status?: string; cancellationReason?: string };

        if (!status || !Object.values(AppointmentStatus).includes(status as AppointmentStatus)) {
            throw new ApiError(
                `Invalid status. Must be one of: ${Object.values(AppointmentStatus).join(", ")}`,
                400
            );
        }

        const appointment = await updateAppointmentStatus(id, status as AppointmentStatus, cancellationReason);
        res.json({
            message: "Appointment status updated successfully",
            data: appointment,
        });
    } catch (error) {
        next(error);
    }
}
