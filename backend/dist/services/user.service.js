"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUsers = getAllUsers;
exports.getUserById = getUserById;
exports.updateUserRole = updateUserRole;
exports.deleteUser = deleteUser;
const client_1 = require("@prisma/client");
const client_2 = __importDefault(require("../prisma/client"));
const apiError_1 = require("../utils/apiError");
/**
 * Returns all users (without password) for admin listing.
 */
async function getAllUsers() {
    return client_2.default.user.findMany({
        select: {
            id: true,
            email: true,
            role: true,
            doctorId: true,
            createdAt: true,
        },
        orderBy: { createdAt: "desc" },
    });
}
/**
 * Returns a single user by ID (without password).
 */
async function getUserById(id) {
    return client_2.default.user.findUnique({
        where: { id },
        select: {
            id: true,
            email: true,
            role: true,
            doctorId: true,
            createdAt: true,
            updatedAt: true,
        },
    });
}
/**
 * Updates a user's role. Prevents demoting the last ADMIN.
 */
async function updateUserRole(id, role) {
    const user = await client_2.default.user.findUnique({ where: { id } });
    if (!user) {
        throw new apiError_1.ApiError("User not found", 404);
    }
    // Prevent removing the last admin
    if (user.role === client_1.Role.ADMIN && role !== client_1.Role.ADMIN) {
        const adminCount = await client_2.default.user.count({ where: { role: client_1.Role.ADMIN } });
        if (adminCount <= 1) {
            throw new apiError_1.ApiError("Cannot demote the last admin user", 400);
        }
    }
    return client_2.default.user.update({
        where: { id },
        data: { role },
        select: {
            id: true,
            email: true,
            role: true,
            doctorId: true,
            createdAt: true,
            updatedAt: true,
        },
    });
}
/**
 * Soft-deletes a user. Prevents deleting ADMIN accounts.
 */
async function deleteUser(id) {
    const user = await client_2.default.user.findUnique({ where: { id } });
    if (!user) {
        throw new apiError_1.ApiError("User not found", 404);
    }
    if (user.role === client_1.Role.ADMIN) {
        throw new apiError_1.ApiError("Cannot delete admin users", 403);
    }
    await client_2.default.user.delete({ where: { id } });
}
