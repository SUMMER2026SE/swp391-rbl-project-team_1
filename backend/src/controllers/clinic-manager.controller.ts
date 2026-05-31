import { NextFunction, Response } from "express";
import { Role, AppointmentStatus } from "@prisma/client";

import { AuthenticatedRequest } from "../middleware/auth.middleware";
import * as clinicManagerService from "../services/clinic-manager.service";
import prisma from "../prisma/client";
import { ApiError } from "../utils/apiError";

/**
 * Helper to fetch the manager's clinicId securely from DB.
 */
async function getClinicIdOrThrow(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { clinicId: true, role: true },
    });

    if (!user) {
        throw new ApiError("User not found", 404);
    }

    if (user.role !== Role.CLINIC_MANAGER || !user.clinicId) {
        throw new ApiError("Forbidden: You are not assigned as a clinic manager to any clinic", 403);
    }

    return user.clinicId;
}

/**
 * GET /api/clinic-manager/doctors
 */
export async function getClinicDoctorsHandler(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user?.userId) {
            throw new ApiError("Authentication credentials missing", 401);
        }

        const clinicId = await getClinicIdOrThrow(req.user.userId);
        const doctors = await clinicManagerService.getClinicDoctors(clinicId);

        res.json({
            message: "Clinic doctors retrieved successfully",
            count: doctors.length,
            data: doctors,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/clinic-manager/doctors
 */
export async function createClinicDoctorHandler(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user?.userId) {
            throw new ApiError("Authentication credentials missing", 401);
        }

        const { name, email, specialtyId, experience, avatar, price, phone, description } = req.body as {
            name?: string;
            email?: string;
            specialtyId?: string;
            experience?: number;
            avatar?: string;
            price?: number;
            phone?: string;
            description?: string;
        };

        if (!name || !email || !specialtyId || experience === undefined) {
            throw new ApiError("Name, email, specialtyId, and experience are required", 400);
        }

        const clinicId = await getClinicIdOrThrow(req.user.userId);
        const doctor = await clinicManagerService.createClinicDoctor(clinicId, {
            name,
            email,
            specialtyId,
            experience: Number(experience),
            avatar,
            price: price ? Number(price) : undefined,
            phone,
            description,
        });

        res.status(201).json({
            message: "Doctor created and registered in your clinic successfully",
            data: doctor,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/clinic-manager/doctors/:id
 */
export async function updateClinicDoctorHandler(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user?.userId) {
            throw new ApiError("Authentication credentials missing", 401);
        }

        const doctorId = req.params.id as string;
        if (!doctorId) {
            throw new ApiError("Doctor ID is required", 400);
        }

        const { name, experience, specialtyId, avatar, price, phone, description } = req.body as {
            name?: string;
            experience?: number;
            specialtyId?: string;
            avatar?: string;
            price?: number;
            phone?: string;
            description?: string;
        };

        const clinicId = await getClinicIdOrThrow(req.user.userId);
        const doctor = await clinicManagerService.updateClinicDoctor(clinicId, doctorId, {
            name,
            experience: experience ? Number(experience) : undefined,
            specialtyId,
            avatar,
            price: price ? Number(price) : undefined,
            phone,
            description,
        });

        res.json({
            message: "Doctor updated successfully",
            data: doctor,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * DELETE /api/clinic-manager/doctors/:id
 */
export async function removeClinicDoctorHandler(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user?.userId) {
            throw new ApiError("Authentication credentials missing", 401);
        }

        const doctorId = req.params.id as string;
        if (!doctorId) {
            throw new ApiError("Doctor ID is required", 400);
        }

        const clinicId = await getClinicIdOrThrow(req.user.userId);
        await clinicManagerService.removeClinicDoctor(clinicId, doctorId);

        res.json({
            message: "Doctor removed from clinic successfully",
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/clinic-manager/schedules
 */
export async function getClinicSchedulesHandler(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user?.userId) {
            throw new ApiError("Authentication credentials missing", 401);
        }

        const clinicId = await getClinicIdOrThrow(req.user.userId);
        const schedules = await clinicManagerService.getClinicSchedules(clinicId);

        res.json({
            message: "Clinic schedules retrieved successfully",
            count: schedules.length,
            data: schedules,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/clinic-manager/schedules
 */
export async function createClinicDoctorScheduleHandler(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user?.userId) {
            throw new ApiError("Authentication credentials missing", 401);
        }

        const { doctorId, dayOfWeek, startTime, endTime } = req.body as {
            doctorId?: string;
            dayOfWeek?: number;
            startTime?: string;
            endTime?: string;
        };

        if (!doctorId || dayOfWeek === undefined || !startTime || !endTime) {
            throw new ApiError("DoctorId, dayOfWeek, startTime, and endTime are required", 400);
        }

        const clinicId = await getClinicIdOrThrow(req.user.userId);
        const schedule = await clinicManagerService.createClinicDoctorSchedule(clinicId, {
            doctorId,
            dayOfWeek: Number(dayOfWeek),
            startTime,
            endTime,
        });

        res.status(201).json({
            message: "Doctor schedule created successfully",
            data: schedule,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/clinic-manager/appointments
 */
export async function getClinicAppointmentsHandler(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user?.userId) {
            throw new ApiError("Authentication credentials missing", 401);
        }

        const clinicId = await getClinicIdOrThrow(req.user.userId);
        const appointments = await clinicManagerService.getClinicAppointments(clinicId);

        res.json({
            message: "Clinic appointments retrieved successfully",
            count: appointments.length,
            data: appointments,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/clinic-manager/appointments/:id/status
 */
export async function updateClinicAppointmentStatusHandler(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user?.userId) {
            throw new ApiError("Authentication credentials missing", 401);
        }

        const appointmentId = req.params.id as string;
        const { status } = req.body as { status?: string };

        if (!appointmentId) {
            throw new ApiError("Appointment ID is required", 400);
        }

        if (!status || !Object.values(AppointmentStatus).includes(status as AppointmentStatus)) {
            throw new ApiError(
                `Invalid status. Must be one of: ${Object.values(AppointmentStatus).join(", ")}`,
                400
            );
        }

        const clinicId = await getClinicIdOrThrow(req.user.userId);
        const appointment = await clinicManagerService.updateClinicAppointmentStatus(
            clinicId,
            appointmentId,
            status as AppointmentStatus
        );

        res.json({
            message: "Appointment status updated successfully",
            data: appointment,
        });
    } catch (error) {
        next(error);
    }
}
