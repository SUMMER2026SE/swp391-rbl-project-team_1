"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUsers = getAllUsers;
exports.getUserById = getUserById;
exports.updateUserRole = updateUserRole;
exports.deleteUser = deleteUser;
exports.updateUserProfile = updateUserProfile;
exports.changeUserPassword = changeUserPassword;
exports.updateUserAvatar = updateUserAvatar;
const bcrypt_1 = __importDefault(require("bcrypt"));
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
            fullName: true,
            avatar: true,
            gender: true,
            address: true,
            dateOfBirth: true,
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
            fullName: true,
            avatar: true,
            gender: true,
            address: true,
            dateOfBirth: true,
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
/**
 * Updates a user's profile details.
 */
async function updateUserProfile(id, data) {
    const user = await client_2.default.user.findUnique({ where: { id } });
    if (!user) {
        throw new apiError_1.ApiError("User not found", 404);
    }
    return client_2.default.user.update({
        where: { id },
        data: {
            fullName: data.fullName !== undefined ? data.fullName : user.fullName,
            gender: data.gender !== undefined ? data.gender : user.gender,
            address: data.address !== undefined ? data.address : user.address,
            dateOfBirth: data.dateOfBirth !== undefined ? data.dateOfBirth : user.dateOfBirth,
        },
        select: {
            id: true,
            email: true,
            role: true,
            doctorId: true,
            fullName: true,
            avatar: true,
            gender: true,
            address: true,
            dateOfBirth: true,
            createdAt: true,
            updatedAt: true,
        },
    });
}
/**
 * Changes a user's password after verifying the old password.
 */
async function changeUserPassword(id, oldPassword, newPassword) {
    if (!oldPassword || !newPassword) {
        throw new apiError_1.ApiError("Old password and new password are required", 400);
    }
    const user = await client_2.default.user.findUnique({ where: { id } });
    if (!user) {
        throw new apiError_1.ApiError("User not found", 404);
    }
    // Verify old password (if password is set)
    if (user.password) {
        const isPasswordValid = await bcrypt_1.default.compare(oldPassword, user.password);
        if (!isPasswordValid) {
            throw new apiError_1.ApiError("Incorrect current password", 400);
        }
    }
    // Hash new password
    const hashedPassword = await bcrypt_1.default.hash(newPassword, 12);
    await client_2.default.user.update({
        where: { id },
        data: { password: hashedPassword },
    });
}
/**
 * Updates a user's avatar path.
 */
async function updateUserAvatar(id, avatarPath) {
    const user = await client_2.default.user.findUnique({ where: { id } });
    if (!user) {
        throw new apiError_1.ApiError("User not found", 404);
    }
    return client_2.default.user.update({
        where: { id },
        data: { avatar: avatarPath },
        select: {
            id: true,
            email: true,
            role: true,
            doctorId: true,
            fullName: true,
            avatar: true,
            gender: true,
            address: true,
            dateOfBirth: true,
            createdAt: true,
            updatedAt: true,
        },
    });
}
