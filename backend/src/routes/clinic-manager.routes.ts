import { Router } from "express";

import { verifyToken } from "../middleware/auth.middleware";
import { verifyClinicManager } from "../middleware/authorization.middleware";
import {
    getClinicDoctorsHandler,
    createClinicDoctorHandler,
    updateClinicDoctorHandler,
    removeClinicDoctorHandler,
    getClinicSchedulesHandler,
    createClinicDoctorScheduleHandler,
    getClinicAppointmentsHandler,
    updateClinicAppointmentStatusHandler,
} from "../controllers/clinic-manager.controller";

const router = Router();

// Apply auth middlewares to all clinic manager routes
router.use("/clinic-manager", verifyToken, verifyClinicManager);

// ─── Doctors Management ──────────────────────────────────────────────────────
router.get("/clinic-manager/doctors", getClinicDoctorsHandler);
router.post("/clinic-manager/doctors", createClinicDoctorHandler);
router.put("/clinic-manager/doctors/:id", updateClinicDoctorHandler);
router.delete("/clinic-manager/doctors/:id", removeClinicDoctorHandler);

// ─── Schedules Management ────────────────────────────────────────────────────
router.get("/clinic-manager/schedules", getClinicSchedulesHandler);
router.post("/clinic-manager/schedules", createClinicDoctorScheduleHandler);

// ─── Appointments Management ──────────────────────────────────────────────────
router.get("/clinic-manager/appointments", getClinicAppointmentsHandler);
router.put("/clinic-manager/appointments/:id/status", updateClinicAppointmentStatusHandler);

export default router;
