"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_middleware_1 = require("../middleware/auth.middleware");
const user_service_1 = require("../services/user.service");
const upload_middleware_1 = require("../middleware/upload.middleware");
const apiError_1 = require("../utils/apiError");
const router = (0, express_1.Router)();
/**
 * GET /api/users/profile
 * Returns the profile of the currently logged in user.
 */
router.get("/profile", auth_middleware_1.verifyToken, async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new apiError_1.ApiError("Authentication required", 401);
        }
        const user = await (0, user_service_1.getUserById)(userId);
        if (!user) {
            throw new apiError_1.ApiError("User not found", 404);
        }
        res.json({ message: "Profile retrieved successfully", data: user });
    }
    catch (error) {
        next(error);
    }
});
/**
 * PUT /api/users/profile
 * Updates the profile of the currently logged in user.
 */
router.put("/profile", auth_middleware_1.verifyToken, async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new apiError_1.ApiError("Authentication required", 401);
        }
        const { fullName, gender, address, dateOfBirth } = req.body;
        const parsedDob = dateOfBirth ? new Date(dateOfBirth) : null;
        const updatedUser = await (0, user_service_1.updateUserProfile)(userId, {
            fullName,
            gender,
            address,
            dateOfBirth: parsedDob,
        });
        res.json({ message: "Profile updated successfully", data: updatedUser });
    }
    catch (error) {
        next(error);
    }
});
/**
 * PUT /api/users/change-password
 * Changes the password of the currently logged in user.
 */
router.put("/change-password", auth_middleware_1.verifyToken, async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new apiError_1.ApiError("Authentication required", 401);
        }
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            throw new apiError_1.ApiError("Old password and new password are required", 400);
        }
        if (newPassword.length < 6) {
            throw new apiError_1.ApiError("New password must be at least 6 characters", 400);
        }
        await (0, user_service_1.changeUserPassword)(userId, oldPassword, newPassword);
        res.json({ message: "Password updated successfully" });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/users/upload-avatar
 * Uploads a profile avatar for the currently logged in user.
 */
router.post("/upload-avatar", auth_middleware_1.verifyToken, upload_middleware_1.uploadAvatar.single("avatar"), async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new apiError_1.ApiError("Authentication required", 401);
        }
        if (!req.file) {
            throw new apiError_1.ApiError("Please upload an image file", 400);
        }
        // Path to be saved in DB and served statically
        const relativePath = `/public/uploads/avatars/${req.file.filename}`;
        const updatedUser = await (0, user_service_1.updateUserAvatar)(userId, relativePath);
        res.json({
            message: "Avatar uploaded successfully",
            data: updatedUser,
        });
    }
    catch (error) {
        next(error);
    }
});
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
