import { NextFunction, Response } from "express";
import { DoctorStatus } from "@prisma/client";

import prisma from "../prisma/client";
import { AuthenticatedRequest } from "./auth.middleware";
import { ApiError } from "../utils/apiError";

/**
 * Ensures the authenticated DOCTOR account is approved and not locked.
 * Must run after verifyToken + verifyDoctor.
 */
export async function verifyApprovedDoctor(
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user?.userId) {
            next(new ApiError("User not authenticated", 401));
            return;
        }

        const doctor = await prisma.doctor.findFirst({
            where: { userAccount: { id: req.user.userId } },
            select: { id: true, status: true, isLocked: true },
        });

        if (!doctor) {
            next(new ApiError("Doctor profile not found", 404));
            return;
        }

        if (doctor.status !== DoctorStatus.APPROVED) {
            next(
                new ApiError(
                    "Your doctor account is not approved yet. Please wait for admin approval.",
                    403
                )
            );
            return;
        }

        if (doctor.isLocked) {
            next(new ApiError("Your doctor account has been locked. Contact support.", 403));
            return;
        }

        next();
    } catch (error) {
        next(error);
    }
}

/**
 * Validates a doctor (by doctorId) is approved and not locked — for booking/public actions.
 */
export async function validateDoctorAvailable(
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { doctorId } = req.body as { doctorId?: string };

        if (!doctorId) {
            next(new ApiError("doctorId is required", 400));
            return;
        }

        const doctor = await prisma.doctor.findUnique({
            where: { id: doctorId },
            select: { status: true, isLocked: true },
        });

        if (!doctor) {
            next(new ApiError("Doctor not found", 404));
            return;
        }

        if (doctor.status !== DoctorStatus.APPROVED) {
            next(new ApiError("This doctor is not available for booking", 400));
            return;
        }

        if (doctor.isLocked) {
            next(new ApiError("This doctor is currently unavailable", 400));
            return;
        }

        next();
    } catch (error) {
        next(error);
    }
}
