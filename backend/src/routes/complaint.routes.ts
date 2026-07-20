import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware";
import { createComplaintHandler, getUserComplaintsHandler } from "../controllers/complaint.controller";

const router = Router();

/**
 * POST /api/complaints
 * Create a new complaint (System or Service)
 */
router.post("/", verifyToken, createComplaintHandler);

/**
 * GET /api/complaints
 * Get complaints for the current user
 */
router.get("/", verifyToken, getUserComplaintsHandler);

export default router;
