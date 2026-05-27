import { NextFunction, Response } from "express";

import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { getAllDoctors, getPendingDoctors, moderateDoctor } from "../services/admin-doctors.service";
import { ApiError } from "../utils/apiError";
import prisma from "../prisma/client";

/**
 * GET /api/admin/doctors
 * Returns all doctors with specialty, clinic, and userAccount relations.
 */
export async function getDoctors(
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const doctors = await getAllDoctors();
        res.json({
            message: "Doctors retrieved successfully",
            count: doctors.length,
            data: doctors,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/admin/doctors/:id/moderation
 * Moderates a doctor: approve, reject, lock, or unlock.
 */
export async function moderateDoctorHandler(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const id = req.params.id as string;

        if (!id) {
            throw new ApiError("Doctor ID is required", 400);
        }

        const { action, reason } = req.body as {
            action?: string;
            reason?: string;
        };

        if (!action) {
            throw new ApiError("Action is required", 400);
        }

        const validActions = ["approve", "reject", "lock", "unlock"] as const;
        if (!validActions.includes(action as typeof validActions[number])) {
            throw new ApiError(
                `Invalid action. Must be one of: ${validActions.join(", ")}`,
                400
            );
        }

        const doctor = await moderateDoctor(id, {
            action: action as "approve" | "reject" | "lock" | "unlock",
            reason,
        });

        res.json({
            message: `Doctor ${action}ed successfully`,
            data: doctor,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/admin/doctors/pending
 * Returns pending doctors.
 */
export async function getPendingDoctorsHandler(
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const doctors = await getPendingDoctors();
        res.json({
            message: "Pending doctors retrieved successfully",
            count: doctors.length,
            data: doctors,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * PATCH /api/admin/doctors/:id/approve
 * Approves a doctor.
 */
export async function approveDoctorHandler(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const id = req.params.id as string;
        if (!id) {
            throw new ApiError("Doctor ID is required", 400);
        }
        const doctor = await moderateDoctor(id, { action: "approve" });
        res.json({
            message: "Doctor approved successfully",
            data: doctor,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * PATCH /api/admin/doctors/:id/reject
 * Rejects a doctor.
 */
export async function rejectDoctorHandler(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const id = req.params.id as string;
        const { reason } = req.body as { reason?: string };
        if (!id) {
            throw new ApiError("Doctor ID is required", 400);
        }
        const doctor = await moderateDoctor(id, { action: "reject", reason });
        res.json({
            message: "Doctor rejected successfully",
            data: doctor,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * PATCH /api/admin/doctors/:id/lock
 * Toggle lock/unlock of a doctor account.
 */
export async function lockDoctorHandler(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const id = req.params.id as string;
        if (!id) {
            throw new ApiError("Doctor ID is required", 400);
        }
        
        // Find current lock state
        const current = await prisma.doctor.findUnique({ where: { id } });
        if (!current) {
            throw new ApiError("Doctor not found", 404);
        }
        
        const action = current.isLocked ? "unlock" : "lock";
        const doctor = await moderateDoctor(id, { action });
        res.json({
            message: `Doctor ${action}ed successfully`,
            data: doctor,
        });
    } catch (error) {
        next(error);
    }
}
