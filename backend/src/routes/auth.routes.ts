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

const router = Router();

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtpCode);
router.post("/register", register);
router.post("/login", login);

router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOtpCode);
router.post("/reset-password", resetPasswordController);
router.post("/google-login", googleLoginController);

export default router;