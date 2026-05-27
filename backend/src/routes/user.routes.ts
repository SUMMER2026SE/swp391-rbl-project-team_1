import { Router } from "express";
import { Role } from "@prisma/client";

import { verifyToken } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/authorization.middleware";
import { getUserById, updateUserProfile, changeUserPassword, updateUserAvatar } from "../services/user.service";
import { uploadAvatar } from "../middleware/upload.middleware";
import { ApiError } from "../utils/apiError";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { NextFunction, Response } from "express";

const router = Router();

/**
 * GET /api/users/profile
 * Returns the profile of the currently logged in user.
 */
router.get(
    "/profile",
    verifyToken,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                throw new ApiError("Authentication required", 401);
            }

            const user = await getUserById(userId);

            if (!user) {
                throw new ApiError("User not found", 404);
            }

            res.json({ message: "Profile retrieved successfully", data: user });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * PUT /api/users/profile
 * Updates the profile of the currently logged in user.
 */
router.put(
    "/profile",
    verifyToken,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                throw new ApiError("Authentication required", 401);
            }

            const { fullName, gender, address, dateOfBirth } = req.body as {
                fullName?: string | null;
                gender?: string | null;
                address?: string | null;
                dateOfBirth?: string | null;
            };

            const parsedDob = dateOfBirth ? new Date(dateOfBirth) : null;

            const updatedUser = await updateUserProfile(userId, {
                fullName,
                gender,
                address,
                dateOfBirth: parsedDob,
            });

            res.json({ message: "Profile updated successfully", data: updatedUser });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * PUT /api/users/change-password
 * Changes the password of the currently logged in user.
 */
router.put(
    "/change-password",
    verifyToken,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                throw new ApiError("Authentication required", 401);
            }

            const { oldPassword, newPassword } = req.body as {
                oldPassword?: string;
                newPassword?: string;
            };

            if (!oldPassword || !newPassword) {
                throw new ApiError("Old password and new password are required", 400);
            }

            if (newPassword.length < 6) {
                throw new ApiError("New password must be at least 6 characters", 400);
            }

            await changeUserPassword(userId, oldPassword, newPassword);

            res.json({ message: "Password updated successfully" });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/users/upload-avatar
 * Uploads a profile avatar for the currently logged in user.
 */
router.post(
    "/upload-avatar",
    verifyToken,
    uploadAvatar.single("avatar"),
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                throw new ApiError("Authentication required", 401);
            }

            if (!req.file) {
                throw new ApiError("Please upload an image file", 400);
            }

            // Path to be saved in DB and served statically
            const relativePath = `/public/uploads/avatars/${req.file.filename}`;

            const updatedUser = await updateUserAvatar(userId, relativePath);

            res.json({
                message: "Avatar uploaded successfully",
                data: updatedUser,
            });
        } catch (error) {
            next(error);
        }
    }
);



/**
 * GET /api/users/:id
 * Returns a single user by ID. Requires authentication.
 * ADMIN can view any user; USER/DOCTOR can only view themselves.
 */
router.get(
    "/:id",
    verifyToken,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const requestingUser = req.user;

            if (!requestingUser) {
                throw new ApiError("Authentication required", 401);
            }

            // Non-admins can only view their own profile
            if (requestingUser.role !== Role.ADMIN && requestingUser.userId !== id) {
                throw new ApiError("Access denied. You can only view your own profile.", 403);
            }

            const user = await getUserById(id as string);

            if (!user) {
                throw new ApiError("User not found", 404);
            }

            res.json({ message: "User retrieved successfully", data: user });
        } catch (error) {
            next(error);
        }
    }
);

export default router;