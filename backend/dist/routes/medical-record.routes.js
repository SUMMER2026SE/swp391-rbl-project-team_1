"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const medical_record_controller_1 = require("../controllers/medical-record.controller");
const router = (0, express_1.Router)();
router.get('/appointment/:appointmentId', medical_record_controller_1.getRecordByAppointment);
router.post('/appointment/:appointmentId', medical_record_controller_1.saveRecord);
router.put('/appointment/:appointmentId', medical_record_controller_1.saveRecord);
exports.default = router;
