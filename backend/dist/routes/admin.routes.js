"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const authorization_middleware_1 = require("../middleware/authorization.middleware");
const router = (0, express_1.Router)();
// ─── All routes require ADMIN role ───────────────────────────────────────────
/**
 * GET /api/admin/users
 * Returns all users (without passwords).
 */
router.get("/admin/users", auth_middleware_1.verifyToken, (0, authorization_middleware_1.authorizeRoles)(client_1.Role.ADMIN), admin_controller_1.getUsers);
/**
 * GET /api/admin/appointments
 * Returns all appointments with user and doctor details.
 */
router.get("/admin/appointments", auth_middleware_1.verifyToken, (0, authorization_middleware_1.authorizeRoles)(client_1.Role.ADMIN), admin_controller_1.getAppointments);
/**
 * PUT /api/admin/users/:id
 * Updates a user's role.
 */
router.put("/admin/users/:id", auth_middleware_1.verifyToken, (0, authorization_middleware_1.authorizeRoles)(client_1.Role.ADMIN), admin_controller_1.updateUser);
/**
 * DELETE /api/admin/users/:id
 * Deletes a user and their appointments. Cannot delete admins.
 */
router.delete("/admin/users/:id", auth_middleware_1.verifyToken, (0, authorization_middleware_1.authorizeRoles)(client_1.Role.ADMIN), admin_controller_1.removeUser);
/**
 * POST /api/admin/users/:userId/link-doctor/:doctorId
 * Links a User account (with DOCTOR role) to a Doctor record.
 * This allows the DOCTOR to use GET /api/doctor/appointments.
 */
router.post("/admin/users/:userId/link-doctor/:doctorId", auth_middleware_1.verifyToken, (0, authorization_middleware_1.authorizeRoles)(client_1.Role.ADMIN), admin_controller_1.linkDoctorToUser);
exports.default = router;
