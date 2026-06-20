import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware';
import { verifyRole } from '../middleware/role.middleware';
import { Role } from '../types/enums';
import { getLeaderboard } from '../controllers/leaderboard.controller';

const router = Router();

// Ensure student role for leaderboard endpoints
router.use(verifyToken);
router.use(verifyRole(Role.STUDENT));

router.get('/', getLeaderboard);

export default router;
