"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_middleware_1 = require("../middleware/auth.middleware");
const user_service_1 = require("../services/user.service");
const apiError_1 = require("../utils/apiError");
const router = (0, express_1.Router)();
/**
 * GET /api/users/:id
 * Returns a single user by ID. Requires authentication.
 * ADMIN can view any user; USER/DOCTOR can only view themselves.
 */
router.get("/:id", auth_middleware_1.verifyToken, async (req, res, next) => {
    try {
        const { id } = req.params;
        const requestingUser = req.user;
        if (!requestingUser) {
            throw new apiError_1.ApiError("Authentication required", 401);
        }
        // Non-admins can only view their own profile
        if (requestingUser.role !== client_1.Role.ADMIN && requestingUser.userId !== id) {
            throw new apiError_1.ApiError("Access denied. You can only view your own profile.", 403);
        }
        const user = await (0, user_service_1.getUserById)(id);
        if (!user) {
            throw new apiError_1.ApiError("User not found", 404);
        }
        res.json({ message: "User retrieved successfully", data: user });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
