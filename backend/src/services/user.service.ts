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
            phone: true,
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
            phone: true,
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
            phone: true,
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
