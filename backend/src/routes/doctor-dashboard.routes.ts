import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware";
import { verifyDoctor } from "../middleware/authorization.middleware";
import {
    getDashboardStats,
    getDoctorProfile,
    updateDoctorProfile,
    getDoctorSchedules,
    createDoctorSchedule,
    updateDoctorSchedule,
    deleteDoctorSchedule,
    getDoctorAppointments,
    updateAppointmentStatus,
    getDoctorPatients,
    getPatientMedicalRecords,
    createMedicalRecord,
    createPrescription,
    getAvailableSpecialtiesAndClinics
} from "../controllers/doctor-dashboard.controller";

const router = Router();

// All routes here are protected and require DOCTOR role
router.use(verifyToken, verifyDoctor);

// Dashboard
router.get("/dashboard/stats", getDashboardStats);

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
router.put("/appointments/:id/status", updateAppointmentStatus);

// Patients & Medical Records
router.get("/patients", getDoctorPatients);
router.get("/patients/:userId/records", getPatientMedicalRecords);
router.post("/medical-records", createMedicalRecord);
router.post("/prescriptions", createPrescription);

export default router;
