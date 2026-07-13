"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const review_controller_1 = require("../controllers/review.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
/**
 * POST /api/reviews
 * Submit a rating and review for a completed appointment
 */
router.post("/reviews", auth_middleware_1.verifyToken, review_controller_1.createReview);
/**
 * GET /api/doctors/:id/reviews
 * Public endpoint to fetch reviews and metrics for a doctor
 */
router.get("/doctors/:id/reviews", review_controller_1.getDoctorReviews);
exports.default = router;
