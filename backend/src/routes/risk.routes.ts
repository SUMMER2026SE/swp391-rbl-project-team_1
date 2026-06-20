import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware';
import { verifyRole } from '../middleware/role.middleware';
import { Role } from '../types/enums';
import {
  getRiskScore,
  getRiskHistory,
  triggerRecalculate
} from '../controllers/risk.controller';

const router = Router();

// Ensure student role for all risk endpoints
router.use(verifyToken);
router.use(verifyRole(Role.STUDENT));

router.get('/score', getRiskScore);
router.get('/history', getRiskHistory);
router.post('/recalculate', triggerRecalculate);

export default router;
