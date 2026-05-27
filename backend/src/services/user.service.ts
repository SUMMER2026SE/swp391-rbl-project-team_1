import bcrypt from "bcrypt";
import { Role } from "@prisma/client";
import prisma from "../prisma/client";
import { ApiError } from "../utils/apiError";
import { AdminUserDto, UserSafeDto } from "../types/user.types";

/**
 * Returns all users (without password) for admin listing.
 */
export async function getAllUsers(): Promise<AdminUserDto[]> {
    return prisma.user.findMany({
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
export async function getUserById(id: string): Promise<UserSafeDto | null> {
    return prisma.user.findUnique({
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
export async function updateUserRole(id: string, role: Role): Promise<UserSafeDto> {
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
        throw new ApiError("User not found", 404);
    }

    // Prevent removing the last admin
    if (user.role === Role.ADMIN && role !== Role.ADMIN) {
        const adminCount = await prisma.user.count({ where: { role: Role.ADMIN } });
        if (adminCount <= 1) {
            throw new ApiError("Cannot demote the last admin user", 400);
        }
    }

    return prisma.user.update({
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
export async function deleteUser(id: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
        throw new ApiError("User not found", 404);
    }

    if (user.role === Role.ADMIN) {
        throw new ApiError("Cannot delete admin users", 403);
    }

    await prisma.user.delete({ where: { id } });
}

/**
 * Updates a user's profile details.
 */
export async function updateUserProfile(
    id: string,
    data: {
        fullName?: string | null;
        gender?: string | null;
        address?: string | null;
        dateOfBirth?: Date | null;
    }
): Promise<UserSafeDto> {
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
        throw new ApiError("User not found", 404);
    }

    return prisma.user.update({
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
export async function changeUserPassword(
    id: string,
    oldPassword?: string,
    newPassword?: string
): Promise<void> {
    if (!oldPassword || !newPassword) {
        throw new ApiError("Old password and new password are required", 400);
    }

    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
        throw new ApiError("User not found", 404);
    }

    // Verify old password (if password is set)
    if (user.password) {
        const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (!isPasswordValid) {
            throw new ApiError("Incorrect current password", 400);
        }
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
        where: { id },
        data: { password: hashedPassword },
    });
}

/**
 * Updates a user's avatar path.
 */
export async function updateUserAvatar(id: string, avatarPath: string): Promise<UserSafeDto> {
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
        throw new ApiError("User not found", 404);
    }

    return prisma.user.update({
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



