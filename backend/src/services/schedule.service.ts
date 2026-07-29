import prisma from "../prisma/client";
import { DoctorSchedule } from "@prisma/client";
import { ApiError } from "../utils/apiError";

/**
 * Parameters required to create a new doctor schedule.
 */
export interface CreateScheduleParams {
    /** The unique identifier of the doctor */
    doctorId: string;
    /** Day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday) */
    dayOfWeek: number;
    /** Start time of the schedule slot in HH:MM format */
    startTime: string; // HH:MM
    /** End time of the schedule slot in HH:MM format */
    endTime: string; // HH:MM
    /** Availability flag, defaults to true */
    isAvailable?: boolean;
}

/**
 * Creates a new schedule for a specific doctor after validating existence and time formats.
 * 
 * @param params - Configuration parameters for the schedule
 * @returns The created DoctorSchedule object
 */
export async function createDoctorSchedule(
    params: CreateScheduleParams
): Promise<DoctorSchedule> {
    const doctor = await prisma.doctor.findUnique({ where: { id: params.doctorId } });
    if (!doctor) {
        throw new ApiError("Doctor not found", 404);
    }

    // Basic validation of times
    if (!/^\d{2}:\d{2}$/.test(params.startTime) || !/^\d{2}:\d{2}$/.test(params.endTime)) {
        throw new ApiError("Invalid time format. Use HH:MM", 400);
    }

    return prisma.doctorSchedule.create({
        data: {
            doctorId: params.doctorId,
            dayOfWeek: params.dayOfWeek,
            startTime: params.startTime,
            endTime: params.endTime,
            isAvailable: params.isAvailable ?? true,
        },
    });
}

export async function getSchedulesByDoctor(doctorId: string) {
    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor) {
        throw new ApiError("Doctor not found", 404);
    }

    return prisma.doctorSchedule.findMany({ where: { doctorId } });
}
