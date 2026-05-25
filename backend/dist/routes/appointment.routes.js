"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const appointment_controller_1 = require("../controllers/appointment.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const authorization_middleware_1 = require("../middleware/authorization.middleware");
const booking_middleware_1 = require("../middleware/booking.middleware");
const router = (0, express_1.Router)();
/**
 * POST /api/appointments
 * Books a new appointment. Requires USER role.
 * validateBookingSlot validates doctor availability and prevents double-booking.
 */
router.post("/appointments", auth_middleware_1.verifyToken, (0, authorization_middleware_1.authorizeRoles)(client_1.Role.USER), booking_middleware_1.validateBookingSlot, appointment_controller_1.createAppointmentHandler);
/**
 * GET /api/my-appointments
 * Returns authenticated user's appointments. Requires USER role.
 */
router.get("/my-appointments", auth_middleware_1.verifyToken, (0, authorization_middleware_1.authorizeRoles)(client_1.Role.USER), appointment_controller_1.getMyAppointments);
exports.default = router;
