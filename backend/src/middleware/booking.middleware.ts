import { NextFunction, Request, Response } from "express";
import prisma from "../prisma/client";
import { ApiError } from "../utils/apiError";
import { AuthenticatedRequest } from "./auth.middleware";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeToMinutes(t: string): number {
    const parts = t.split(":");
    const hh = parts[0] ?? "0";
    const mm = parts[1] ?? "0";
    return parseInt(hh, 10) * 60 + parseInt(mm, 10);
}

interface BookingRequest extends AuthenticatedRequest {
    matchedScheduleId?: string;
}

// ─── Middleware ───────────────────────────────────────────────────────────────

/**
 * Middleware: Validates that a booking slot is:
 * 1. On a day the doctor has an available schedule
 * 2. Within the doctor's schedule time range
 * 3. Not already booked by another patient
 *
 * Must be used after verifyToken.
 */
export async function validateBookingSlot(
    req: Request,
    _res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const r = req as BookingRequest;
        const userId = r.user?.userId;

        if (!userId) {
            throw new ApiError("Authentication required", 401);
        }

        const { doctorId, appointmentDate } = req.body as {
            doctorId?: string;
            appointmentDate?: string;
        };

        if (!doctorId || !appointmentDate) {
            throw new ApiError("doctorId and appointmentDate are required", 400);
        }

        const date = new Date(appointmentDate);
        if (Number.isNaN(date.getTime())) {
            throw new ApiError("Invalid appointment date", 400);
        }

        const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
        if (!doctor) {
            throw new ApiError("Doctor not found", 404);
        }

        const dayOfWeek = date.getDay(); // 0 = Sunday ... 6 = Saturday
        const schedules = await prisma.doctorSchedule.findMany({
            where: { doctorId, dayOfWeek, isAvailable: true },
        });

        if (schedules.length === 0) {
            throw new ApiError(
                "No available schedule for this doctor on the selected day",
                400
            );
        }

        const appointmentMinutes = date.getHours() * 60 + date.getMinutes();

        const matched = schedules.find((s) => {
            const start = timeToMinutes(s.startTime);
            const end = timeToMinutes(s.endTime);
            return appointmentMinutes >= start && appointmentMinutes < end;
        });

        if (!matched) {
            throw new ApiError("Selected time is outside the doctor's available slots", 400);
        }

        // Check for duplicate appointment at same doctor + exact time
        const conflict = await prisma.appointment.findFirst({
            where: { doctorId, appointmentDate: date },
        });

        if (conflict) {
            throw new ApiError("This slot is already booked. Please choose another time.", 409);
        }

        // Attach matched schedule ID for downstream use if needed
        r.matchedScheduleId = matched.id;

        next();
    } catch (error) {
        next(error);
    }
}
