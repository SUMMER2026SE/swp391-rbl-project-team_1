"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = authorizeRoles;
exports.verifyAdmin = verifyAdmin;
const client_1 = require("@prisma/client");
const apiError_1 = require("../utils/apiError");
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
function authorizeRoles(...allowedRoles) {
    return (req, _res, next) => {
        if (!req.user) {
            next(new apiError_1.ApiError("User not authenticated", 401));
            return;
        }
        const userRole = req.user.role;
        if (!allowedRoles.includes(userRole)) {
            next(new apiError_1.ApiError(`Access denied. Required role(s): ${allowedRoles.join(", ")}. Your role: ${userRole}`, 403));
            return;
        }
        next();
    };
}
/**
 * Middleware: Enforces that the authenticated user is an ADMIN.
 * Must be used AFTER verifyToken middleware.
 */
function verifyAdmin(req, _res, next) {
    if (!req.user) {
        next(new apiError_1.ApiError("User not authenticated", 401));
        return;
    }
    if (req.user.role !== client_1.Role.ADMIN) {
        next(new apiError_1.ApiError(`Access denied. Required role: ADMIN. Your role: ${req.user.role}`, 403));
        return;
    }
    next();
}
