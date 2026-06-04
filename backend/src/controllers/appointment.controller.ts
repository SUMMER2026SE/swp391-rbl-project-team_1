import { NextFunction, Response, Request } from "express";

import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { createAppointment, getAppointmentsByUser, getAppointmentById } from "../services/appointment.service";
import { ApiError } from "../utils/apiError";
import prisma from "../prisma/client";

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
 * GET /api/appointments/:id
 * Protected: Returns appointment details.
 */
export async function getAppointmentByIdHandler(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.userId;
        const userRole = req.user?.role;

        if (!userId) {
            throw new ApiError("Authentication required", 401);
        }

        const { id } = req.params;

        if (!id) {
            throw new ApiError("Appointment ID is required", 400);
        }

        const appointment = await getAppointmentById(id as string);

        if (!appointment) {
            throw new ApiError("Appointment not found", 404);
        }

        let isAuthorized = false;

        if (appointment.userId === userId) {
            isAuthorized = true;
        } else if (userRole === "DOCTOR") {
            const doctorUser = await prisma.user.findUnique({
                where: { id: userId },
                select: { doctorId: true }
            });
            if (doctorUser && doctorUser.doctorId === appointment.doctorId) {
                isAuthorized = true;
            }
        } else if (userRole === "ADMIN") {
            isAuthorized = true;
        }

        if (!isAuthorized) {
            throw new ApiError("You are not authorized to view this appointment", 403);
        }

        res.json({
            message: "Appointment fetched successfully",
            appointment,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/appointments/:id/prescription/public
 * Public endpoint to verify a prescription. No auth token required.
 */
export async function getPublicPrescriptionHandler(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { id } = req.params;

        if (!id) {
            throw new ApiError("Appointment ID is required", 400);
        }

        const appointment = await prisma.appointment.findUnique({
            where: { id: id as string },
            select: {
                id: true,
                appointmentDate: true,
                status: true,
                user: {
                    select: {
                        fullName: true,
                        gender: true,
                        dateOfBirth: true,
                    },
                },
                doctor: {
                    select: {
                        name: true,
                        hospital: true,
                        specialty: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
                medicalRecord: {
                    select: {
                        diagnosis: true,
                        notes: true,
                        prescriptions: {
                            select: {
                                id: true,
                                medicationName: true,
                                dosage: true,
                                frequency: true,
                                duration: true,
                            },
                        },
                        createdAt: true,
                    },
                },
            },
        });

        if (!appointment) {
            throw new ApiError("Appointment not found", 404);
        }

        if (appointment.status !== "COMPLETED" || !appointment.medicalRecord) {
            throw new ApiError("No completed prescription found for this appointment", 404);
        }

        res.json({
            message: "Prescription verified successfully",
            verified: true,
            prescription: appointment,
        });
    } catch (error) {
        next(error);
    }
}
