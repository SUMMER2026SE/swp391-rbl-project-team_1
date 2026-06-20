import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware';
import { verifyRole } from '../middleware/role.middleware';
import { Role } from '../types/enums';
import {
  getRoadmapTasks,
  generateAIRoadmap
} from '../controllers/roadmap.controller';

const router = Router();

// Ensure student role for all roadmap endpoints
router.use(verifyToken);
router.use(verifyRole(Role.STUDENT));

router.get('/', getRoadmapTasks);
router.post('/generate', generateAIRoadmap);

export default router;
