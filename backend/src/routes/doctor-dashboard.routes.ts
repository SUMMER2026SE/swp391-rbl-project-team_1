import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware";
import { verifyDoctor } from "../middleware/authorization.middleware";
import {
    getDashboardStats,
    getDashboardCharts,
    getDoctorProfile,
    updateDoctorProfile,
    getDoctorSchedules,
    createDoctorSchedule,
    updateDoctorSchedule,
    deleteDoctorSchedule,
    getDoctorAppointments,
    updateAppointmentStatus,
    updateBulkAppointmentStatus,
    getDoctorPatients,
    getPatientMedicalRecords,
    createMedicalRecord,
    createPrescription,
    getAvailableSpecialtiesAndClinics,
    getDoctorStatistics,
    getDoctorReviews,
    getPatientDetail,
    getPatientRecords
} from "../controllers/doctor-dashboard.controller";
import { doctorCertificateController } from "../controllers/doctor-certificate.controller";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

// All routes here are protected and require DOCTOR role
router.use(verifyToken, verifyDoctor);

// Dashboard
router.get("/dashboard/stats", getDashboardStats);
router.get("/dashboard/charts", getDashboardCharts);
router.get("/statistics", getDoctorStatistics);
router.get("/reviews", getDoctorReviews);

// Profile & Metadata
router.get("/profile", getDoctorProfile);
router.put("/profile", updateDoctorProfile);
router.get("/metadata/options", getAvailableSpecialtiesAndClinics);

// Schedules
router.get("/schedules", getDoctorSchedules);
router.post("/schedules", createDoctorSchedule);
router.put("/schedules/:id", updateDoctorSchedule);
router.delete("/schedules/:id", deleteDoctorSchedule);

// Appointments
router.get("/appointments", getDoctorAppointments);
router.put("/appointments/bulk-status", updateBulkAppointmentStatus);
router.put("/appointments/:id/status", updateAppointmentStatus);

// Patients & Medical Records
router.get("/patients", getDoctorPatients);
router.get("/patients/:userId", getPatientDetail);
router.get("/patients/:userId/records", getPatientRecords);
router.post("/medical-records", createMedicalRecord);
router.post("/prescriptions", createPrescription);

// Certificates
router.get("/certificates", doctorCertificateController.getCertificates);
router.post("/certificates", upload.single("file"), doctorCertificateController.createCertificate);
router.put("/certificates/:id", upload.single("file"), doctorCertificateController.updateCertificate);
router.delete("/certificates/:id", doctorCertificateController.deleteCertificate);

export default router;
