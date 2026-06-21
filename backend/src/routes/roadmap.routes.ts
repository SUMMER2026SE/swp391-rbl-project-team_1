import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware';
import { verifyRole } from '../middleware/role.middleware';
import { Role } from '../types/enums';
import {
  getRoadmapTasks,
  generateAIRoadmap,
  getRoadmapTemplates,
  getRoadmapTemplateDetail
} from '../controllers/roadmap.controller';

const router = Router();

// Ensure authenticated for all roadmap endpoints
router.use(verifyToken);

// Ensure student role for roadmap tasks and generation
router.get('/', verifyRole(Role.STUDENT), getRoadmapTasks);
router.post('/generate', verifyRole(Role.STUDENT), generateAIRoadmap);

// Templates can be viewed by STUDENT, MENTOR, ADMIN
router.get('/templates', verifyRole(Role.STUDENT, Role.MENTOR, Role.ADMIN), getRoadmapTemplates);
router.get('/templates/:id', verifyRole(Role.STUDENT, Role.MENTOR, Role.ADMIN), getRoadmapTemplateDetail);

export default router;
