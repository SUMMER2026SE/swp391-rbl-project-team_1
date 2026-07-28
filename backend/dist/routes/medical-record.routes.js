"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const medical_record_controller_1 = require("../controllers/medical-record.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const authorization_middleware_1 = require("../middleware/authorization.middleware");
const router = (0, express_1.Router)();
// Doctor routes — require DOCTOR role + ownership check enforced in controller
router.get('/appointment/:appointmentId', auth_middleware_1.verifyToken, authorization_middleware_1.verifyDoctor, medical_record_controller_1.getRecordByAppointment);
router.post('/appointment/:appointmentId', auth_middleware_1.verifyToken, authorization_middleware_1.verifyDoctor, medical_record_controller_1.saveRecord);
router.put('/appointment/:appointmentId', auth_middleware_1.verifyToken, authorization_middleware_1.verifyDoctor, medical_record_controller_1.saveRecord);
// Patient-facing routes (require auth)
router.get('/my', auth_middleware_1.verifyToken, medical_record_controller_1.getMyMedicalRecords);
router.get('/patient/appointment/:appointmentId', auth_middleware_1.verifyToken, medical_record_controller_1.getMyRecordByAppointment);
exports.default = router;
