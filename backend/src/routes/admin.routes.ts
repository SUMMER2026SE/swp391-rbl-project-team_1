import { Router } from "express";
import { Role } from "@prisma/client";

import { getUsers, getAppointments, updateUser, removeUser, linkDoctorToUser } from "../controllers/admin.controller";
import { verifyToken } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/authorization.middleware";

const router = Router();

// ─── All routes require ADMIN role ───────────────────────────────────────────

/**
 * GET /api/admin/users
 * Returns all users (without passwords).
 */
router.get(
    "/admin/users",
    verifyToken,
    authorizeRoles(Role.ADMIN),
    getUsers
);

/**
 * GET /api/admin/appointments
 * Returns all appointments with user and doctor details.
 */
router.get(
    "/admin/appointments",
    verifyToken,
    authorizeRoles(Role.ADMIN),
    getAppointments
);

/**
 * PUT /api/admin/users/:id
 * Updates a user's role.
 */
router.put(
    "/admin/users/:id",
    verifyToken,
    authorizeRoles(Role.ADMIN),
    updateUser
);

/**
 * DELETE /api/admin/users/:id
 * Deletes a user and their appointments. Cannot delete admins.
 */
router.delete(
    "/admin/users/:id",
    verifyToken,
    authorizeRoles(Role.ADMIN),
    removeUser
);

/**
 * POST /api/admin/users/:userId/link-doctor/:doctorId
 * Links a User account (with DOCTOR role) to a Doctor record.
 * This allows the DOCTOR to use GET /api/doctor/appointments.
 */
router.post(
    "/admin/users/:userId/link-doctor/:doctorId",
    verifyToken,
    authorizeRoles(Role.ADMIN),
    linkDoctorToUser
);

export default router;
