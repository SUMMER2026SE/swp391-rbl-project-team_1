import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware';
import { verifyRole } from '../middleware/role.middleware';
import { Role } from '../types/enums';
import {
  startSession,
  completeSession,
  getSessionHistory
} from '../controllers/pomodoro.controller';

const router = Router();

// Ensure student role for all pomodoro endpoints
router.use(verifyToken);
router.use(verifyRole(Role.STUDENT));

router.post('/start', startSession);
router.put('/:id/complete', completeSession);
router.get('/history', getSessionHistory);

export default router;
