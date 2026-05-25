import { Router } from "express";
import { Role } from "@prisma/client";

import { createAppointmentHandler, getMyAppointments } from "../controllers/appointment.controller";
import { verifyToken } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/authorization.middleware";
import { validateBookingSlot } from "../middleware/booking.middleware";

const router = Router();

/**
 * POST /api/appointments
 * Books a new appointment. Requires USER role.
 * validateBookingSlot validates doctor availability and prevents double-booking.
 */
router.post(
    "/appointments",
    verifyToken,
    authorizeRoles(Role.USER),
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

export default router;
