"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBookingSlot = validateBookingSlot;
const client_1 = __importDefault(require("../prisma/client"));
const apiError_1 = require("../utils/apiError");
// ─── Helpers ─────────────────────────────────────────────────────────────────
function timeToMinutes(t) {
    const parts = t.split(":");
    const hh = parts[0] ?? "0";
    const mm = parts[1] ?? "0";
    return parseInt(hh, 10) * 60 + parseInt(mm, 10);
}
// ─── Middleware ───────────────────────────────────────────────────────────────
/**
 * Middleware: Validates that a booking slot is:
 * 1. On a day the doctor has an available schedule
 * 2. Within the doctor's schedule time range
 * 3. Not already booked by another patient
 *
 * Must be used after verifyToken.
 */
async function validateBookingSlot(req, _res, next) {
    try {
        const r = req;
        const userId = r.user?.userId;
        if (!userId) {
            throw new apiError_1.ApiError("Authentication required", 401);
        }
        const { doctorId, appointmentDate } = req.body;
        if (!doctorId || !appointmentDate) {
            throw new apiError_1.ApiError("doctorId and appointmentDate are required", 400);
        }
        const date = new Date(appointmentDate);
        if (Number.isNaN(date.getTime())) {
            throw new apiError_1.ApiError("Invalid appointment date", 400);
        }
        const doctor = await client_1.default.doctor.findUnique({ where: { id: doctorId } });
        if (!doctor) {
            throw new apiError_1.ApiError("Doctor not found", 404);
        }
        const dayOfWeek = date.getDay(); // 0 = Sunday ... 6 = Saturday
        const schedules = await client_1.default.doctorSchedule.findMany({
            where: { doctorId, dayOfWeek, isAvailable: true },
        });
        if (schedules.length === 0) {
            throw new apiError_1.ApiError("No available schedule for this doctor on the selected day", 400);
        }
        const appointmentMinutes = date.getHours() * 60 + date.getMinutes();
        const matched = schedules.find((s) => {
            const start = timeToMinutes(s.startTime);
            const end = timeToMinutes(s.endTime);
            return appointmentMinutes >= start && appointmentMinutes < end;
        });
        if (!matched) {
            throw new apiError_1.ApiError("Selected time is outside the doctor's available slots", 400);
        }
        // Check for duplicate appointment at same doctor + exact time
        const conflict = await client_1.default.appointment.findFirst({
            where: { doctorId, appointmentDate: date },
        });
        if (conflict) {
            throw new apiError_1.ApiError("This slot is already booked. Please choose another time.", 409);
        }
        // Attach matched schedule ID for downstream use if needed
        r.matchedScheduleId = matched.id;
        next();
    }
    catch (error) {
        next(error);
    }
}
