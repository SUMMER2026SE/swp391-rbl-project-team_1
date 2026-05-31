import { Appointment } from "@prisma/client";

import prisma from "../prisma/client";
import { ApiError } from "../utils/apiError";

export interface CreateAppointmentParams {
    userId: string;
    doctorId: string;
    appointmentDate: Date;
    notes?: string;
}

export async function createAppointment(
    params: CreateAppointmentParams
): Promise<Appointment> {
    const doctor = await prisma.doctor.findUnique({ where: { id: params.doctorId } });

    if (!doctor) {
        throw new ApiError("Doctor not found", 404);
    }

    // prevent duplicate booking for the same doctor at the exact same datetime
    const existing = await prisma.appointment.findFirst({
        where: {
            doctorId: params.doctorId,
            appointmentDate: params.appointmentDate,
        },
    });

    if (existing) {
        throw new ApiError("Selected slot already booked", 409);
    }

    // Calculate queue number for this doctor on this day
    const dateStart = new Date(params.appointmentDate);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(params.appointmentDate);
    dateEnd.setHours(23, 59, 59, 999);

    const lastAppointment = await prisma.appointment.findFirst({
        where: {
            doctorId: params.doctorId,
            appointmentDate: {
                gte: dateStart,
                lte: dateEnd,
            },
        },
        orderBy: {
            queueNumber: "desc",
        },
    });

    const queueNumber = lastAppointment && lastAppointment.queueNumber 
        ? lastAppointment.queueNumber + 1 
        : 1;

    return prisma.appointment.create({
        data: {
            userId: params.userId,
            doctorId: params.doctorId,
            appointmentDate: params.appointmentDate,
            status: "PENDING",
            notes: params.notes,
            queueNumber,
        },
    });
}

export async function getQueueStatus(appointmentId: string) {
    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { doctor: true },
    });

    if (!appointment) {
        throw new ApiError("Appointment not found", 404);
    }

    const { doctorId, appointmentDate, queueNumber } = appointment;
    if (!queueNumber) {
        return {
            queueNumber: null,
            currentlyCalling: null,
            patientsAhead: 0,
            estimatedWaitMinutes: 0,
            averageTimePerPatient: 15,
        };
    }

    const startOfDay = new Date(appointmentDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(appointmentDate);
    endOfDay.setHours(23, 59, 59, 999);

    const activeAppointment = await prisma.appointment.findFirst({
        where: {
            doctorId,
            appointmentDate: {
                gte: startOfDay,
                lte: endOfDay,
            },
            status: {
                in: ["PENDING", "CONFIRMED"],
            },
        },
        orderBy: {
            queueNumber: "asc",
        },
    });

    const currentlyCalling = activeAppointment ? activeAppointment.queueNumber || 1 : queueNumber;
    const patientsAhead = Math.max(0, queueNumber - currentlyCalling);
    
    // Default wait time is 15 minutes per patient
    let averageTimePerPatient = 15;

    return {
        queueNumber,
        currentlyCalling,
        patientsAhead,
        estimatedWaitMinutes: patientsAhead * averageTimePerPatient,
        averageTimePerPatient,
    };
}

export async function getAppointmentsByUser(userId: string): Promise<Appointment[]> {
    return prisma.appointment.findMany({
        where: { userId },
        include: {
            doctor: true,
        },
        orderBy: {
            appointmentDate: "desc",
        },
    });
}

export async function getAllAppointments(): Promise<Appointment[]> {
    return prisma.appointment.findMany({
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    role: true,
                },
            },
            doctor: true,
        },
        orderBy: {
            appointmentDate: "desc",
        },
    });
}

export async function getAppointmentById(id: string): Promise<Appointment | null> {
    return prisma.appointment.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    role: true,
                },
            },
            doctor: true,
        },
    });
}

export async function getDoctorAppointments(doctorId: string): Promise<Appointment[]> {
    return prisma.appointment.findMany({
        where: { doctorId },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    role: true,
                },
            },
            doctor: true,
        },
        orderBy: {
            appointmentDate: "asc",
        },
    });
}

