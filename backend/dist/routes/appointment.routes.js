"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const multer_1 = __importDefault(require("multer"));
const appointment_controller_1 = require("../controllers/appointment.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const authorization_middleware_1 = require("../middleware/authorization.middleware");
const booking_middleware_1 = require("../middleware/booking.middleware");
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
const router = (0, express_1.Router)();
/**
 * POST /api/appointments
 * Books a new appointment. Requires USER role.
 * validateBookingSlot validates doctor availability and prevents double-booking.
 */
router.post("/appointments", auth_middleware_1.verifyToken, (0, authorization_middleware_1.authorizeRoles)(client_1.Role.USER, client_1.Role.DOCTOR), booking_middleware_1.validateBookingSlot, appointment_controller_1.createAppointmentHandler);
/**
 * GET /api/my-appointments
 * Returns authenticated user's appointments. Requires USER or DOCTOR role.
 */
router.get("/my-appointments", auth_middleware_1.verifyToken, (0, authorization_middleware_1.authorizeRoles)(client_1.Role.USER, client_1.Role.DOCTOR), appointment_controller_1.getMyAppointments);
/**
 * GET /api/appointments/:id
 * Returns appointment details by ID. Requires USER or DOCTOR role.
 */
router.get("/appointments/:id", auth_middleware_1.verifyToken, (0, authorization_middleware_1.authorizeRoles)(client_1.Role.USER, client_1.Role.DOCTOR), appointment_controller_1.getAppointmentByIdHandler);
/**
 * GET /api/appointments/:id/prescription/public
 * Public route to verify prescriptions via QR code (no authentication required)
 */
router.get("/appointments/:id/prescription/public", appointment_controller_1.getPublicPrescriptionHandler);
/**
 * POST /api/appointments/:id/pay-proof
 * Upload payment proof image (requires USER role)
 */
router.post("/appointments/:id/pay-proof", auth_middleware_1.verifyToken, (0, authorization_middleware_1.authorizeRoles)(client_1.Role.USER), upload.single("paymentProof"), appointment_controller_1.uploadPaymentProofHandler);
/**
 * POST /api/appointments/:id/cancel
 * Cancel an appointment (requires USER role, must be > 24h)
 */
router.post("/appointments/:id/cancel", auth_middleware_1.verifyToken, (0, authorization_middleware_1.authorizeRoles)(client_1.Role.USER), appointment_controller_1.cancelAppointmentHandler);
exports.default = router;
