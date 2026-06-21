import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware';
import { verifyRole } from '../middleware/role.middleware';
import { Role } from '../types/enums';
import {
  getMentorStudents,
  getStudentDetails,
  getRedFlags,
  getOverviewStats,
  createKnowledgeUnit,
  updateKnowledgeUnit,
  deleteKnowledgeUnit,
  getKnowledgeUnits,
  createQuizQuestion,
  updateQuizQuestion,
  deleteQuizQuestion,
  getQuizQuestions,
  aiGenerateQuizQuestions,
  sendManualAlert,
  createRoadmapTemplate,
  updateRoadmapTemplate,
  deleteRoadmapTemplate
} from '../controllers/mentor.controller';

const router = Router();

// Ensure mentor role for all mentor endpoints
router.use(verifyToken);
router.use(verifyRole(Role.MENTOR));

router.get('/students', getMentorStudents);
router.get('/students/:id', getStudentDetails);
router.get('/red-flags', getRedFlags);
router.get('/stats/overview', getOverviewStats);

// Knowledge Units
router.post('/knowledge-units', createKnowledgeUnit);
router.put('/knowledge-units/:id', updateKnowledgeUnit);
router.delete('/knowledge-units/:id', deleteKnowledgeUnit);
router.get('/knowledge-units', getKnowledgeUnits);

// Quiz Questions
router.post('/quiz-questions', createQuizQuestion);
router.put('/quiz-questions/:id', updateQuizQuestion);
router.delete('/quiz-questions/:id', deleteQuizQuestion);
router.get('/quiz-questions', getQuizQuestions);
router.post('/quiz-questions/ai-generate', aiGenerateQuizQuestions);

// Alerts
router.post('/alerts', sendManualAlert);

// Roadmap Templates
router.post('/roadmap-templates', createRoadmapTemplate);
router.put('/roadmap-templates/:id', updateRoadmapTemplate);
router.delete('/roadmap-templates/:id', deleteRoadmapTemplate);

export default router;
