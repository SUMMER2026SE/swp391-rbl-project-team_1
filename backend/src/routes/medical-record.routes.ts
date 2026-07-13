import { Router } from 'express';
import { getRecordByAppointment, saveRecord } from '../controllers/medical-record.controller';

const router = Router();

router.get('/appointment/:appointmentId', getRecordByAppointment);
router.post('/appointment/:appointmentId', saveRecord);
router.put('/appointment/:appointmentId', saveRecord);

export default router;
