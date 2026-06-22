import { NextFunction, Response } from "express";

import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { createAppointment, getAppointmentsByUser, getQueueStatus } from "../services/appointment.service";
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

/**
 * GET /api/appointments/:id/queue-status
 * Protected (USER/DOCTOR/ADMIN): Returns the appointment queue details.
 */
export async function getQueueStatusHandler(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { id } = req.params;
        if (!id) {
            throw new ApiError("Appointment ID is required", 400);
        }

        const queueStatus = await getQueueStatus(id as string);
        res.json({
            message: "Queue status fetched successfully",
            queueStatus,
        });
    } catch (error) {
        next(error);
    }
}

export async function getAppointmentDetailHandler(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { id } = req.params;
        if (!id) {
            throw new ApiError("Appointment ID is required", 400);
        }

        const prisma = (await import("../prisma/client")).default;

        const appointment = await prisma.appointment.findUnique({
            where: { id: id as string },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        avatar: true,
                        gender: true,
                        dateOfBirth: true,
                    }
                },
                doctor: {
                    include: {
                        userAccount: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
                                avatar: true,
                            }
                        }
                    }
                }
            }
        });

        if (!appointment) {
            throw new ApiError("Appointment not found", 404);
        }

        const role = req.user?.role;
        const reqUserId = req.user?.userId;

        if (role === "USER" && appointment.userId !== reqUserId) {
            throw new ApiError("Forbidden: You do not have access to this appointment", 403);
        }

        if (role === "DOCTOR" && appointment.doctor?.userAccount?.id !== reqUserId) {
            throw new ApiError("Forbidden: You do not have access to this appointment", 403);
        }

        res.json({
            message: "Appointment details fetched successfully",
            appointment,
        });
    } catch (error) {
        next(error);
    }
}
