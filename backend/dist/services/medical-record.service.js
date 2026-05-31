"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserMedicalRecords = getUserMedicalRecords;
exports.getUserMedicalRecordById = getUserMedicalRecordById;
exports.getDoctorMedicalRecords = getDoctorMedicalRecords;
exports.createMedicalRecordForDoctor = createMedicalRecordForDoctor;
exports.addPrescriptionToRecord = addPrescriptionToRecord;
exports.getPrescriptionsByRecordId = getPrescriptionsByRecordId;
const client_1 = require("@prisma/client");
const client_2 = __importDefault(require("../prisma/client"));
const apiError_1 = require("../utils/apiError");
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
};
async function getUserMedicalRecords(userId) {
    return client_2.default.medicalRecord.findMany({
        where: { userId },
        include: recordInclude,
        orderBy: { createdAt: "desc" },
    });
}
async function getUserMedicalRecordById(userId, recordId) {
    const record = await client_2.default.medicalRecord.findFirst({
        where: { id: recordId, userId },
        include: recordInclude,
    });
    if (!record) {
        throw new apiError_1.ApiError("Medical record not found", 404);
    }
    return record;
}
async function getDoctorMedicalRecords(doctorId, userId) {
    return client_2.default.medicalRecord.findMany({
        where: { doctorId, ...(userId ? { userId } : {}) },
        include: recordInclude,
        orderBy: { createdAt: "desc" },
    });
}
async function createMedicalRecordForDoctor(doctorId, input) {
    const appointment = await client_2.default.appointment.findFirst({
        where: { id: input.appointmentId, doctorId },
    });
    if (!appointment) {
        throw new apiError_1.ApiError("Appointment not found for this doctor", 404);
    }
    if (appointment.userId !== input.userId) {
        throw new apiError_1.ApiError("Patient does not match appointment", 400);
    }
    if (appointment.status !== client_1.AppointmentStatus.COMPLETED && appointment.status !== client_1.AppointmentStatus.CONFIRMED) {
        throw new apiError_1.ApiError("Medical records can only be created for confirmed or completed appointments", 400);
    }
    const existing = await client_2.default.medicalRecord.findUnique({
        where: { appointmentId: input.appointmentId },
    });
    if (existing) {
        throw new apiError_1.ApiError("Medical record already exists for this appointment", 409);
    }
    return client_2.default.medicalRecord.create({
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
async function addPrescriptionToRecord(doctorId, input) {
    const record = await client_2.default.medicalRecord.findFirst({
        where: { id: input.medicalRecordId, doctorId },
    });
    if (!record) {
        throw new apiError_1.ApiError("Medical record not found", 404);
    }
    return client_2.default.prescription.create({
        data: {
            medicalRecordId: input.medicalRecordId,
            medicationName: input.medicationName,
            dosage: input.dosage,
            frequency: input.frequency,
            duration: input.duration,
        },
    });
}
async function getPrescriptionsByRecordId(userId, medicalRecordId) {
    const record = await client_2.default.medicalRecord.findFirst({
        where: { id: medicalRecordId, userId },
        include: { prescriptions: true },
    });
    if (!record) {
        throw new apiError_1.ApiError("Medical record not found", 404);
    }
    return record.prescriptions;
}
