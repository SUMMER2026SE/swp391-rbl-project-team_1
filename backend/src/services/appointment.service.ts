import { Appointment } from "@prisma/client";

import prisma from "../prisma/client";
import { ApiError } from "../utils/apiError";
import { sendBookingConfirmationEmail } from "../utils/emailService";

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

    // prevent self-booking
    const doctorUser = await prisma.user.findUnique({
        where: { doctorId: params.doctorId }
    });
    if (doctorUser && doctorUser.id === params.userId) {
        throw new ApiError("Bạn không thể tự đặt lịch khám với chính mình.", 400);
    }

    // prevent duplicate booking for the same doctor at the exact same datetime
    const existing = await prisma.appointment.findFirst({
        where: {
            doctorId: params.doctorId,
            appointmentDate: params.appointmentDate,
            status: { not: "CANCELLED" }
        },
    });

    if (existing) {
        throw new ApiError("Selected slot already booked", 409);
    }

    const created = await prisma.appointment.create({
        data: {
            userId: params.userId,
            doctorId: params.doctorId,
            appointmentDate: params.appointmentDate,
            status: "PENDING",
            notes: params.notes,
        },
    });

    // Fetch details asynchronously to send booking confirmation email
    prisma.appointment.findUnique({
        where: { id: created.id },
        include: {
            user: true,
            doctor: {
                include: {
                    specialty: true,
                    clinic: true
                }
            }
        }
    }).then((fullAppt) => {
        if (fullAppt && fullAppt.user.email) {
            sendBookingConfirmationEmail(fullAppt.user.email, {
                patientName: fullAppt.user.fullName || fullAppt.user.email,
                doctorName: fullAppt.doctor.name,
                specialtyName: fullAppt.doctor.specialty.name,
                clinicName: fullAppt.doctor.clinic?.name || fullAppt.doctor.hospital,
                appointmentDate: fullAppt.appointmentDate,
                notes: fullAppt.notes,
                status: "PENDING"
            }).catch((err) => console.error("Error sending confirmation email:", err));
        }
    }).catch((err) => console.error("Error loading appointment details for email:", err));

    return created;
}

export async function getAppointmentsByUser(userId: string): Promise<Appointment[]> {
    return prisma.appointment.findMany({
        where: { userId },
        include: {
            doctor: true,
            medicalRecord: {
                include: {
                    prescriptions: true,
                },
            },
            user: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    gender: true,
                    dateOfBirth: true,
                    avatar: true,
                },
            },
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
                    fullName: true,
                    avatar: true,
                    gender: true,
                    dateOfBirth: true,
                    bloodType: true,
                    allergies: true,
                    chronicDiseases: true,
                    personalHistory: true,
                    familyHistory: true,
                },
            },
            doctor: true,
            medicalRecord: {
                include: {
                    prescriptions: true,
                },
            },
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
                    fullName: true,
                    gender: true,
                    dateOfBirth: true,
                    avatar: true,
                },
            },
            doctor: true,
            medicalRecord: {
                include: {
                    prescriptions: true,
                },
            },
        },
        orderBy: {
            appointmentDate: "asc",
        },
    });
}

