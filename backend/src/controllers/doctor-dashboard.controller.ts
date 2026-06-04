import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { PrismaClient, AppointmentStatus } from "@prisma/client";
import { sendBookingStatusUpdateEmail } from "../utils/emailService";

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

const timeToMinutes = (t: string): number => {
    const parts = t.split(":");
    const hh = parseInt(parts[0] ?? "0", 10);
    const mm = parseInt(parts[1] ?? "0", 10);
    return hh * 60 + mm;
};

export const createDoctorSchedule = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const doctor = await getDoctor(req.user!.userId);
        if (!doctor) return res.status(404).json({ message: "Doctor profile not found" });

        const { dayOfWeek, startTime, endTime, isAvailable } = req.body;

        if (dayOfWeek === undefined || !startTime || !endTime) {
            return res.status(400).json({ message: "Vui lòng nhập đầy đủ các trường Thứ, Giờ bắt đầu, Giờ kết thúc." });
        }

        const dow = parseInt(dayOfWeek);
        if (isNaN(dow) || dow < 0 || dow > 6) {
            return res.status(400).json({ message: "Thứ trong tuần không hợp lệ." });
        }

        const timeRegex = /^\d{2}:\d{2}$/;
        if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
            return res.status(400).json({ message: "Định dạng thời gian không hợp lệ. Vui lòng dùng định dạng HH:MM." });
        }

        const startMin = timeToMinutes(startTime);
        const endMin = timeToMinutes(endTime);

        if (startMin >= endMin) {
            return res.status(400).json({ message: "Giờ bắt đầu phải trước giờ kết thúc." });
        }

        // Check overlap
        const existingSchedules = await prisma.doctorSchedule.findMany({
            where: {
                doctorId: doctor.id,
                dayOfWeek: dow
            }
        });

        const hasOverlap = existingSchedules.some(sch => {
            const schStart = timeToMinutes(sch.startTime);
            const schEnd = timeToMinutes(sch.endTime);
            return startMin < schEnd && endMin > schStart;
        });

        if (hasOverlap) {
            return res.status(400).json({ message: "Khung giờ này bị trùng lặp với lịch trực đã có vào ngày này." });
        }

        const schedule = await prisma.doctorSchedule.create({
            data: {
                doctorId: doctor.id,
                dayOfWeek: dow,
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

        const id = req.params.id as string;
        const { dayOfWeek, startTime, endTime, isAvailable } = req.body;

        const currentSchedule = await prisma.doctorSchedule.findFirst({
            where: { id, doctorId: doctor.id }
        });
        if (!currentSchedule) {
            return res.status(404).json({ message: "Không tìm thấy khung giờ trực này." });
        }

        const finalDayOfWeek = dayOfWeek !== undefined ? parseInt(dayOfWeek) : currentSchedule.dayOfWeek;
        const finalStartTime = startTime !== undefined ? startTime : currentSchedule.startTime;
        const finalEndTime = endTime !== undefined ? endTime : currentSchedule.endTime;

        const timeRegex = /^\d{2}:\d{2}$/;
        if (!timeRegex.test(finalStartTime) || !timeRegex.test(finalEndTime)) {
            return res.status(400).json({ message: "Định dạng thời gian không hợp lệ. Vui lòng dùng định dạng HH:MM." });
        }

        const startMin = timeToMinutes(finalStartTime);
        const endMin = timeToMinutes(finalEndTime);

        if (startMin >= endMin) {
            return res.status(400).json({ message: "Giờ bắt đầu phải trước giờ kết thúc." });
        }

        // Check overlap (excluding the schedule itself)
        const existingSchedules = await prisma.doctorSchedule.findMany({
            where: {
                doctorId: doctor.id,
                dayOfWeek: finalDayOfWeek,
                id: { not: id }
            }
        });

        const hasOverlap = existingSchedules.some(sch => {
            const schStart = timeToMinutes(sch.startTime);
            const schEnd = timeToMinutes(sch.endTime);
            return startMin < schEnd && endMin > schStart;
        });

        if (hasOverlap) {
            return res.status(400).json({ message: "Khung giờ này bị trùng lặp với lịch trực đã có vào ngày này." });
        }

        const schedule = await prisma.doctorSchedule.update({
            where: { id, doctorId: doctor.id },
            data: {
                dayOfWeek: finalDayOfWeek,
                startTime: finalStartTime,
                endTime: finalEndTime,
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

        const id = req.params.id as string;
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

        const id = req.params.id as string;
        const { status, notes, cancellationReason } = req.body;

        const appointmentObj = await prisma.appointment.findUnique({
            where: { id, doctorId: doctor.id }
        });

        if (!appointmentObj) {
            return res.status(404).json({ message: "Không tìm thấy lịch hẹn" });
        }

        if (status === "COMPLETED") {
            const appointmentTime = new Date(appointmentObj.appointmentDate);
            const now = new Date();
            if (now < appointmentTime) {
                return res.status(400).json({
                    message: "Không thể hoàn thành lịch hẹn trước thời gian khám dự kiến."
                });
            }
        }

        const appointment = await prisma.appointment.update({
            where: { id, doctorId: doctor.id },
            data: { status, notes, cancellationReason },
            include: {
                user: true,
                doctor: {
                    include: {
                        specialty: true,
                        clinic: true
                    }
                }
            }
        });

        if (appointment.user.email) {
            sendBookingStatusUpdateEmail(appointment.user.email, {
                patientName: appointment.user.fullName || appointment.user.email,
                doctorName: appointment.doctor.name,
                specialtyName: appointment.doctor.specialty.name,
                clinicName: appointment.doctor.clinic?.name || appointment.doctor.hospital,
                appointmentDate: appointment.appointmentDate,
                status: appointment.status,
                cancellationReason: appointment.cancellationReason,
                notes: appointment.notes
            }).catch((err) => console.error("Error sending status update email:", err));
        }

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

        const userId = req.params.userId as string;
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
