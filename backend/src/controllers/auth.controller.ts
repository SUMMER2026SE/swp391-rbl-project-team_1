import { NextFunction, Request, Response } from "express";

import { authenticateUser, findUserById, registerUser } from "../services/auth.service";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { ApiError } from "../utils/apiError";

interface AuthRequestBody {
    phone: string;
    password: string;
}

/**
 * POST /api/auth/register
 * Registers a new user with default role USER.
 */
export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { phone, password } = req.body as AuthRequestBody;

        if (!phone || !password) {
            throw new ApiError("Phone and password are required", 400);
        }

        if (password.length < 6) {
            throw new ApiError("Password must be at least 6 characters", 400);
        }

        const user = await registerUser(phone, password);
        res.status(201).json({
            message: "Registration successful",
            user,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/auth/login
 * Authenticates a user and returns a JWT token.
 */
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { phone, password } = req.body as AuthRequestBody;

        if (!phone || !password) {
            throw new ApiError("Phone and password are required", 400);
        }

        const { token, user } = await authenticateUser(phone, password);

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
