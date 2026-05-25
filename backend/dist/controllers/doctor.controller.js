"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listDoctors = listDoctors;
exports.getDoctor = getDoctor;
exports.getDoctorAppointmentsController = getDoctorAppointmentsController;
const doctor_service_1 = require("../services/doctor.service");
const appointment_service_1 = require("../services/appointment.service");
const apiError_1 = require("../utils/apiError");
/**
 * GET /api/doctors
 * Public: List all doctors.
 */
async function listDoctors(_req, res, next) {
    try {
        const doctors = await (0, doctor_service_1.getAllDoctors)();
        res.json({
            message: "Doctors fetched successfully",
            count: doctors.length,
            doctors,
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/doctors/:id
 * Public: Get a single doctor by ID.
 */
async function getDoctor(req, res, next) {
    try {
        const id = req.params.id;
        if (!id) {
            throw new apiError_1.ApiError("Doctor ID is required", 400);
        }
        const doctor = await (0, doctor_service_1.getDoctorById)(id);
        res.json({ message: "Doctor details fetched successfully", doctor });
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/doctor/appointments
 * Protected (DOCTOR role): Get all appointments for the authenticated doctor.
 *
 * Flow: JWT userId → User.doctorId → Doctor.id → appointments
 */
async function getDoctorAppointmentsController(req, res, next) {
    try {
        if (!req.user?.userId) {
            throw new apiError_1.ApiError("User not authenticated", 401);
        }
        // Resolve Doctor record from User account via User.doctorId link
        const doctor = await (0, doctor_service_1.getDoctorByUserId)(req.user.userId);
        const appointments = await (0, appointment_service_1.getDoctorAppointments)(doctor.id);
        res.json({
            message: "Doctor appointments retrieved successfully",
            doctor: {
                id: doctor.id,
                name: doctor.name,
                specialty: doctor.specialty,
            },
            count: appointments.length,
            data: appointments,
        });
    }
    catch (error) {
        next(error);
    }
}
