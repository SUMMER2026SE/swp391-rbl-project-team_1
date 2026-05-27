import { Router } from "express";
import { Role } from "@prisma/client";

import { getUsers, getAppointments, updateUser, removeUser, linkDoctorToUser, updateAppointmentStatusHandler } from "../controllers/admin.controller";
import { getDoctors, moderateDoctorHandler, getPendingDoctorsHandler, approveDoctorHandler, rejectDoctorHandler, lockDoctorHandler } from "../controllers/admin-doctors.controller";
import { getSpecialties, createSpecialtyHandler, updateSpecialtyHandler, deleteSpecialtyHandler } from "../controllers/admin-specialties.controller";
import { getClinics, createClinicHandler, updateClinicHandler, deleteClinicHandler } from "../controllers/admin-clinics.controller";
import { getArticles, createArticleHandler, updateArticleHandler, deleteArticleHandler } from "../controllers/admin-articles.controller";
import { getComplaints, resolveComplaintHandler } from "../controllers/admin-complaints.controller";
import { getStatisticsHandler } from "../controllers/admin-statistics.controller";
import { verifyToken } from "../middleware/auth.middleware";
import { verifyAdmin } from "../middleware/authorization.middleware";

const router = Router();

// ─── All routes require ADMIN role ───────────────────────────────────────────

// ─── Users ───────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/users
 * Returns all users (without passwords).
 */
router.get(
    "/admin/users",
    verifyToken,
    verifyAdmin,
    getUsers
);

/**
 * PUT /api/admin/users/:id
 * Updates a user's role.
 */
router.put(
    "/admin/users/:id",
    verifyToken,
    verifyAdmin,
    updateUser
);

/**
 * DELETE /api/admin/users/:id
 * Deletes a user and their appointments. Cannot delete admins.
 */
router.delete(
    "/admin/users/:id",
    verifyToken,
    verifyAdmin,
    removeUser
);

/**
 * POST /api/admin/users/:userId/link-doctor/:doctorId
 * Links a User account (with DOCTOR role) to a Doctor record.
 */
router.post(
    "/admin/users/:userId/link-doctor/:doctorId",
    verifyToken,
    verifyAdmin,
    linkDoctorToUser
);

// ─── Appointments ────────────────────────────────────────────────────────────

/**
 * GET /api/admin/appointments
 * Returns all appointments with user and doctor details.
 */
router.get(
    "/admin/appointments",
    verifyToken,
    verifyAdmin,
    getAppointments
);

/**
 * PUT /api/admin/appointments/:id/status
 * Updates an appointment's status.
 */
router.put(
    "/admin/appointments/:id/status",
    verifyToken,
    verifyAdmin,
    updateAppointmentStatusHandler
);

/**
 * PATCH /api/admin/appointments/:id/status
 * Updates an appointment's status (PATCH standard).
 */
router.patch(
    "/admin/appointments/:id/status",
    verifyToken,
    verifyAdmin,
    updateAppointmentStatusHandler
);

// ─── Doctor Moderation ───────────────────────────────────────────────────────

/**
 * GET /api/admin/doctors
 * Returns all doctors with specialty, clinic, and userAccount relations.
 */
router.get(
    "/admin/doctors",
    verifyToken,
    verifyAdmin,
    getDoctors
);

/**
 * GET /api/admin/doctors/pending
 * Returns pending doctors.
 */
router.get(
    "/admin/doctors/pending",
    verifyToken,
    verifyAdmin,
    getPendingDoctorsHandler
);

/**
 * PUT /api/admin/doctors/:id/moderation
 * Moderates a doctor: approve, reject, lock, or unlock (Legacy).
 */
router.put(
    "/admin/doctors/:id/moderation",
    verifyToken,
    verifyAdmin,
    moderateDoctorHandler
);

/**
 * PATCH /api/admin/doctors/:id/approve
 * Approves a doctor.
 */
router.patch(
    "/admin/doctors/:id/approve",
    verifyToken,
    verifyAdmin,
    approveDoctorHandler
);

/**
 * PATCH /api/admin/doctors/:id/reject
 * Rejects a doctor.
 */
router.patch(
    "/admin/doctors/:id/reject",
    verifyToken,
    verifyAdmin,
    rejectDoctorHandler
);

/**
 * PATCH /api/admin/doctors/:id/lock
 * Locks/unlocks a doctor.
 */
router.patch(
    "/admin/doctors/:id/lock",
    verifyToken,
    verifyAdmin,
    lockDoctorHandler
);

// ─── Specialties CRUD ────────────────────────────────────────────────────────

/**
 * GET /api/admin/specialties
 * Returns all specialties with doctor count.
 */
router.get(
    "/admin/specialties",
    verifyToken,
    verifyAdmin,
    getSpecialties
);

/**
 * POST /api/admin/specialties
 * Creates a new specialty.
 */
router.post(
    "/admin/specialties",
    verifyToken,
    verifyAdmin,
    createSpecialtyHandler
);

/**
 * PUT /api/admin/specialties/:id
 * Updates an existing specialty.
 */
router.put(
    "/admin/specialties/:id",
    verifyToken,
    verifyAdmin,
    updateSpecialtyHandler
);

/**
 * DELETE /api/admin/specialties/:id
 * Deletes a specialty (fails if doctors are linked).
 */
router.delete(
    "/admin/specialties/:id",
    verifyToken,
    verifyAdmin,
    deleteSpecialtyHandler
);

// ─── Clinics CRUD ────────────────────────────────────────────────────────────

/**
 * GET /api/admin/clinics
 * Returns all clinics with doctor count.
 */
router.get(
    "/admin/clinics",
    verifyToken,
    verifyAdmin,
    getClinics
);

/**
 * POST /api/admin/clinics
 * Creates a new clinic.
 */
router.post(
    "/admin/clinics",
    verifyToken,
    verifyAdmin,
    createClinicHandler
);

/**
 * PUT /api/admin/clinics/:id
 * Updates an existing clinic.
 */
router.put(
    "/admin/clinics/:id",
    verifyToken,
    verifyAdmin,
    updateClinicHandler
);

/**
 * DELETE /api/admin/clinics/:id
 * Deletes a clinic (fails if doctors are linked).
 */
router.delete(
    "/admin/clinics/:id",
    verifyToken,
    verifyAdmin,
    deleteClinicHandler
);

// ─── Articles CRUD ───────────────────────────────────────────────────────────

/**
 * GET /api/admin/articles
 * Returns all articles ordered by createdAt desc.
 */
router.get(
    "/admin/articles",
    verifyToken,
    verifyAdmin,
    getArticles
);

/**
 * POST /api/admin/articles
 * Creates a new article.
 */
router.post(
    "/admin/articles",
    verifyToken,
    verifyAdmin,
    createArticleHandler
);

/**
 * PUT /api/admin/articles/:id
 * Updates an existing article.
 */
router.put(
    "/admin/articles/:id",
    verifyToken,
    verifyAdmin,
    updateArticleHandler
);

/**
 * DELETE /api/admin/articles/:id
 * Deletes an article.
 */
router.delete(
    "/admin/articles/:id",
    verifyToken,
    verifyAdmin,
    deleteArticleHandler
);

// ─── Complaints ──────────────────────────────────────────────────────────────

/**
 * GET /api/admin/complaints
 * Returns all complaints with user relation.
 */
router.get(
    "/admin/complaints",
    verifyToken,
    verifyAdmin,
    getComplaints
);

/**
 * PUT /api/admin/complaints/:id/resolve
 * Marks a complaint as resolved.
 */
router.put(
    "/admin/complaints/:id/resolve",
    verifyToken,
    verifyAdmin,
    resolveComplaintHandler
);

// ─── Statistics ──────────────────────────────────────────────────────────────

/**
 * GET /api/admin/statistics
 * Returns comprehensive admin dashboard statistics.
 */
router.get(
    "/admin/statistics",
    verifyToken,
    verifyAdmin,
    getStatisticsHandler
);

export default router;
