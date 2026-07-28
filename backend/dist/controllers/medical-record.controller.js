"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveRecord = exports.getRecordByAppointment = exports.getMyRecordByAppointment = exports.getMyMedicalRecords = void 0;
const emailService_1 = require("../utils/emailService");
const client_1 = __importDefault(require("../prisma/client"));
/**
 * Helper: resolve the Doctor record for the currently authenticated user.
 * Returns null if the user has no linked doctor profile.
 */
async function getDoctorForUser(userId) {
    const user = await client_1.default.user.findUnique({
        where: { id: userId },
        include: { doctor: true }
    });
    return user?.doctor ?? null;
}
// =====================================================================
// PATIENT-FACING: Get all my medical records
// GET /api/medical-records/my
// =====================================================================
const getMyMedicalRecords = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const records = await client_1.default.medicalRecord.findMany({
            where: { userId, status: 'COMPLETED' },
            include: {
                appointment: {
                    include: {
                        doctor: {
                            include: { specialty: true }
                        }
                    }
                },
                prescriptions: {
                    include: { medicine: true }
                },
                LabOrder: true,
            },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json({ success: true, data: records });
    }
    catch (error) {
        console.error('Error fetching my medical records:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};
exports.getMyMedicalRecords = getMyMedicalRecords;
// =====================================================================
// PATIENT-FACING: Get one medical record by appointmentId
// GET /api/medical-records/patient/appointment/:appointmentId
// =====================================================================
const getMyRecordByAppointment = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { appointmentId } = req.params;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const appointment = await client_1.default.appointment.findUnique({
            where: { id: appointmentId },
            include: {
                user: true,
                doctor: {
                    include: { specialty: true }
                }
            }
        });
        if (!appointment) {
            res.status(404).json({ success: false, message: 'Appointment not found' });
            return;
        }
        // Security: patient can only view their own records
        if (appointment.userId !== userId) {
            res.status(403).json({ success: false, message: 'Access denied' });
            return;
        }
        const record = await client_1.default.medicalRecord.findUnique({
            where: { appointmentId: appointmentId },
            include: {
                prescriptions: {
                    include: { medicine: true }
                },
                LabOrder: true,
            }
        });
        res.status(200).json({
            success: true,
            data: { appointment, record }
        });
    }
    catch (error) {
        console.error('Error fetching patient record:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};
exports.getMyRecordByAppointment = getMyRecordByAppointment;
const getRecordByAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const appointment = await client_1.default.appointment.findUnique({
            where: { id: appointmentId },
            include: {
                user: true,
                doctor: true
            }
        });
        if (!appointment) {
            res.status(404).json({ success: false, message: 'Appointment not found' });
            return;
        }
        // Security: verify the logged-in doctor is assigned to this appointment
        const doctor = await getDoctorForUser(userId);
        if (!doctor || appointment.doctorId !== doctor.id) {
            res.status(403).json({ success: false, message: 'Bạn không có quyền xem hồ sơ của lịch hẹn này' });
            return;
        }
        const record = await client_1.default.medicalRecord.findUnique({
            where: { appointmentId: appointmentId },
            include: {
                LabOrder: true,
                prescriptions: {
                    include: {
                        medicine: true
                    }
                }
            }
        });
        res.status(200).json({
            success: true,
            data: {
                appointment,
                record
            }
        });
    }
    catch (error) {
        console.error('Error fetching medical record:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};
exports.getRecordByAppointment = getRecordByAppointment;
const saveRecord = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const { height, weight, bloodPressure, heartRate, temperature, spo2, symptoms, physicalExam, preliminaryDiagnosis, finalDiagnosis, icd10Code, treatmentPlan, doctorNotes, followUpDate, severity, status, labOrders, prescriptions } = req.body;
        const appointment = await client_1.default.appointment.findUnique({
            where: { id: appointmentId },
            include: { user: true }
        });
        if (!appointment) {
            res.status(404).json({ success: false, message: 'Appointment not found' });
            return;
        }
        // Security: verify the logged-in doctor is assigned to this appointment
        const doctor = await getDoctorForUser(userId);
        if (!doctor || appointment.doctorId !== doctor.id) {
            res.status(403).json({ success: false, message: 'Bạn không có quyền tạo/cập nhật hồ sơ cho lịch hẹn này' });
            return;
        }
        if (!appointment.doctorId) {
            res.status(400).json({ success: false, message: 'Lịch hẹn không có bác sĩ đảm nhận' });
            return;
        }
        // Atomic transaction for upserting medical record and recreating lab orders / prescriptions
        const record = await client_1.default.$transaction(async (tx) => {
            // Upsert record
            const rec = await tx.medicalRecord.upsert({
                where: { appointmentId: appointmentId },
                update: {
                    height, weight, bloodPressure, heartRate, temperature, spo2,
                    symptoms, physicalExam, preliminaryDiagnosis, finalDiagnosis,
                    icd10Code, treatmentPlan, doctorNotes, followUpDate, severity, status
                },
                create: {
                    appointmentId: appointmentId,
                    doctorId: appointment.doctorId,
                    userId: appointment.userId,
                    height, weight, bloodPressure, heartRate, temperature, spo2,
                    symptoms, physicalExam, preliminaryDiagnosis, finalDiagnosis,
                    icd10Code, treatmentPlan, doctorNotes, followUpDate, severity, status
                }
            });
            // Handle lab orders
            if (labOrders && Array.isArray(labOrders)) {
                await tx.labOrder.deleteMany({
                    where: { medicalRecordId: rec.id }
                });
                if (labOrders.length > 0) {
                    await tx.labOrder.createMany({
                        data: labOrders.map((lo) => ({
                            medicalRecordId: rec.id,
                            testName: lo.testName,
                            testType: lo.testType,
                            notes: lo.notes,
                            status: lo.status || 'PENDING'
                        }))
                    });
                }
            }
            // Handle prescriptions
            if (prescriptions && Array.isArray(prescriptions)) {
                await tx.prescription.deleteMany({
                    where: { medicalRecordId: rec.id }
                });
                if (prescriptions.length > 0) {
                    await tx.prescription.createMany({
                        data: prescriptions.map((p) => ({
                            medicalRecordId: rec.id,
                            medicineId: p.medicineId,
                            dosage: p.dosage,
                            frequency: p.frequency,
                            durationDays: p.durationDays,
                            instructions: p.instructions,
                            quantity: p.quantity
                        }))
                    });
                }
            }
            // If status is COMPLETED, update appointment status
            if (status === 'COMPLETED') {
                await tx.appointment.update({
                    where: { id: appointmentId },
                    data: { status: 'COMPLETED' }
                });
            }
            return rec;
        });
        // Send email outside the transaction to prevent blocking
        if (status === 'COMPLETED') {
            if (appointment.user && appointment.user.email) {
                const doctorRecord = await client_1.default.doctor.findUnique({ where: { id: appointment.doctorId } });
                await (0, emailService_1.sendPrescriptionEmail)(appointment.user.email, {
                    patientName: appointment.patientInfo?.fullName || appointment.user.fullName || appointment.user.email,
                    doctorName: doctorRecord?.name || "Bác sĩ",
                    appointmentDate: appointment.appointmentDate
                }, req.body.pdfBase64 // Optional PDF from frontend
                );
            }
        }
        res.status(200).json({ success: true, message: 'Medical record saved successfully' });
    }
    catch (error) {
        console.error('Error saving medical record:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};
exports.saveRecord = saveRecord;
