"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const enums_1 = require("../types/enums");
const bkt_controller_1 = require("../controllers/bkt.controller");
const router = (0, express_1.Router)();
// Ensure student role for all BKT endpoints
router.use(auth_middleware_1.verifyToken);
router.use((0, role_middleware_1.verifyRole)(enums_1.Role.STUDENT));
router.get('/mastery', bkt_controller_1.getMasteries);
router.get('/mastery/:skillId', bkt_controller_1.getMasteryBySkill);
router.get('/history/:skillId', bkt_controller_1.getBKTHistory);
exports.default = router;
