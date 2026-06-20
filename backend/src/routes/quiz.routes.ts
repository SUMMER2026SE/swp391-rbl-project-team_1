import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware';
import { verifyRole } from '../middleware/role.middleware';
import { Role } from '../types/enums';
import {
  getQuestions,
  submitAnswer,
  getQuizHistory
} from '../controllers/quiz.controller';

const router = Router();

// Ensure student role for all quiz endpoints
router.use(verifyToken);
router.use(verifyRole(Role.STUDENT));

router.get('/questions/:skillId', getQuestions);
router.post('/submit', submitAnswer);
router.get('/history', getQuizHistory);

export default router;
