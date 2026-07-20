"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveRecord = exports.getRecordByAppointment = void 0;
const emailService_1 = require("../utils/emailService");
const client_1 = __importDefault(require("../prisma/client"));
const getRecordByAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;
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
        const record = await client_1.default.medicalRecord.findUnique({
            where: { appointmentId: appointmentId },
            include: {
                labOrders: true,
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
        const { height, weight, bloodPressure, heartRate, temperature, spo2, symptoms, physicalExam, preliminaryDiagnosis, finalDiagnosis, icd10Code, treatmentPlan, doctorNotes, followUpDate, severity, status, labOrders, prescriptions } = req.body;
        const appointment = await client_1.default.appointment.findUnique({
            where: { id: appointmentId },
            include: { user: true }
        });
        if (!appointment) {
            res.status(404).json({ success: false, message: 'Appointment not found' });
            return;
        }
        // Upsert record
        const record = await client_1.default.medicalRecord.upsert({
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
            await client_1.default.labOrder.deleteMany({
                where: { medicalRecordId: record.id }
            });
            if (labOrders.length > 0) {
                await client_1.default.labOrder.createMany({
                    data: labOrders.map((lo) => ({
                        medicalRecordId: record.id,
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
            await client_1.default.prescription.deleteMany({
                where: { medicalRecordId: record.id }
            });
            if (prescriptions.length > 0) {
                await client_1.default.prescription.createMany({
                    data: prescriptions.map((p) => ({
                        medicalRecordId: record.id,
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
            await client_1.default.appointment.update({
                where: { id: appointmentId },
                data: { status: 'COMPLETED' }
            });
            // Send email
            if (appointment.user && appointment.user.email) {
                const doctor = await client_1.default.doctor.findUnique({ where: { id: appointment.doctorId } });
                await (0, emailService_1.sendPrescriptionEmail)(appointment.user.email, {
                    patientName: appointment.patientInfo?.fullName || appointment.user.fullName || appointment.user.email,
                    doctorName: doctor?.name || "Bác sĩ",
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
