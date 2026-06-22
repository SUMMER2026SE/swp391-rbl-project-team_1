import { Router } from "express";

import {
    login,
    register,
    sendOtp,
    verifyOtpCode,
    forgotPassword,
    verifyResetOtpCode,
    resetPasswordController,
    googleLoginController,
} from "../controllers/auth.controller";
import { sendOtpLimiter, loginLimiter } from "../middleware/rateLimit.middleware";

const router = Router();

router.post("/send-otp", sendOtpLimiter, sendOtp);
router.post("/verify-otp", loginLimiter, verifyOtpCode);
router.post("/register", register);
router.post("/login", loginLimiter, login);

router.post("/forgot-password", sendOtpLimiter, forgotPassword);
router.post("/verify-reset-otp", loginLimiter, verifyResetOtpCode);
router.post("/reset-password", resetPasswordController);
router.post("/google-login", googleLoginController);

export default router;