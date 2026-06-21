"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const enums_1 = require("../types/enums");
const roadmap_controller_1 = require("../controllers/roadmap.controller");
const router = (0, express_1.Router)();
// Ensure student role for all roadmap endpoints
router.use(auth_middleware_1.verifyToken);
router.use((0, role_middleware_1.verifyRole)(enums_1.Role.STUDENT));
router.get('/', roadmap_controller_1.getRoadmapTasks);
router.post('/generate', roadmap_controller_1.generateAIRoadmap);
exports.default = router;
