import { Router } from 'express';
import { getRecordByAppointment, saveRecord, getMyMedicalRecords, getMyRecordByAppointment } from '../controllers/medical-record.controller';
import { verifyToken } from '../middleware/auth.middleware';
import { verifyDoctor } from '../middleware/authorization.middleware';

const router = Router();

// Doctor routes — require DOCTOR role + ownership check enforced in controller
router.get('/appointment/:appointmentId', verifyToken, verifyDoctor, getRecordByAppointment);
router.post('/appointment/:appointmentId', verifyToken, verifyDoctor, saveRecord);
router.put('/appointment/:appointmentId', verifyToken, verifyDoctor, saveRecord);

// Patient-facing routes (require auth)
router.get('/my', verifyToken, getMyMedicalRecords);
router.get('/patient/appointment/:appointmentId', verifyToken, getMyRecordByAppointment);

export default router;
