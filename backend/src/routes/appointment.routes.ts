import { Router } from "express";
import { Role } from "@prisma/client";
import multer from "multer";

import {
    createAppointmentHandler,
    getMyAppointments,
    getAppointmentByIdHandler,
    getPublicPrescriptionHandler,
    uploadPaymentProofHandler,
    cancelAppointmentHandler
} from "../controllers/appointment.controller";
import { verifyToken } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/authorization.middleware";
import { validateBookingSlot } from "../middleware/booking.middleware";

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

/**
 * POST /api/appointments
 * Books a new appointment. Requires USER role.
 * validateBookingSlot validates doctor availability and prevents double-booking.
 */
router.post(
    "/appointments",
    verifyToken,
    authorizeRoles(Role.USER, Role.DOCTOR),
    validateBookingSlot,
    createAppointmentHandler
);

/**
 * GET /api/my-appointments
 * Returns authenticated user's appointments. Requires USER or DOCTOR role.
 */
router.get(
    "/my-appointments",
    verifyToken,
    authorizeRoles(Role.USER, Role.DOCTOR),
    getMyAppointments
);

/**
 * GET /api/appointments/:id
 * Returns appointment details by ID. Requires USER or DOCTOR role.
 */
router.get(
    "/appointments/:id",
    verifyToken,
    authorizeRoles(Role.USER, Role.DOCTOR),
    getAppointmentByIdHandler
);

/**
 * GET /api/appointments/:id/prescription/public
 * Public route to verify prescriptions via QR code (no authentication required)
 */
router.get(
    "/appointments/:id/prescription/public",
    getPublicPrescriptionHandler
);

/**
 * POST /api/appointments/:id/pay-proof
 * Upload payment proof image (requires USER role)
 */
router.post(
    "/appointments/:id/pay-proof",
    verifyToken,
    authorizeRoles(Role.USER),
    upload.single("paymentProof"),
    uploadPaymentProofHandler
);

/**
 * POST /api/appointments/:id/cancel
 * Cancel an appointment (requires USER role, must be > 24h)
 */
router.post(
    "/appointments/:id/cancel",
    verifyToken,
    authorizeRoles(Role.USER),
    cancelAppointmentHandler
);

export default router;
