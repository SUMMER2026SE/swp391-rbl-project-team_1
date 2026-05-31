import { Router } from "express";
import { Role } from "@prisma/client";
import { verifyToken } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/authorization.middleware";
import { submitReview, listDoctorReviews, listMyReviews } from "../controllers/review.controller";

const router = Router();

router.post("/reviews", verifyToken, authorizeRoles(Role.USER), submitReview);
router.get("/reviews/me", verifyToken, authorizeRoles(Role.USER), listMyReviews);
router.get("/doctors/:doctorId/reviews", listDoctorReviews);

export default router;
