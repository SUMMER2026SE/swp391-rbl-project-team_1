"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const enums_1 = require("../types/enums");
const quiz_controller_1 = require("../controllers/quiz.controller");
const router = (0, express_1.Router)();
// Ensure student role for all quiz endpoints
router.use(auth_middleware_1.verifyToken);
router.use((0, role_middleware_1.verifyRole)(enums_1.Role.STUDENT));
router.get('/questions/:skillId', quiz_controller_1.getQuestions);
router.post('/submit', quiz_controller_1.submitAnswer);
router.get('/history', quiz_controller_1.getQuizHistory);
exports.default = router;
