"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const medical_record_controller_1 = require("../controllers/medical-record.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Doctor routes (no auth middleware here — auth handled at server.ts level for doctor routes)
router.get('/appointment/:appointmentId', medical_record_controller_1.getRecordByAppointment);
router.post('/appointment/:appointmentId', medical_record_controller_1.saveRecord);
router.put('/appointment/:appointmentId', medical_record_controller_1.saveRecord);
// Patient-facing routes (require auth)
router.get('/my', auth_middleware_1.verifyToken, medical_record_controller_1.getMyMedicalRecords);
router.get('/patient/appointment/:appointmentId', auth_middleware_1.verifyToken, medical_record_controller_1.getMyRecordByAppointment);
exports.default = router;
