import { Role } from "@prisma/client";

/**
 * Safe User DTO — omits password field.
 * Used in all API responses to prevent password leakage.
 */
export interface UserSafeDto {
    id: string;
    email: string;
    role: Role;
    doctorId: string | null;
    fullName: string | null;
    avatar: string | null;
    gender: string | null;
    address: string | null;
    dateOfBirth: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Minimal User info for embedding in other responses (e.g. Appointment).
 */
export interface UserEmbedDto {
    id: string;
    email: string;
    role: Role;
}

/**
 * Admin user list item.
 */
export interface AdminUserDto {
    id: string;
    email: string;
    role: Role;
    doctorId: string | null;
    createdAt: Date;
}
