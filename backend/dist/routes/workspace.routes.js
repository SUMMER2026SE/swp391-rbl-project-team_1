"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const enums_1 = require("../types/enums");
const workspace_controller_1 = require("../controllers/workspace.controller");
const router = (0, express_1.Router)();
// Ensure student role for all workspace endpoints
router.use(auth_middleware_1.verifyToken);
router.use((0, role_middleware_1.verifyRole)(enums_1.Role.STUDENT));
router.get('/tasks', workspace_controller_1.getTasks);
router.get('/tasks/ai-generate', workspace_controller_1.aiGenerateTasks);
router.post('/tasks', workspace_controller_1.createTask);
router.put('/tasks/:id', workspace_controller_1.updateTask);
router.put('/tasks/:id/status', workspace_controller_1.updateStatus);
router.put('/tasks/:id/reorder', workspace_controller_1.reorderTask);
router.delete('/tasks/:id', workspace_controller_1.deleteTask);
exports.default = router;
