import { NextFunction, Request, Response } from "express";

import {
    authenticateUser,
    findUserById,
    registerUser,
    sendOtpToEmail,
    verifyOtp,
    sendResetOtpToEmail,
    verifyResetOtp,
    resetPassword,
    googleLogin,
} from "../services/auth.service";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { ApiError } from "../utils/apiError";

interface OtpRequest {
    email: string;
    otp: string;
}

interface RegisterRequest {
    email: string;
    otp: string;
    password: string;
}

interface LoginRequest {
    email: string;
    password: string;
}

/**
 * POST /api/auth/send-otp
 * Step 1: Send OTP to email
 */
export async function sendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { email } = req.body as { email: string };

        if (!email) {
            throw new ApiError("Email is required", 400);
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new ApiError("Invalid email format", 400);
        }

        await sendOtpToEmail(email);
        res.status(200).json({
            message: "OTP sent successfully to your email",
            email: email,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/auth/verify-otp
 * Step 2: Verify OTP code
 */
export async function verifyOtpCode(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { email, otp } = req.body as OtpRequest;

        if (!email || !otp) {
            throw new ApiError("Email and OTP are required", 400);
        }

        const result = await verifyOtp(email, otp);
        res.status(200).json({
            message: "OTP verified successfully",
            verified: result.isValid,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/auth/register
 * Step 3: Complete registration with password after OTP verification
 */
export async function register(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { email, otp, password } = req.body as RegisterRequest;

        if (!email || !otp || !password) {
            throw new ApiError("Email, OTP, and password are required", 400);
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new ApiError("Invalid email format", 400);
        }

        if (password.length < 6) {
            throw new ApiError("Password must be at least 6 characters", 400);
        }

        const user = await registerUser(email, password, otp);
        res.status(201).json({
            message: "Registration completed successfully",
            user,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/auth/login
 * Authenticates a user using email and password, and returns a JWT token.
 */
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { email, password } = req.body as LoginRequest;

        if (!email || !password) {
            throw new ApiError("Email and password are required", 400);
        }

        const { token, user } = await authenticateUser(email, password);

        res.json({
            message: "Login successful",
            token,
            user,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/profile
 * Returns the authenticated user's profile (without password).
 */
export async function getProfile(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user?.userId) {
            throw new ApiError("User data is missing from request", 401);
        }

        const user = await findUserById(req.user.userId);

        if (!user) {
            throw new ApiError("User not found", 404);
        }

        res.json({
            message: "Profile fetched successfully",
            user,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/auth/forgot-password
 * Step 1: Send reset password OTP to email
 */
export async function forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { email } = req.body as { email: string };

        if (!email) {
            throw new ApiError("Email is required", 400);
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new ApiError("Invalid email format", 400);
        }

        await sendResetOtpToEmail(email);

        res.status(200).json({
            message: "Reset password OTP sent successfully to your email",
            email: email,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/auth/verify-reset-otp
 * Step 2: Verify reset password OTP code
 */
export async function verifyResetOtpCode(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { email, otp } = req.body as OtpRequest;

        if (!email || !otp) {
            throw new ApiError("Email and OTP are required", 400);
        }

        const result = await verifyResetOtp(email, otp);
        res.status(200).json({
            message: "Reset OTP verified successfully",
            verified: result.isValid,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/auth/reset-password
 * Step 3: Reset password using email, OTP and new password
 */
export async function resetPasswordController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { email, otp, password } = req.body as { email: string; otp: string; password: string };

        if (!email || !otp || !password) {
            throw new ApiError("Email, OTP, and new password are required", 400);
        }

        if (password.length < 6) {
            throw new ApiError("Password must be at least 6 characters", 400);
        }

        await resetPassword(email, otp, password);

        res.status(200).json({
            message: "Password has been reset successfully. You can now log in with your new password.",
        });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/auth/google-login
 * Authenticates user using Google idToken
 */
export async function googleLoginController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { idToken } = req.body as { idToken: string };

        if (!idToken) {
            throw new ApiError("Google ID Token is required", 400);
        }

        const { token, user } = await googleLogin(idToken);

        res.json({
            message: "Google login successful",
            token,
            user,
        });
    } catch (error) {
        next(error);
    }
}


