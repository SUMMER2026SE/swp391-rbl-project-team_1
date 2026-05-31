"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEmrTranscriptionAssistHandler = exports.createPrescription = exports.createMedicalRecord = exports.getPatientMedicalRecords = exports.getDoctorPatients = exports.updateAppointmentStatus = exports.getDoctorAppointments = exports.deleteDoctorSchedule = exports.updateDoctorSchedule = exports.createDoctorSchedule = exports.getDoctorSchedules = exports.updateDoctorProfile = exports.getAvailableSpecialtiesAndClinics = exports.getDoctorProfile = exports.getDashboardStats = void 0;
const client_1 = require("@prisma/client");
const client_2 = __importDefault(require("../prisma/client"));
const medical_record_service_1 = require("../services/medical-record.service");
const gemini_service_1 = require("../services/gemini.service");
// Utility to get the logged-in doctor
const getDoctor = async (userId) => {
    return client_2.default.doctor.findFirst({
        where: { userAccount: { id: userId } }
    });
};
const getDashboardStats = async (req, res) => {
    try {
        const doctor = await getDoctor(req.user.userId);
        if (!doctor)
            return res.status(404).json({ message: "Doctor profile not found" });
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const totalAppointmentsToday = await client_2.default.appointment.count({
            where: {
                doctorId: doctor.id,
                appointmentDate: { gte: today, lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
            }
        });
        const pendingAppointments = await client_2.default.appointment.count({
            where: { doctorId: doctor.id, status: client_1.AppointmentStatus.PENDING }
        });
        const completedAppointments = await client_2.default.appointment.count({
            where: { doctorId: doctor.id, status: client_1.AppointmentStatus.COMPLETED }
        });
        const cancelledAppointments = await client_2.default.appointment.count({
            where: { doctorId: doctor.id, status: client_1.AppointmentStatus.CANCELLED }
        });
        const totalPatients = await client_2.default.appointment.groupBy({
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
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
exports.getDashboardStats = getDashboardStats;
const getDoctorProfile = async (req, res) => {
    try {
        const doctor = await client_2.default.doctor.findFirst({
            where: { userAccount: { id: req.user.userId } },
            include: { specialty: true, clinic: true }
        });
        if (!doctor)
            return res.status(404).json({ message: "Doctor profile not found" });
        res.json(doctor);
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
exports.getDoctorProfile = getDoctorProfile;
const getAvailableSpecialtiesAndClinics = async (req, res) => {
    try {
        const specialties = await client_2.default.specialty.findMany({ select: { id: true, name: true } });
        const clinics = await client_2.default.clinic.findMany({ select: { id: true, name: true, address: true } });
        res.json({ specialties, clinics });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
exports.getAvailableSpecialtiesAndClinics = getAvailableSpecialtiesAndClinics;
const updateDoctorProfile = async (req, res) => {
    try {
        const doctor = await getDoctor(req.user.userId);
        if (!doctor)
            return res.status(404).json({ message: "Doctor profile not found" });
        const { name, experience, avatar, specialtyId, clinicId, price, phone, description } = req.body;
        const updatedDoctor = await client_2.default.doctor.update({
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
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
exports.updateDoctorProfile = updateDoctorProfile;
// --- SCHEDULES ---
const getDoctorSchedules = async (req, res) => {
    try {
        const doctor = await getDoctor(req.user.userId);
        if (!doctor)
            return res.status(404).json({ message: "Doctor profile not found" });
        const schedules = await client_2.default.doctorSchedule.findMany({
            where: { doctorId: doctor.id },
            orderBy: { dayOfWeek: 'asc' }
        });
        res.json(schedules);
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
exports.getDoctorSchedules = getDoctorSchedules;
const createDoctorSchedule = async (req, res) => {
    try {
        const doctor = await getDoctor(req.user.userId);
        if (!doctor)
            return res.status(404).json({ message: "Doctor profile not found" });
        const { dayOfWeek, startTime, endTime, isAvailable } = req.body;
        const schedule = await client_2.default.doctorSchedule.create({
            data: {
                doctorId: doctor.id,
                dayOfWeek: parseInt(dayOfWeek),
                startTime,
                endTime,
                isAvailable: isAvailable ?? true
            }
        });
        res.json({ message: "Schedule created", schedule });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
exports.createDoctorSchedule = createDoctorSchedule;
const updateDoctorSchedule = async (req, res) => {
    try {
        const doctor = await getDoctor(req.user.userId);
        if (!doctor)
            return res.status(404).json({ message: "Doctor profile not found" });
        const { id } = req.params;
        const { dayOfWeek, startTime, endTime, isAvailable } = req.body;
        const schedule = await client_2.default.doctorSchedule.update({
            where: { id, doctorId: doctor.id },
            data: {
                dayOfWeek: dayOfWeek !== undefined ? parseInt(dayOfWeek) : undefined,
                startTime,
                endTime,
                isAvailable
            }
        });
        res.json({ message: "Schedule updated", schedule });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
exports.updateDoctorSchedule = updateDoctorSchedule;
const deleteDoctorSchedule = async (req, res) => {
    try {
        const doctor = await getDoctor(req.user.userId);
        if (!doctor)
            return res.status(404).json({ message: "Doctor profile not found" });
        const { id } = req.params;
        await client_2.default.doctorSchedule.delete({
            where: { id, doctorId: doctor.id }
        });
        res.json({ message: "Schedule deleted" });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
exports.deleteDoctorSchedule = deleteDoctorSchedule;
// --- APPOINTMENTS ---
const getDoctorAppointments = async (req, res) => {
    try {
        const doctor = await getDoctor(req.user.userId);
        if (!doctor)
            return res.status(404).json({ message: "Doctor profile not found" });
        const appointments = await client_2.default.appointment.findMany({
            where: { doctorId: doctor.id },
            include: { user: { select: { id: true, fullName: true, email: true, gender: true, dateOfBirth: true, avatar: true } } },
            orderBy: { appointmentDate: 'desc' }
        });
        res.json(appointments);
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
exports.getDoctorAppointments = getDoctorAppointments;
const updateAppointmentStatus = async (req, res) => {
    try {
        const doctor = await getDoctor(req.user.userId);
        if (!doctor)
            return res.status(404).json({ message: "Doctor profile not found" });
        const { id } = req.params;
        const { status, notes } = req.body;
        const appointment = await client_2.default.appointment.update({
            where: { id, doctorId: doctor.id },
            data: { status, notes }
        });
        res.json({ message: "Appointment status updated", appointment });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
exports.updateAppointmentStatus = updateAppointmentStatus;
// --- PATIENTS & MEDICAL RECORDS ---
const getDoctorPatients = async (req, res) => {
    try {
        const doctor = await getDoctor(req.user.userId);
        if (!doctor)
            return res.status(404).json({ message: "Doctor profile not found" });
        // Get distinct patients for this doctor
        const appointments = await client_2.default.appointment.findMany({
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
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
exports.getDoctorPatients = getDoctorPatients;
const getPatientMedicalRecords = async (req, res, next) => {
    try {
        const doctor = await getDoctor(req.user.userId);
        if (!doctor)
            return res.status(404).json({ message: "Doctor profile not found" });
        const { userId } = req.params;
        const records = await (0, medical_record_service_1.getDoctorMedicalRecords)(doctor.id, userId);
        res.json(records);
    }
    catch (error) {
        next(error);
    }
};
exports.getPatientMedicalRecords = getPatientMedicalRecords;
const createMedicalRecord = async (req, res, next) => {
    try {
        const doctor = await getDoctor(req.user.userId);
        if (!doctor)
            return res.status(404).json({ message: "Doctor profile not found" });
        const { appointmentId, userId, diagnosis, notes } = req.body;
        const record = await (0, medical_record_service_1.createMedicalRecordForDoctor)(doctor.id, {
            appointmentId,
            userId,
            diagnosis,
            notes,
        });
        res.status(201).json({ message: "Medical record created", record });
    }
    catch (error) {
        next(error);
    }
};
exports.createMedicalRecord = createMedicalRecord;
const createPrescription = async (req, res, next) => {
    try {
        const doctor = await getDoctor(req.user.userId);
        if (!doctor)
            return res.status(404).json({ message: "Doctor profile not found" });
        const { medicalRecordId, medicationName, dosage, frequency, duration } = req.body;
        const prescription = await (0, medical_record_service_1.addPrescriptionToRecord)(doctor.id, {
            medicalRecordId,
            medicationName,
            dosage,
            frequency,
            duration,
        });
        res.status(201).json({ message: "Prescription added", prescription });
    }
    catch (error) {
        next(error);
    }
};
exports.createPrescription = createPrescription;
const getEmrTranscriptionAssistHandler = async (req, res, next) => {
    try {
        const { transcription } = req.body;
        if (!transcription) {
            return res.status(400).json({ message: "Nội dung cuộc hội thoại là bắt buộc" });
        }
        const emrDraftJson = await (0, gemini_service_1.generateEmrFromTranscription)(transcription);
        let parsedData;
        try {
            let cleanedJson = emrDraftJson.trim();
            if (cleanedJson.startsWith("```json")) {
                cleanedJson = cleanedJson.substring(7, cleanedJson.length - 3).trim();
            }
            else if (cleanedJson.startsWith("```")) {
                cleanedJson = cleanedJson.substring(3, cleanedJson.length - 3).trim();
            }
            parsedData = JSON.parse(cleanedJson);
        }
        catch (e) {
            console.error("JSON parse failed, returning raw string:", e);
            parsedData = emrDraftJson;
        }
        res.json({
            message: "Tạo bệnh án nháp thành công",
            data: parsedData
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getEmrTranscriptionAssistHandler = getEmrTranscriptionAssistHandler;
