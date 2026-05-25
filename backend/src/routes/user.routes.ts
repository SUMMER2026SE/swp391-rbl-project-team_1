import { Router } from "express";
import { Role } from "@prisma/client";

import { verifyToken } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/authorization.middleware";
import { getUserById } from "../services/user.service";
import { ApiError } from "../utils/apiError";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { NextFunction, Response } from "express";

const router = Router();

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