import { Router } from "express";
import { Role } from "@prisma/client";

import { createAppointmentHandler, getMyAppointments, getQueueStatusHandler, getAppointmentDetailHandler } from "../controllers/appointment.controller";
import { verifyToken } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/authorization.middleware";
import { validateBookingSlot } from "../middleware/booking.middleware";
import { validateDoctorAvailable } from "../middleware/doctor.middleware";

const router = Router();

/**
 * GET /api/appointments/:id
 * Fetch appointment detail. Requires authentication.
 */
router.get(
    "/appointments/:id",
    verifyToken,
    getAppointmentDetailHandler
);

/**
 * POST /api/appointments
 * Books a new appointment. Requires USER role.
 * validateBookingSlot validates doctor availability and prevents double-booking.
 */
router.post(
    "/appointments",
    verifyToken,
    authorizeRoles(Role.USER),
    validateDoctorAvailable,
    validateBookingSlot,
    createAppointmentHandler
);

/**
 * GET /api/my-appointments
 * Returns authenticated user's appointments. Requires USER role.
 */
router.get(
    "/my-appointments",
    verifyToken,
    authorizeRoles(Role.USER),
    getMyAppointments
);

/**
 * GET /api/appointments/:id/queue-status
 * Returns estimated wait time and queue details.
 */
router.get(
    "/appointments/:id/queue-status",
    verifyToken,
    getQueueStatusHandler
);

export default router;
