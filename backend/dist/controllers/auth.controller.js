"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.getProfile = getProfile;
const auth_service_1 = require("../services/auth.service");
const apiError_1 = require("../utils/apiError");
/**
 * POST /api/auth/register
 * Registers a new user with default role USER.
 */
async function register(req, res, next) {
    try {
        const { phone, password } = req.body;
        if (!phone || !password) {
            throw new apiError_1.ApiError("Phone and password are required", 400);
        }
        if (password.length < 6) {
            throw new apiError_1.ApiError("Password must be at least 6 characters", 400);
        }
        const user = await (0, auth_service_1.registerUser)(phone, password);
        res.status(201).json({
            message: "Registration successful",
            user,
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * POST /api/auth/login
 * Authenticates a user and returns a JWT token.
 */
async function login(req, res, next) {
    try {
        const { phone, password } = req.body;
        if (!phone || !password) {
            throw new apiError_1.ApiError("Phone and password are required", 400);
        }
        const { token, user } = await (0, auth_service_1.authenticateUser)(phone, password);
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
