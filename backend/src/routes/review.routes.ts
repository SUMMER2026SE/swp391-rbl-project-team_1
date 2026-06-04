import { Router } from "express";
import { createReview, getDoctorReviews } from "../controllers/review.controller";
import { verifyToken } from "../middleware/auth.middleware";

const router = Router();

/**
 * POST /api/reviews
 * Submit a rating and review for a completed appointment
 */
router.post("/reviews", verifyToken, createReview);

/**
 * GET /api/doctors/:id/reviews
 * Public endpoint to fetch reviews and metrics for a doctor
 */
router.get("/doctors/:id/reviews", getDoctorReviews);

export default router;
