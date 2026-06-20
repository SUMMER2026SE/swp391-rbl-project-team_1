import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware';
import { verifyRole } from '../middleware/role.middleware';
import { Role } from '../types/enums';
import {
  getRoadmapTasks,
  generateAIRoadmap,
  reorderRoadmap,
  getPurchasedRoadmaps,
  purchaseRoadmap
} from '../controllers/roadmap.controller';

const router = Router();

// Ensure student role for all roadmap endpoints
router.use(verifyToken);
router.use(verifyRole(Role.STUDENT));

router.get('/', getRoadmapTasks);
router.get('/purchased', getPurchasedRoadmaps);
router.post('/purchase', purchaseRoadmap);
router.post('/generate', generateAIRoadmap);
router.put('/reorder', reorderRoadmap);

export default router;
