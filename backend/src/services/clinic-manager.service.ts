import bcrypt from "bcrypt";
import { Doctor, DoctorStatus, Role, AppointmentStatus, DoctorSchedule, Appointment } from "@prisma/client";

import prisma from "../prisma/client";
import { ApiError } from "../utils/apiError";

/**
 * Gets all doctors belonging to a specific clinic.
 */
export async function getClinicDoctors(clinicId: string): Promise<Doctor[]> {
    return prisma.doctor.findMany({
        where: { clinicId },
        include: {
            specialty: true,
            userAccount: {
                select: {
                    id: true,
                    email: true,
                    role: true,
                },
            },
        },
        orderBy: { name: "asc" },
    });
}

/**
 * Creates a new Doctor record and their corresponding User account.
 */
export async function createClinicDoctor(
    clinicId: string,
    data: {
        name: string;
        email: string;
        specialtyId: string;
        experience: number;
        avatar?: string;
        price?: number;
        phone?: string;
        description?: string;
    }
): Promise<Doctor> {
    const normalizedEmail = data.email.toLowerCase();

    // 1. Check if clinic exists
    const clinic = await prisma.clinic.findUnique({
        where: { id: clinicId },
    });

    if (!clinic) {
        throw new ApiError("Clinic not found", 404);
    }

    // 2. Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
    });

    if (existingUser) {
        throw new ApiError("Email already registered for a user account", 400);
    }

    // 3. Verify specialty exists
    const specialty = await prisma.specialty.findUnique({
        where: { id: data.specialtyId },
    });

    if (!specialty) {
        throw new ApiError("Specialty not found", 404);
    }

    // 4. Hash default password
    const hashedPassword = await bcrypt.hash("123456", 12);

    // 5. Create doctor and linked user inside a transaction
    return prisma.$transaction(async (tx) => {
        const doctor = await tx.doctor.create({
            data: {
                name: data.name,
                experience: data.experience,
                hospital: clinic.name,
                avatar: data.avatar || "/public/doctors/default.jpg",
                specialtyId: data.specialtyId,
                clinicId: clinicId,
                status: DoctorStatus.APPROVED, // Pre-approved by clinic manager
                price: data.price || 150000,
                phone: data.phone,
                description: data.description,
            },
            include: { specialty: true },
        });

        await tx.user.create({
            data: {
                email: normalizedEmail,
                password: hashedPassword,
                role: Role.DOCTOR,
                doctorId: doctor.id,
                fullName: data.name,
                clinicId: clinicId, // Linked to the same clinic
            },
        });

        return doctor;
    });
}

/**
 * Updates a doctor belonging to the manager's clinic.
 */
export async function updateClinicDoctor(
    clinicId: string,
    doctorId: string,
    data: {
        name?: string;
        experience?: number;
        specialtyId?: string;
        avatar?: string;
        price?: number;
        phone?: string;
        description?: string;
    }
): Promise<Doctor> {
    const doctor = await prisma.doctor.findFirst({
        where: { id: doctorId, clinicId },
    });

    if (!doctor) {
        throw new ApiError("Doctor not found in your clinic", 404);
    }

    const updateData: any = { ...data };

    if (data.specialtyId) {
        const specialty = await prisma.specialty.findUnique({
            where: { id: data.specialtyId },
        });
        if (!specialty) {
            throw new ApiError("Specialty not found", 404);
        }
    }

    return prisma.doctor.update({
        where: { id: doctorId },
        data: updateData,
        include: { specialty: true },
    });
}

/**
 * Removes a doctor from the clinic.
 */
export async function removeClinicDoctor(clinicId: string, doctorId: string): Promise<void> {
    const doctor = await prisma.doctor.findFirst({
        where: { id: doctorId, clinicId },
    });

    if (!doctor) {
        throw new ApiError("Doctor not found in your clinic", 404);
    }

    await prisma.$transaction(async (tx) => {
        // 1. Set User doctorId to null and demote role to USER
        await tx.user.updateMany({
            where: { doctorId },
            data: {
                doctorId: null,
                role: Role.USER,
            },
        });

        // 2. Delete Doctor Schedules
        await tx.doctorSchedule.deleteMany({
            where: { doctorId },
        });

        // 3. Delete reviews linked to doctor
        await tx.review.deleteMany({
            where: { doctorId },
        });

        // 4. Delete prescriptions linked to doctor's medical records
        await tx.prescription.deleteMany({
            where: {
                medicalRecord: { doctorId },
            },
        });

        // 5. Delete medical records linked to doctor
        await tx.medicalRecord.deleteMany({
            where: { doctorId },
        });

        // 6. Delete notifications linked to doctor's appointments
        await tx.notification.deleteMany({
            where: {
                appointment: { doctorId },
            },
        });

        // 7. Delete appointments linked to doctor
        await tx.appointment.deleteMany({
            where: { doctorId },
        });

        // 8. Delete Doctor record
        await tx.doctor.delete({
            where: { id: doctorId },
        });
    });
}

/**
 * Gets schedules for all doctors in the clinic.
 */
export async function getClinicSchedules(clinicId: string): Promise<DoctorSchedule[]> {
    return prisma.doctorSchedule.findMany({
        where: {
            doctor: { clinicId },
        },
        include: {
            doctor: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
        orderBy: { dayOfWeek: "asc" },
    });
}

/**
 * Creates/adds a doctor schedule for a doctor in the clinic.
 */
export async function createClinicDoctorSchedule(
    clinicId: string,
    data: {
        doctorId: string;
        dayOfWeek: number;
        startTime: string;
        endTime: string;
    }
): Promise<DoctorSchedule> {
    const doctor = await prisma.doctor.findFirst({
        where: { id: data.doctorId, clinicId },
    });

    if (!doctor) {
        throw new ApiError("Doctor not found in your clinic", 404);
    }

    // Check if schedule already exists for this day and time
    const existing = await prisma.doctorSchedule.findFirst({
        where: {
            doctorId: data.doctorId,
            dayOfWeek: data.dayOfWeek,
            startTime: data.startTime,
            endTime: data.endTime,
        },
    });

    if (existing) {
        throw new ApiError("Schedule for this day and time already exists for this doctor", 400);
    }

    return prisma.doctorSchedule.create({
        data: {
            doctorId: data.doctorId,
            dayOfWeek: data.dayOfWeek,
            startTime: data.startTime,
            endTime: data.endTime,
            isAvailable: true,
        },
    });
}

/**
 * Gets appointments booked for the clinic's doctors.
 */
export async function getClinicAppointments(clinicId: string): Promise<Appointment[]> {
    return prisma.appointment.findMany({
        where: {
            doctor: { clinicId },
        },
        include: {
            doctor: {
                select: {
                    id: true,
                    name: true,
                    specialty: true,
                },
            },
            user: {
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                },
            },
        },
        orderBy: { appointmentDate: "desc" },
    });
}

/**
 * Updates an appointment's status for a doctor in the clinic.
 */
export async function updateClinicAppointmentStatus(
    clinicId: string,
    appointmentId: string,
    status: AppointmentStatus
): Promise<Appointment> {
    const appointment = await prisma.appointment.findFirst({
        where: {
            id: appointmentId,
            doctor: { clinicId },
        },
    });

    if (!appointment) {
        throw new ApiError("Appointment not found in your clinic", 404);
    }

    return prisma.appointment.update({
        where: { id: appointmentId },
        data: { status },
        include: {
            doctor: {
                select: { id: true, name: true },
            },
            user: {
                select: { id: true, fullName: true, email: true },
            },
        },
    });
}
