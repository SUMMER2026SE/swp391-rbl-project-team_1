import { NextFunction, Request, Response } from "express";
import { createDoctorSchedule, getSchedulesByDoctor } from "../services/schedule.service";
import { ApiError } from "../utils/apiError";
import prisma from "../prisma/client";

interface CreateScheduleBody {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isAvailable?: boolean;
}

export async function createSchedule(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const doctorId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!doctorId) {
            throw new ApiError("Doctor id is required", 400);
        }

        const body = req.body as CreateScheduleBody;
        if (body.dayOfWeek === undefined || !body.startTime || !body.endTime) {
            throw new ApiError("dayOfWeek, startTime and endTime are required", 400);
        }

        const schedule = await createDoctorSchedule({
            doctorId,
            dayOfWeek: body.dayOfWeek,
            startTime: body.startTime,
            endTime: body.endTime,
            isAvailable: body.isAvailable,
        });

        res.status(201).json({ message: "Schedule created", schedule });
    } catch (error) {
        next(error);
    }
}

export async function listSchedules(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const doctorId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!doctorId) {
            throw new ApiError("Doctor id is required", 400);
        }

        const schedules = await getSchedulesByDoctor(doctorId);

        // Fetch active appointments (not cancelled) starting from 24 hours ago
        const startThreshold = new Date();
        startThreshold.setHours(startThreshold.getHours() - 24);

        const activeAppointments = await prisma.appointment.findMany({
            where: {
                doctorId,
                appointmentDate: {
                    gte: startThreshold,
                },
                status: {
                    in: ["PENDING", "CONFIRMED", "COMPLETED"]
                }
            },
            select: {
                appointmentDate: true
            }
        });

        const bookedCounts: Record<string, number> = {};
        activeAppointments.forEach(app => {
            const iso = app.appointmentDate.toISOString();
            bookedCounts[iso] = (bookedCounts[iso] || 0) + 1;
        });

        res.json({
            message: "Schedules fetched",
            schedules,
            bookedCounts
        });
    } catch (error) {
        next(error);
    }
}
