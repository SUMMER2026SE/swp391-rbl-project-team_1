"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const enums_1 = require("../types/enums");
const mentor_controller_1 = require("../controllers/mentor.controller");
const router = (0, express_1.Router)();
// Ensure mentor role for all mentor endpoints
router.use(auth_middleware_1.verifyToken);
router.use((0, role_middleware_1.verifyRole)(enums_1.Role.MENTOR));
router.get('/students', mentor_controller_1.getMentorStudents);
router.get('/students/:id', mentor_controller_1.getStudentDetails);
router.get('/red-flags', mentor_controller_1.getRedFlags);
router.get('/stats/overview', mentor_controller_1.getOverviewStats);
// Knowledge Units
router.post('/knowledge-units', mentor_controller_1.createKnowledgeUnit);
router.put('/knowledge-units/:id', mentor_controller_1.updateKnowledgeUnit);
router.delete('/knowledge-units/:id', mentor_controller_1.deleteKnowledgeUnit);
router.get('/knowledge-units', mentor_controller_1.getKnowledgeUnits);
// Quiz Questions
router.post('/quiz-questions', mentor_controller_1.createQuizQuestion);
router.put('/quiz-questions/:id', mentor_controller_1.updateQuizQuestion);
router.delete('/quiz-questions/:id', mentor_controller_1.deleteQuizQuestion);
router.get('/quiz-questions', mentor_controller_1.getQuizQuestions);
router.post('/quiz-questions/ai-generate', mentor_controller_1.aiGenerateQuizQuestions);
// Alerts
router.post('/alerts', mentor_controller_1.sendManualAlert);
exports.default = router;
