"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const authorization_middleware_1 = require("../middleware/authorization.middleware");
const doctor_dashboard_controller_1 = require("../controllers/doctor-dashboard.controller");
const doctor_certificate_controller_1 = require("../controllers/doctor-certificate.controller");
const multer_1 = __importDefault(require("multer"));
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
const router = (0, express_1.Router)();
// All routes here are protected and require DOCTOR role
router.use(auth_middleware_1.verifyToken, authorization_middleware_1.verifyDoctor);
// Dashboard
router.get("/dashboard/stats", doctor_dashboard_controller_1.getDashboardStats);
router.get("/dashboard/charts", doctor_dashboard_controller_1.getDashboardCharts);
router.get("/statistics", doctor_dashboard_controller_1.getDoctorStatistics);
router.get("/reviews", doctor_dashboard_controller_1.getDoctorReviews);
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
router.put("/appointments/bulk-status", doctor_dashboard_controller_1.updateBulkAppointmentStatus);
router.put("/appointments/:id/status", doctor_dashboard_controller_1.updateAppointmentStatus);
// Patients & Medical Records
router.get("/patients", doctor_dashboard_controller_1.getDoctorPatients);
router.get("/patients/:userId", doctor_dashboard_controller_1.getPatientDetail);
router.get("/patients/:userId/records", doctor_dashboard_controller_1.getPatientMedicalRecords);
router.post("/medical-records", doctor_dashboard_controller_1.createMedicalRecord);
router.post("/prescriptions", doctor_dashboard_controller_1.createPrescription);
// Certificates
router.get("/certificates", doctor_certificate_controller_1.doctorCertificateController.getCertificates);
router.post("/certificates", upload.single("file"), doctor_certificate_controller_1.doctorCertificateController.createCertificate);
router.put("/certificates/:id", upload.single("file"), doctor_certificate_controller_1.doctorCertificateController.updateCertificate);
router.delete("/certificates/:id", doctor_certificate_controller_1.doctorCertificateController.deleteCertificate);
exports.default = router;
