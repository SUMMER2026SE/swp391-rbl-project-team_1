import { NextFunction, Response } from "express";

import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { createAppointment, getAppointmentsByUser } from "../services/appointment.service";
import { ApiError } from "../utils/apiError";

interface CreateAppointmentRequestBody {
    doctorId: string;
    appointmentDate: string;
    notes?: string;
}

/**
 * POST /api/appointments
 * Protected (USER role): Books a new appointment.
 */
export async function createAppointmentHandler(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            throw new ApiError("Authentication required", 401);
        }

        const { doctorId, appointmentDate, notes } = req.body as CreateAppointmentRequestBody;

        if (!doctorId || !appointmentDate) {
            throw new ApiError("Doctor ID and appointment date are required", 400);
        }

        const date = new Date(appointmentDate);

        if (Number.isNaN(date.getTime())) {
            throw new ApiError("Invalid appointment date format", 400);
        }

        if (date < new Date()) {
            throw new ApiError("Appointment date must be in the future", 400);
        }

        const appointment = await createAppointment({
            userId,
            doctorId,
            appointmentDate: date,
            notes,
        });

        res.status(201).json({
            message: "Appointment created successfully",
            appointment,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/my-appointments
 * Protected (USER role): Returns the authenticated user's appointments.
 */
export async function getMyAppointments(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            throw new ApiError("Authentication required", 401);
        }

        const appointments = await getAppointmentsByUser(userId);
        res.json({
            message: "Appointments fetched successfully",
            count: appointments.length,
            appointments,
        });
    } catch (error) {
        next(error);
    }
}
