"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAppointmentHandler = createAppointmentHandler;
exports.getMyAppointments = getMyAppointments;
const appointment_service_1 = require("../services/appointment.service");
const apiError_1 = require("../utils/apiError");
/**
 * POST /api/appointments
 * Protected (USER role): Books a new appointment.
 */
async function createAppointmentHandler(req, res, next) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new apiError_1.ApiError("Authentication required", 401);
        }
        const { doctorId, appointmentDate, notes } = req.body;
        if (!doctorId || !appointmentDate) {
            throw new apiError_1.ApiError("Doctor ID and appointment date are required", 400);
        }
        const date = new Date(appointmentDate);
        if (Number.isNaN(date.getTime())) {
            throw new apiError_1.ApiError("Invalid appointment date format", 400);
        }
        if (date < new Date()) {
            throw new apiError_1.ApiError("Appointment date must be in the future", 400);
        }
        const appointment = await (0, appointment_service_1.createAppointment)({
            userId,
            doctorId,
            appointmentDate: date,
            notes,
        });
        res.status(201).json({
            message: "Appointment created successfully",
            appointment,
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/my-appointments
 * Protected (USER role): Returns the authenticated user's appointments.
 */
async function getMyAppointments(req, res, next) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new apiError_1.ApiError("Authentication required", 401);
        }
        const appointments = await (0, appointment_service_1.getAppointmentsByUser)(userId);
        res.json({
            message: "Appointments fetched successfully",
            count: appointments.length,
            appointments,
        });
    }
    catch (error) {
        next(error);
    }
}
