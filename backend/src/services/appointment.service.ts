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

    return prisma.appointment.create({
        data: {
            userId: params.userId,
            doctorId: params.doctorId,
            appointmentDate: params.appointmentDate,
            status: "PENDING",
            notes: params.notes,
        },
    });
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

