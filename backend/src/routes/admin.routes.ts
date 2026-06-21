import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware';
import { verifyRole } from '../middleware/role.middleware';
import { Role } from '../types/enums';
import {
  getSystemStats,
  getUsers,
  updateUser,
  deleteUser,
  getSkills,
  createSkill,
  updateSkill,
  deleteSkill
} from '../controllers/admin.controller';

const router = Router();

// Ensure admin role for admin endpoints
router.use(verifyToken);
router.use(verifyRole(Role.ADMIN));

// Stats
router.get('/stats', getSystemStats);

// Users
router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Skills
router.get('/skills', getSkills);
router.post('/skills', createSkill);
router.put('/skills/:id', updateSkill);
router.delete('/skills/:id', deleteSkill);

export default router;
