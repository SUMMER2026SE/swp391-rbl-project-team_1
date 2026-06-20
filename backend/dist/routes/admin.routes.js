"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const enums_1 = require("../types/enums");
const admin_controller_1 = require("../controllers/admin.controller");
const router = (0, express_1.Router)();
// Ensure admin role for admin endpoints
router.use(auth_middleware_1.verifyToken);
router.use((0, role_middleware_1.verifyRole)(enums_1.Role.ADMIN));
// Stats
router.get('/stats', admin_controller_1.getSystemStats);
// Users
router.get('/users', admin_controller_1.getUsers);
router.put('/users/:id', admin_controller_1.updateUser);
router.delete('/users/:id', admin_controller_1.deleteUser);
// Skills
router.get('/skills', admin_controller_1.getSkills);
router.post('/skills', admin_controller_1.createSkill);
router.put('/skills/:id', admin_controller_1.updateSkill);
router.delete('/skills/:id', admin_controller_1.deleteSkill);
exports.default = router;
