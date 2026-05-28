import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { PrismaClient, AppointmentStatus } from "@prisma/client";

const prisma = new PrismaClient();

// Utility to get the logged-in doctor
const getDoctor = async (userId: string) => {
    return prisma.doctor.findFirst({
        where: { userAccount: { id: userId } }
    });
};

export const getDashboardStats = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const doctor = await getDoctor(req.user!.userId);
        if (!doctor) return res.status(404).json({ message: "Doctor profile not found" });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const totalAppointmentsToday = await prisma.appointment.count({
            where: {
                doctorId: doctor.id,
                appointmentDate: { gte: today, lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
            }
        });

        const pendingAppointments = await prisma.appointment.count({
            where: { doctorId: doctor.id, status: AppointmentStatus.PENDING }
        });

        const completedAppointments = await prisma.appointment.count({
            where: { doctorId: doctor.id, status: AppointmentStatus.COMPLETED }
        });

        const cancelledAppointments = await prisma.appointment.count({
            where: { doctorId: doctor.id, status: AppointmentStatus.CANCELLED }
        });

        const totalPatients = await prisma.appointment.groupBy({
            by: ['userId'],
            where: { doctorId: doctor.id }
        });

        res.json({
            totalAppointmentsToday,
            pendingAppointments,
            completedAppointments,
            cancelledAppointments,
            totalPatients: totalPatients.length
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

export const getDoctorProfile = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const doctor = await prisma.doctor.findFirst({
            where: { userAccount: { id: req.user!.userId } },
            include: { specialty: true, clinic: true }
        });
        if (!doctor) return res.status(404).json({ message: "Doctor profile not found" });
        res.json(doctor);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

export const getAvailableSpecialtiesAndClinics = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const specialties = await prisma.specialty.findMany({ select: { id: true, name: true } });
        const clinics = await prisma.clinic.findMany({ select: { id: true, name: true, address: true } });
        res.json({ specialties, clinics });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

export const updateDoctorProfile = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const doctor = await getDoctor(req.user!.userId);
        if (!doctor) return res.status(404).json({ message: "Doctor profile not found" });

        const { name, experience, avatar, specialtyId, clinicId, price, phone, description } = req.body;

        const updatedDoctor = await prisma.doctor.update({
            where: { id: doctor.id },
            data: {
                name,
                experience: experience ? parseInt(experience) : undefined,
                avatar,
                specialtyId,
                clinicId,
                price: price ? parseInt(price) : undefined,
                phone,
                description
            },
            include: { specialty: true, clinic: true }
        });

        res.json({ message: "Profile updated successfully", doctor: updatedDoctor });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// --- SCHEDULES ---
export const getDoctorSchedules = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const doctor = await getDoctor(req.user!.userId);
        if (!doctor) return res.status(404).json({ message: "Doctor profile not found" });

        const schedules = await prisma.doctorSchedule.findMany({
            where: { doctorId: doctor.id },
            orderBy: { dayOfWeek: 'asc' }
        });
        res.json(schedules);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

export const createDoctorSchedule = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const doctor = await getDoctor(req.user!.userId);
        if (!doctor) return res.status(404).json({ message: "Doctor profile not found" });

        const { dayOfWeek, startTime, endTime, isAvailable } = req.body;

        const schedule = await prisma.doctorSchedule.create({
            data: {
                doctorId: doctor.id,
                dayOfWeek: parseInt(dayOfWeek),
                startTime,
                endTime,
                isAvailable: isAvailable ?? true
            }
        });
        res.json({ message: "Schedule created", schedule });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

export const updateDoctorSchedule = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const doctor = await getDoctor(req.user!.userId);
        if (!doctor) return res.status(404).json({ message: "Doctor profile not found" });

        const { id } = req.params;
        const { dayOfWeek, startTime, endTime, isAvailable } = req.body;

        const schedule = await prisma.doctorSchedule.update({
            where: { id, doctorId: doctor.id },
            data: {
                dayOfWeek: dayOfWeek !== undefined ? parseInt(dayOfWeek) : undefined,
                startTime,
                endTime,
                isAvailable
            }
        });
        res.json({ message: "Schedule updated", schedule });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

export const deleteDoctorSchedule = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const doctor = await getDoctor(req.user!.userId);
        if (!doctor) return res.status(404).json({ message: "Doctor profile not found" });

        const { id } = req.params;
        await prisma.doctorSchedule.delete({
            where: { id, doctorId: doctor.id }
        });
        res.json({ message: "Schedule deleted" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// --- APPOINTMENTS ---
export const getDoctorAppointments = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const doctor = await getDoctor(req.user!.userId);
        if (!doctor) return res.status(404).json({ message: "Doctor profile not found" });

        const appointments = await prisma.appointment.findMany({
            where: { doctorId: doctor.id },
            include: { user: { select: { id: true, fullName: true, email: true, gender: true, dateOfBirth: true, avatar: true } } },
            orderBy: { appointmentDate: 'desc' }
        });
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

export const updateAppointmentStatus = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const doctor = await getDoctor(req.user!.userId);
        if (!doctor) return res.status(404).json({ message: "Doctor profile not found" });

        const { id } = req.params;
        const { status, notes, cancellationReason } = req.body;

        const appointment = await prisma.appointment.update({
            where: { id, doctorId: doctor.id },
            data: { status, notes, cancellationReason }
        });
        res.json({ message: "Appointment status updated", appointment });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// --- PATIENTS & MEDICAL RECORDS ---
export const getDoctorPatients = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const doctor = await getDoctor(req.user!.userId);
        if (!doctor) return res.status(404).json({ message: "Doctor profile not found" });

        // Get distinct patients for this doctor
        const appointments = await prisma.appointment.findMany({
            where: { doctorId: doctor.id },
            include: { user: { select: { id: true, fullName: true, email: true, gender: true, dateOfBirth: true, avatar: true } } }
        });
        
        const uniquePatientsMap = new Map();
        for (const appt of appointments) {
            if (!uniquePatientsMap.has(appt.userId)) {
                uniquePatientsMap.set(appt.userId, appt.user);
            }
        }

        res.json(Array.from(uniquePatientsMap.values()));
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

export const getPatientMedicalRecords = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const doctor = await getDoctor(req.user!.userId);
        if (!doctor) return res.status(404).json({ message: "Doctor profile not found" });

        const { userId } = req.params;
        const records = await prisma.medicalRecord.findMany({
            where: { doctorId: doctor.id, userId },
            include: { appointment: true, prescriptions: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(records);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

export const createMedicalRecord = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const doctor = await getDoctor(req.user!.userId);
        if (!doctor) return res.status(404).json({ message: "Doctor profile not found" });

        const { appointmentId, userId, diagnosis, notes } = req.body;

        const record = await prisma.medicalRecord.create({
            data: {
                appointmentId,
                doctorId: doctor.id,
                userId,
                diagnosis,
                notes
            }
        });
        res.json({ message: "Medical record created", record });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

export const createPrescription = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { medicalRecordId, medicationName, dosage, frequency, duration } = req.body;

        const prescription = await prisma.prescription.create({
            data: {
                medicalRecordId,
                medicationName,
                dosage,
                frequency,
                duration
            }
        });
        res.json({ message: "Prescription added", prescription });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
