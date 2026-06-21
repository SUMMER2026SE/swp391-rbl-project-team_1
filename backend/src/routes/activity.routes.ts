import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware';
import { verifyRole } from '../middleware/role.middleware';
import { Role } from '../types/enums';
import { getHeatmap } from '../controllers/activity.controller';

const router = Router();

router.use(verifyToken);
router.use(verifyRole(Role.STUDENT));

router.get('/heatmap', getHeatmap);

export default router;
