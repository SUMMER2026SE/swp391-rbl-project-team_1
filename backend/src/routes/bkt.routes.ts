import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware';
import { verifyRole } from '../middleware/role.middleware';
import { Role } from '../types/enums';
import {
  getMasteries,
  getMasteryBySkill,
  getBKTHistory,
  addSkillMasteries,
  removeSkillMastery
} from '../controllers/bkt.controller';

const router = Router();

// Ensure student role for all BKT endpoints
router.use(verifyToken);
router.use(verifyRole(Role.STUDENT));

router.get('/mastery', getMasteries);
router.post('/mastery', addSkillMasteries);
router.delete('/mastery/:skillId', removeSkillMastery);
router.get('/mastery/:skillId', getMasteryBySkill);
router.get('/history/:skillId', getBKTHistory);

export default router;
