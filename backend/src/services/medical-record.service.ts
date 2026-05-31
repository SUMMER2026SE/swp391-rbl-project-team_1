import { AppointmentStatus, Prisma } from "@prisma/client";
import prisma from "../prisma/client";
import { ApiError } from "../utils/apiError";

const recordInclude = {
    prescriptions: true,
    appointment: {
        select: {
            id: true,
            appointmentDate: true,
            status: true,
            doctor: { select: { id: true, name: true, avatar: true, specialty: { select: { name: true } } } },
        },
    },
    doctor: { select: { id: true, name: true, avatar: true } },
} satisfies Prisma.MedicalRecordInclude;

export type MedicalRecordWithDetails = Prisma.MedicalRecordGetPayload<{ include: typeof recordInclude }>;

export async function getUserMedicalRecords(userId: string): Promise<MedicalRecordWithDetails[]> {
    return prisma.medicalRecord.findMany({
        where: { userId },
        include: recordInclude,
        orderBy: { createdAt: "desc" },
    });
}

export async function getUserMedicalRecordById(
    userId: string,
    recordId: string
): Promise<MedicalRecordWithDetails> {
    const record = await prisma.medicalRecord.findFirst({
        where: { id: recordId, userId },
        include: recordInclude,
    });

    if (!record) {
        throw new ApiError("Medical record not found", 404);
    }

    return record;
}

export async function getDoctorMedicalRecords(
    doctorId: string,
    userId?: string
): Promise<MedicalRecordWithDetails[]> {
    return prisma.medicalRecord.findMany({
        where: { doctorId, ...(userId ? { userId } : {}) },
        include: recordInclude,
        orderBy: { createdAt: "desc" },
    });
}

export async function createMedicalRecordForDoctor(
    doctorId: string,
    input: { appointmentId: string; userId: string; diagnosis: string; notes?: string }
): Promise<MedicalRecordWithDetails> {
    const appointment = await prisma.appointment.findFirst({
        where: { id: input.appointmentId, doctorId },
    });

    if (!appointment) {
        throw new ApiError("Appointment not found for this doctor", 404);
    }

    if (appointment.userId !== input.userId) {
        throw new ApiError("Patient does not match appointment", 400);
    }

    if (appointment.status !== AppointmentStatus.COMPLETED && appointment.status !== AppointmentStatus.CONFIRMED) {
        throw new ApiError("Medical records can only be created for confirmed or completed appointments", 400);
    }

    const existing = await prisma.medicalRecord.findUnique({
        where: { appointmentId: input.appointmentId },
    });

    if (existing) {
        throw new ApiError("Medical record already exists for this appointment", 409);
    }

    return prisma.medicalRecord.create({
        data: {
            appointmentId: input.appointmentId,
            doctorId,
            userId: input.userId,
            diagnosis: input.diagnosis,
            notes: input.notes,
        },
        include: recordInclude,
    });
}

export async function addPrescriptionToRecord(
    doctorId: string,
    input: {
        medicalRecordId: string;
        medicationName: string;
        dosage: string;
        frequency: string;
        duration: string;
    }
) {
    const record = await prisma.medicalRecord.findFirst({
        where: { id: input.medicalRecordId, doctorId },
    });

    if (!record) {
        throw new ApiError("Medical record not found", 404);
    }

    return prisma.prescription.create({
        data: {
            medicalRecordId: input.medicalRecordId,
            medicationName: input.medicationName,
            dosage: input.dosage,
            frequency: input.frequency,
            duration: input.duration,
        },
    });
}

export async function getPrescriptionsByRecordId(
    userId: string,
    medicalRecordId: string
) {
    const record = await prisma.medicalRecord.findFirst({
        where: { id: medicalRecordId, userId },
        include: { prescriptions: true },
    });

    if (!record) {
        throw new ApiError("Medical record not found", 404);
    }

    return record.prescriptions;
}
