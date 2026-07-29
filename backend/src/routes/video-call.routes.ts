import { Router } from "express";
import { logVideoCall, getVideoCallHistory } from "../controllers/video-call.controller";
import { verifyToken } from "../middleware/auth.middleware";

const router = Router();

// All video call routes require authentication
router.use(verifyToken);

router.post("/log", logVideoCall);
router.get("/history", getVideoCallHistory);

export default router;
