"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const complaint_controller_1 = require("../controllers/complaint.controller");
const router = (0, express_1.Router)();
/**
 * POST /api/complaints
 * Create a new complaint (System or Service)
 */
router.post("/", auth_middleware_1.verifyToken, complaint_controller_1.createComplaintHandler);
/**
 * GET /api/complaints
 * Get complaints for the current user
 */
router.get("/", auth_middleware_1.verifyToken, complaint_controller_1.getUserComplaintsHandler);
exports.default = router;
