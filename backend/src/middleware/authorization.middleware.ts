import { NextFunction, Response } from "express";
import { Role } from "@prisma/client";

import { AuthenticatedRequest } from "./auth.middleware";
import { ApiError } from "../utils/apiError";

/**
 * Middleware: Authorizes request based on user role.
 * Must be used AFTER verifyToken middleware.
 *
 * @param allowedRoles - One or more Roles that are permitted to access the route
 * @returns Express middleware function
 *
 * @example
 * router.get("/admin/users", verifyToken, authorizeRoles(Role.ADMIN), getUsers);
 * router.post("/appointments", verifyToken, authorizeRoles(Role.USER), createAppointment);
 */
export function authorizeRoles(...allowedRoles: Role[]) {
    return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
        if (!req.user) {
            next(new ApiError("User not authenticated", 401));
            return;
        }

        const userRole = req.user.role as Role;

        if (!allowedRoles.includes(userRole)) {
            next(
                new ApiError(
                    `Access denied. Required role(s): ${allowedRoles.join(", ")}. Your role: ${userRole}`,
                    403
                )
            );
            return;
        }

        next();
    };
}
