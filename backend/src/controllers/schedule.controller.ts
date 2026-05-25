import { NextFunction, Request, Response } from "express";
import { createDoctorSchedule, getSchedulesByDoctor } from "../services/schedule.service";
import { ApiError } from "../utils/apiError";

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
        res.json({ message: "Schedules fetched", schedules });
    } catch (error) {
        next(error);
    }
}
