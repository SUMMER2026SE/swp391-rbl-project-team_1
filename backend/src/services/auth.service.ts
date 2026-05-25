import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User, Role } from "@prisma/client";

import prisma from "../prisma/client";
import { ApiError } from "../utils/apiError";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is required");
}

/**
 * JWT token payload structure.
 * Note: userId maps to User.id (UUID), not Doctor.id.
 */
export interface AuthTokenPayload {
    userId: string;
    role: Role;
    iat?: number;
    exp?: number;
}

export interface RegisterResult {
    id: string;
    phone: string;
    role: Role;
    doctorId: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface AuthResult {
    token: string;
    user: Omit<User, "password">;
}

export async function registerUser(phone: string, password: string): Promise<RegisterResult> {
    const existingUser = await prisma.user.findUnique({
        where: { phone },
    });

    if (existingUser) {
        throw new ApiError("Phone already registered", 409);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
        data: {
            phone,
            password: hashedPassword,
            role: Role.USER,
        },
        select: {
            id: true,
            phone: true,
            role: true,
            doctorId: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    return user;
}

export async function authenticateUser(phone: string, password: string): Promise<AuthResult> {
    const user = await prisma.user.findUnique({
        where: { phone },
    });

    if (!user) {
        // Avoid user enumeration — same error for "not found" and "wrong password"
        throw new ApiError("Invalid credentials", 401);
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
        throw new ApiError("Invalid credentials", 401);
    }

    const payload: AuthTokenPayload = {
        userId: user.id,
        role: user.role,
    };

    const token = jwt.sign(payload, JWT_SECRET as string, {
        expiresIn: "7d",
    });

    const { password: _password, ...safeUser } = user;

    return { token, user: safeUser };
}

export async function findUserById(id: string): Promise<Omit<User, "password"> | null> {
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
