"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const admin_doctors_controller_1 = require("../controllers/admin-doctors.controller");
const admin_specialties_controller_1 = require("../controllers/admin-specialties.controller");
const admin_clinics_controller_1 = require("../controllers/admin-clinics.controller");
const admin_articles_controller_1 = require("../controllers/admin-articles.controller");
const admin_complaints_controller_1 = require("../controllers/admin-complaints.controller");
const admin_statistics_controller_1 = require("../controllers/admin-statistics.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const authorization_middleware_1 = require("../middleware/authorization.middleware");
const router = (0, express_1.Router)();
// ─── All routes require ADMIN role ───────────────────────────────────────────
// ─── Users ───────────────────────────────────────────────────────────────────
/**
 * GET /api/admin/users
 * Returns all users (without passwords).
 */
router.get("/admin/users", auth_middleware_1.verifyToken, authorization_middleware_1.verifyAdmin, admin_controller_1.getUsers);
/**
 * PUT /api/admin/users/:id
 * Updates a user's role.
 */
router.put("/admin/users/:id", auth_middleware_1.verifyToken, authorization_middleware_1.verifyAdmin, admin_controller_1.updateUser);
/**
 * DELETE /api/admin/users/:id
 * Deletes a user and their appointments. Cannot delete admins.
 */
router.delete("/admin/users/:id", auth_middleware_1.verifyToken, authorization_middleware_1.verifyAdmin, admin_controller_1.removeUser);
/**
 * POST /api/admin/users/:userId/link-doctor/:doctorId
 * Links a User account (with DOCTOR role) to a Doctor record.
 */
router.post("/admin/users/:userId/link-doctor/:doctorId", auth_middleware_1.verifyToken, authorization_middleware_1.verifyAdmin, admin_controller_1.linkDoctorToUser);
// ─── Appointments ────────────────────────────────────────────────────────────
/**
 * GET /api/admin/appointments
 * Returns all appointments with user and doctor details.
 */
router.get("/admin/appointments", auth_middleware_1.verifyToken, authorization_middleware_1.verifyAdmin, admin_controller_1.getAppointments);
/**
 * PUT /api/admin/appointments/:id/status
 * Updates an appointment's status.
 */
router.put("/admin/appointments/:id/status", auth_middleware_1.verifyToken, authorization_middleware_1.verifyAdmin, admin_controller_1.updateAppointmentStatusHandler);
/**
 * PATCH /api/admin/appointments/:id/status
 * Updates an appointment's status (PATCH standard).
 */
router.patch("/admin/appointments/:id/status", auth_middleware_1.verifyToken, authorization_middleware_1.verifyAdmin, admin_controller_1.updateAppointmentStatusHandler);
// ─── Doctor Moderation ───────────────────────────────────────────────────────
/**
 * GET /api/admin/doctors
 * Returns all doctors with specialty, clinic, and userAccount relations.
 */
router.get("/admin/doctors", auth_middleware_1.verifyToken, authorization_middleware_1.verifyAdmin, admin_doctors_controller_1.getDoctors);
/**
 * GET /api/admin/doctors/pending
 * Returns pending doctors.
 */
router.get("/admin/doctors/pending", auth_middleware_1.verifyToken, authorization_middleware_1.verifyAdmin, admin_doctors_controller_1.getPendingDoctorsHandler);
/**
 * PUT /api/admin/doctors/:id/moderation
 * Moderates a doctor: approve, reject, lock, or unlock (Legacy).
 */
router.put("/admin/doctors/:id/moderation", auth_middleware_1.verifyToken, authorization_middleware_1.verifyAdmin, admin_doctors_controller_1.moderateDoctorHandler);
/**
 * PATCH /api/admin/doctors/:id/approve
 * Approves a doctor.
 */
router.patch("/admin/doctors/:id/approve", auth_middleware_1.verifyToken, authorization_middleware_1.verifyAdmin, admin_doctors_controller_1.approveDoctorHandler);
/**
 * PATCH /api/admin/doctors/:id/reject
 * Rejects a doctor.
 */
router.patch("/admin/doctors/:id/reject", auth_middleware_1.verifyToken, authorization_middleware_1.verifyAdmin, admin_doctors_controller_1.rejectDoctorHandler);
/**
 * PATCH /api/admin/doctors/:id/lock
 * Locks/unlocks a doctor.
 */
router.patch("/admin/doctors/:id/lock", auth_middleware_1.verifyToken, authorization_middleware_1.verifyAdmin, admin_doctors_controller_1.lockDoctorHandler);
// ─── Specialties CRUD ────────────────────────────────────────────────────────
/**
 * GET /api/admin/specialties
 * Returns all specialties with doctor count.
 */
router.get("/admin/specialties", auth_middleware_1.verifyToken, authorization_middleware_1.verifyAdmin, admin_specialties_controller_1.getSpecialties);
/**
 * POST /api/admin/specialties
 * Creates a new specialty.
 */
router.post("/admin/specialties", auth_middleware_1.verifyToken, authorization_middleware_1.verifyAdmin, admin_specialties_controller_1.createSpecialtyHandler);
/**
 * PUT /api/admin/specialties/:id
 * Updates an existing specialty.
 */
router.put("/admin/specialties/:id", auth_middleware_1.verifyToken, authorization_middleware_1.verifyAdmin, admin_specialties_controller_1.updateSpecialtyHandler);
/**
 * DELETE /api/admin/specialties/:id
 * Deletes a specialty (fails if doctors are linked).
 */
router.delete("/admin/specialties/:id", auth_middleware_1.verifyToken, authorization_middleware_1.verifyAdmin, admin_specialties_controller_1.deleteSpecialtyHandler);
// ─── Clinics CRUD ────────────────────────────────────────────────────────────
/**
 * GET /api/admin/clinics
 * Returns all clinics with doctor count.
 */
router.get("/admin/clinics", auth_middleware_1.verifyToken, authorization_middleware_1.verifyAdmin, admin_clinics_controller_1.getClinics);
/**
 * POST /api/admin/clinics
 * Creates a new clinic.
 */
router.post("/admin/clinics", auth_middleware_1.verifyToken, authorization_middleware_1.verifyAdmin, admin_clinics_controller_1.createClinicHandler);
/**
 * PUT /api/admin/clinics/:id
 * Updates an existing clinic.
 */
router.put("/admin/clinics/:id", auth_middleware_1.verifyToken, authorization_middleware_1.verifyAdmin, admin_clinics_controller_1.updateClinicHandler);
/**
 * DELETE /api/admin/clinics/:id
 * Deletes a clinic (fails if doctors are linked).
 */
router.delete("/admin/clinics/:id", auth_middleware_1.verifyToken, authorization_middleware_1.verifyAdmin, admin_clinics_controller_1.deleteClinicHandler);
// ─── Articles CRUD ───────────────────────────────────────────────────────────
/**
 * GET /api/admin/articles
 * Returns all articles ordered by createdAt desc.
 */
router.get("/admin/articles", auth_middleware_1.verifyToken, authorization_middleware_1.verifyAdmin, admin_articles_controller_1.getArticles);
/**
 * POST /api/admin/articles
 * Creates a new article.
 */
router.post("/admin/articles", auth_middleware_1.verifyToken, authorization_middleware_1.verifyAdmin, admin_articles_controller_1.createArticleHandler);
/**
 * PUT /api/admin/articles/:id
 * Updates an existing article.
 */
router.put("/admin/articles/:id", auth_middleware_1.verifyToken, authorization_middleware_1.verifyAdmin, admin_articles_controller_1.updateArticleHandler);
/**
 * DELETE /api/admin/articles/:id
 * Deletes an article.
 */
router.delete("/admin/articles/:id", auth_middleware_1.verifyToken, authorization_middleware_1.verifyAdmin, admin_articles_controller_1.deleteArticleHandler);
// ─── Complaints ──────────────────────────────────────────────────────────────
/**
 * GET /api/admin/complaints
 * Returns all complaints with user relation.
 */
router.get("/admin/complaints", auth_middleware_1.verifyToken, authorization_middleware_1.verifyAdmin, admin_complaints_controller_1.getComplaints);
/**
 * PUT /api/admin/complaints/:id/resolve
 * Marks a complaint as resolved.
 */
router.put("/admin/complaints/:id/resolve", auth_middleware_1.verifyToken, authorization_middleware_1.verifyAdmin, admin_complaints_controller_1.resolveComplaintHandler);
// ─── Statistics ──────────────────────────────────────────────────────────────
/**
 * GET /api/admin/statistics
 * Returns comprehensive admin dashboard statistics.
 */
router.get("/admin/statistics", auth_middleware_1.verifyToken, authorization_middleware_1.verifyAdmin, admin_statistics_controller_1.getStatisticsHandler);
exports.default = router;
