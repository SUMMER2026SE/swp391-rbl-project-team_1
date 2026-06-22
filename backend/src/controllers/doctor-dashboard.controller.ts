import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { AppointmentStatus } from "@prisma/client";
import prisma from "../prisma/client";
import {
    createMedicalRecordForDoctor,
    addPrescriptionToRecord,
    getDoctorMedicalRecords,
} from "../services/medical-record.service";
import { getStructuredEmrFromTranscript, getStructuredEmrFromAudio } from "../services/gemini.service";

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

        // Fetch clinic name to keep the legacy `hospital` text field in sync
        let hospitalName = undefined;
        if (clinicId) {
            const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
            if (clinic) {
                hospitalName = clinic.name;
            }
        }

        const updatedDoctor = await prisma.doctor.update({
            where: { id: doctor.id },
            data: {
                name,
                experience: experience ? parseInt(experience) : undefined,
                avatar,
                specialtyId,
                clinicId,
                ...(hospitalName && { hospital: hospitalName }),
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

        const parsedDay = parseInt(dayOfWeek);
        if (isNaN(parsedDay) || parsedDay < 0 || parsedDay > 6) {
            return res.status(400).json({ message: "Invalid dayOfWeek. Must be between 0 and 6." });
        }

        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!startTime || !timeRegex.test(startTime)) {
            return res.status(400).json({ message: "Invalid startTime format. Use HH:mm." });
        }
        if (!endTime || !timeRegex.test(endTime)) {
            return res.status(400).json({ message: "Invalid endTime format. Use HH:mm." });
        }
        if (startTime >= endTime) {
            return res.status(400).json({ message: "startTime must be before endTime." });
        }

        const schedule = await prisma.doctorSchedule.create({
            data: {
                doctorId: doctor.id,
                dayOfWeek: parsedDay,
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

        const { id } = req.params as { id: string };
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

        const { id } = req.params as { id: string };
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

        const { id } = req.params as { id: string };
        const { status, notes } = req.body;

        const appointment = await prisma.appointment.update({
            where: { id, doctorId: doctor.id },
            data: { status, notes }
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

export const getPatientMedicalRecords = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const doctor = await getDoctor(req.user!.userId);
        if (!doctor) return res.status(404).json({ message: "Doctor profile not found" });

        const { userId } = req.params as { userId: string };
        const records = await getDoctorMedicalRecords(doctor.id, userId);
        res.json(records);
    } catch (error) {
        next(error);
    }
};

export const createMedicalRecord = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const doctor = await getDoctor(req.user!.userId);
        if (!doctor) return res.status(404).json({ message: "Doctor profile not found" });

        const { appointmentId, userId, diagnosis, notes } = req.body;

        const record = await createMedicalRecordForDoctor(doctor.id, {
            appointmentId,
            userId,
            diagnosis,
            notes,
        });
        res.status(201).json({ message: "Medical record created", record });
    } catch (error) {
        next(error);
    }
};

export const createPrescription = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const doctor = await getDoctor(req.user!.userId);
        if (!doctor) return res.status(404).json({ message: "Doctor profile not found" });

        const { medicalRecordId, medicationName, dosage, frequency, duration } = req.body;

        const prescription = await addPrescriptionToRecord(doctor.id, {
            medicalRecordId,
            medicationName,
            dosage,
            frequency,
            duration,
        });
        res.status(201).json({ message: "Prescription added", prescription });
    } catch (error) {
        next(error);
    }
};

export const getEmrTranscribeAssist = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { transcript } = req.body;
        if (!transcript) {
            return res.status(400).json({ message: "Transcript text is required" });
        }

        const structuredEmr = await getStructuredEmrFromTranscript(transcript);
        res.json({
            message: "EMR structured successfully by AI",
            data: structuredEmr,
        });
    } catch (error) {
        next(error);
    }
};

export const getEmrTranscribeAudio = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { audioData, mimeType } = req.body;
        if (!audioData) {
            return res.status(400).json({ message: "Audio data is required" });
        }

        const result = await getStructuredEmrFromAudio(audioData, mimeType || "audio/webm");
        res.json({
            message: "Audio transcribed and structured successfully by AI",
            transcript: result.transcript,
            structuredData: result.structuredData,
        });
    } catch (error) {
        next(error);
    }
};

