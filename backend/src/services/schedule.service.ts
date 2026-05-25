import prisma from "../prisma/client";
import { DoctorSchedule } from "@prisma/client";
import { ApiError } from "../utils/apiError";

export interface CreateScheduleParams {
    doctorId: string;
    dayOfWeek: number;
    startTime: string; // HH:MM
    endTime: string; // HH:MM
    isAvailable?: boolean;
}

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
