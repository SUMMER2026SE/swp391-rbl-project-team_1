import { Router } from "express";
import { Role } from "@prisma/client";

import { getDoctor, listDoctors, getDoctorAppointmentsController, updateDoctorAvatar, batchUpdateAvatars, listSpecialties } from "../controllers/doctor.controller";
import { createSchedule, listSchedules } from "../controllers/schedule.controller";
import { verifyToken } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/authorization.middleware";

const router = Router();

router.get("/doctors", listDoctors);
router.get("/specialties", listSpecialties);
router.get("/doctors/:id", getDoctor);
router.post("/doctors/:id/schedules", verifyToken, createSchedule);
router.get("/doctors/:id/schedules", listSchedules);



// Admin routes for updating doctor avatars
router.post(
    "/admin/doctors/:id/avatar",
    verifyToken,
    authorizeRoles(Role.ADMIN),
    updateDoctorAvatar
);

router.post(
    "/admin/doctors/batch-update-avatars",
    verifyToken,
    authorizeRoles(Role.ADMIN),
    batchUpdateAvatars
);

export default router;
