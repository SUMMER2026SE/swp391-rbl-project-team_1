import { Router } from 'express';
import { getRecordByAppointment, saveRecord, getMyMedicalRecords, getMyRecordByAppointment } from '../controllers/medical-record.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

// Doctor routes (no auth middleware here — auth handled at server.ts level for doctor routes)
router.get('/appointment/:appointmentId', getRecordByAppointment);
router.post('/appointment/:appointmentId', saveRecord);
router.put('/appointment/:appointmentId', saveRecord);

// Patient-facing routes (require auth)
router.get('/my', verifyToken, getMyMedicalRecords);
router.get('/patient/appointment/:appointmentId', verifyToken, getMyRecordByAppointment);

export default router;
