"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOtp = sendOtp;
exports.verifyOtpCode = verifyOtpCode;
exports.register = register;
exports.login = login;
exports.getProfile = getProfile;
exports.forgotPassword = forgotPassword;
exports.verifyResetOtpCode = verifyResetOtpCode;
exports.resetPasswordController = resetPasswordController;
exports.googleLoginController = googleLoginController;
const auth_service_1 = require("../services/auth.service");
const apiError_1 = require("../utils/apiError");
/**
 * POST /api/auth/send-otp
 * Step 1: Send OTP to email
 */
async function sendOtp(req, res, next) {
    try {
        const { email } = req.body;
        if (!email) {
            throw new apiError_1.ApiError("Email is required", 400);
        }
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new apiError_1.ApiError("Invalid email format", 400);
        }
        await (0, auth_service_1.sendOtpToEmail)(email);
        res.status(200).json({
            message: "OTP sent successfully to your email",
            email: email,
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * POST /api/auth/verify-otp
 * Step 2: Verify OTP code
 */
async function verifyOtpCode(req, res, next) {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            throw new apiError_1.ApiError("Email and OTP are required", 400);
        }
        const result = await (0, auth_service_1.verifyOtp)(email, otp);
        res.status(200).json({
            message: "OTP verified successfully",
            verified: result.isValid,
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * POST /api/auth/register
 * Step 3: Complete registration with password after OTP verification
 */
async function register(req, res, next) {
    try {
        const { email, otp, password } = req.body;
        if (!email || !otp || !password) {
            throw new apiError_1.ApiError("Email, OTP, and password are required", 400);
        }
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new apiError_1.ApiError("Invalid email format", 400);
        }
        if (password.length < 6) {
            throw new apiError_1.ApiError("Password must be at least 6 characters", 400);
        }
        const user = await (0, auth_service_1.registerUser)(email, password, otp);
        res.status(201).json({
            message: "Registration completed successfully",
            user,
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * POST /api/auth/login
 * Authenticates a user using email and password, and returns a JWT token.
 */
async function login(req, res, next) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            throw new apiError_1.ApiError("Email and password are required", 400);
        }
        const { token, user } = await (0, auth_service_1.authenticateUser)(email, password);
        res.json({
            message: "Login successful",
            token,
            user,
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/profile
 * Returns the authenticated user's profile (without password).
 */
async function getProfile(req, res, next) {
    try {
        if (!req.user?.userId) {
            throw new apiError_1.ApiError("User data is missing from request", 401);
        }
        const user = await (0, auth_service_1.findUserById)(req.user.userId);
        if (!user) {
            throw new apiError_1.ApiError("User not found", 404);
        }
        res.json({
            message: "Profile fetched successfully",
            user,
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * POST /api/auth/forgot-password
 * Step 1: Send reset password OTP to email
 */
async function forgotPassword(req, res, next) {
    try {
        const { email } = req.body;
        if (!email) {
            throw new apiError_1.ApiError("Email is required", 400);
        }
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new apiError_1.ApiError("Invalid email format", 400);
        }
        await (0, auth_service_1.sendResetOtpToEmail)(email);
        res.status(200).json({
            message: "Reset password OTP sent successfully to your email",
            email: email,
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * POST /api/auth/verify-reset-otp
 * Step 2: Verify reset password OTP code
 */
async function verifyResetOtpCode(req, res, next) {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            throw new apiError_1.ApiError("Email and OTP are required", 400);
        }
        const result = await (0, auth_service_1.verifyResetOtp)(email, otp);
        res.status(200).json({
            message: "Reset OTP verified successfully",
            verified: result.isValid,
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * POST /api/auth/reset-password
 * Step 3: Reset password using email, OTP and new password
 */
async function resetPasswordController(req, res, next) {
    try {
        const { email, otp, password } = req.body;
        if (!email || !otp || !password) {
            throw new apiError_1.ApiError("Email, OTP, and new password are required", 400);
        }
        if (password.length < 6) {
            throw new apiError_1.ApiError("Password must be at least 6 characters", 400);
        }
        await (0, auth_service_1.resetPassword)(email, otp, password);
        res.status(200).json({
            message: "Password has been reset successfully. You can now log in with your new password.",
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * POST /api/auth/google-login
 * Authenticates user using Google idToken
 */
async function googleLoginController(req, res, next) {
    try {
        const { idToken } = req.body;
        if (!idToken) {
            throw new apiError_1.ApiError("Google ID Token is required", 400);
        }
        const { token, user } = await (0, auth_service_1.googleLogin)(idToken);
        res.json({
            message: "Google login successful",
            token,
            user,
        });
    }
    catch (error) {
        next(error);
    }
}
