import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware';
import { verifyRole } from '../middleware/role.middleware';
import { Role } from '../types/enums';
import {
  getTasks,
  createTask,
  updateTask,
  updateStatus,
  reorderTask,
  deleteTask,
  aiGenerateTasks
} from '../controllers/workspace.controller';

const router = Router();

// Ensure student role for all workspace endpoints
router.use(verifyToken);
router.use(verifyRole(Role.STUDENT));

router.get('/tasks', getTasks);
router.get('/tasks/ai-generate', aiGenerateTasks);
router.post('/tasks', createTask);
router.put('/tasks/:id', updateTask);
router.put('/tasks/:id/status', updateStatus);
router.put('/tasks/:id/reorder', reorderTask);
router.delete('/tasks/:id', deleteTask);

export default router;
