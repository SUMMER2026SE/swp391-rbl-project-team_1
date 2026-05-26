import { Router } from "express";

import {
    login,
    register,
    sendOtp,
    verifyOtpCode,
} from "../controllers/auth.controller";

const router = Router();

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtpCode);
router.post("/register", register);
router.post("/login", login);

export default router;