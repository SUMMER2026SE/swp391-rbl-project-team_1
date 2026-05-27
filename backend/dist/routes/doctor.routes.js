"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const doctor_controller_1 = require("../controllers/doctor.controller");
const schedule_controller_1 = require("../controllers/schedule.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const authorization_middleware_1 = require("../middleware/authorization.middleware");
const router = (0, express_1.Router)();
router.get("/doctors", doctor_controller_1.listDoctors);
router.get("/specialties", doctor_controller_1.listSpecialties);
router.get("/doctors/:id", doctor_controller_1.getDoctor);
router.post("/doctors/:id/schedules", auth_middleware_1.verifyToken, schedule_controller_1.createSchedule);
router.get("/doctors/:id/schedules", schedule_controller_1.listSchedules);
// Doctor protected route - only DOCTOR role can access
router.get("/doctor/appointments", auth_middleware_1.verifyToken, (0, authorization_middleware_1.authorizeRoles)(client_1.Role.DOCTOR), doctor_controller_1.getDoctorAppointmentsController);
// Admin routes for updating doctor avatars
router.post("/admin/doctors/:id/avatar", auth_middleware_1.verifyToken, (0, authorization_middleware_1.authorizeRoles)(client_1.Role.ADMIN), doctor_controller_1.updateDoctorAvatar);
router.post("/admin/doctors/batch-update-avatars", auth_middleware_1.verifyToken, (0, authorization_middleware_1.authorizeRoles)(client_1.Role.ADMIN), doctor_controller_1.batchUpdateAvatars);
exports.default = router;
