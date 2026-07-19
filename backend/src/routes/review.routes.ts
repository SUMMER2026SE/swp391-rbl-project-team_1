import { Router } from "express";
import { createReview, getDoctorReviews, getMyReviews, getPendingReviews } from "../controllers/review.controller";
import { verifyToken } from "../middleware/auth.middleware";

const router = Router();

/**
 * POST /api/reviews
 * Submit a rating and review for a completed appointment
 */
router.post("/reviews", verifyToken, createReview);

/**
 * GET /api/reviews/me
 * Get all reviews submitted by the user
 */
router.get("/reviews/me", verifyToken, getMyReviews);

/**
 * GET /api/reviews/pending
 * Get all completed appointments that need a review
 */
router.get("/reviews/pending", verifyToken, getPendingReviews);

/**
 * GET /api/doctors/:id/reviews
 * Public endpoint to fetch reviews and metrics for a doctor
 */
router.get("/doctors/:id/reviews", getDoctorReviews);

export default router;
