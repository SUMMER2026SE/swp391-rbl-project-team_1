"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const authorization_middleware_1 = require("../middleware/authorization.middleware");
const doctor_middleware_1 = require("../middleware/doctor.middleware");
const doctor_dashboard_controller_1 = require("../controllers/doctor-dashboard.controller");
const router = (0, express_1.Router)();
// All routes here require DOCTOR role + approved + not locked
router.use(auth_middleware_1.verifyToken, authorization_middleware_1.verifyDoctor, doctor_middleware_1.verifyApprovedDoctor);
// Dashboard
router.get("/dashboard/stats", doctor_dashboard_controller_1.getDashboardStats);
// Profile & Metadata
router.get("/profile", doctor_dashboard_controller_1.getDoctorProfile);
router.put("/profile", doctor_dashboard_controller_1.updateDoctorProfile);
router.get("/metadata/options", doctor_dashboard_controller_1.getAvailableSpecialtiesAndClinics);
// Schedules
router.get("/schedules", doctor_dashboard_controller_1.getDoctorSchedules);
router.post("/schedules", doctor_dashboard_controller_1.createDoctorSchedule);
router.put("/schedules/:id", doctor_dashboard_controller_1.updateDoctorSchedule);
router.delete("/schedules/:id", doctor_dashboard_controller_1.deleteDoctorSchedule);
// Appointments
router.get("/appointments", doctor_dashboard_controller_1.getDoctorAppointments);
router.put("/appointments/:id/status", doctor_dashboard_controller_1.updateAppointmentStatus);
// Patients & Medical Records
router.get("/patients", doctor_dashboard_controller_1.getDoctorPatients);
router.get("/patients/:userId/records", doctor_dashboard_controller_1.getPatientMedicalRecords);
router.post("/medical-records", doctor_dashboard_controller_1.createMedicalRecord);
router.post("/prescriptions", doctor_dashboard_controller_1.createPrescription);
router.post("/emr/transcribe-assist", doctor_dashboard_controller_1.getEmrTranscriptionAssistHandler);
exports.default = router;
