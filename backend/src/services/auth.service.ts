import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import axios from "axios";
import { User, Role } from "@prisma/client";

import prisma from "../prisma/client";
import { ApiError } from "../utils/apiError";
import { generateOtp, sendOtpEmail, sendResetPasswordOtpEmail } from "../utils/emailService";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is required");
}

export interface AuthTokenPayload {
    userId: string;
    role: Role;
    iat?: number;
    exp?: number;
}

export interface RegisterResult {
    id: string;
    email: string;
    role: Role;
    doctorId: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface AuthResult {
    token: string;
    user: Omit<User, "password">;
}

/**
 * Step 1: Send OTP to email
 */
export async function sendOtpToEmail(email: string): Promise<void> {
    const normalizedEmail = email.toLowerCase();

    // Check if email already registered in User table
    const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
    });

    if (existingUser) {
        throw new ApiError("Email already registered", 409);
    }

    // Generate OTP (6 digits)
    const otp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Clear old OTPs for this email to avoid clutter
    await prisma.oTP.deleteMany({
        where: { email: normalizedEmail },
    });

    // Save OTP to database
    await prisma.oTP.create({
        data: {
            email: normalizedEmail,
            code: otp,
            expiresAt: otpExpiresAt,
            verified: false,
        },
    });

    // Send OTP via email
    await sendOtpEmail(normalizedEmail, otp);
}

/**
 * Step 2: Verify OTP
 */
export async function verifyOtp(email: string, otp: string): Promise<{ isValid: boolean }> {
    const normalizedEmail = email.toLowerCase();

    const otpRecord = await prisma.oTP.findFirst({
        where: { email: normalizedEmail },
        orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
        throw new ApiError("No OTP requested for this email", 400);
    }

    if (otpRecord.code !== otp) {
        throw new ApiError("Invalid OTP code", 400);
    }

    if (new Date() > otpRecord.expiresAt) {
        throw new ApiError("OTP has expired", 400);
    }

    // Set OTP to verified
    await prisma.oTP.update({
        where: { id: otpRecord.id },
        data: { verified: true },
    });

    return { isValid: true };
}

/**
 * Step 3: Complete registration with password (save user to database)
 */
export async function registerUser(
    email: string,
    password: string,
    otp: string
): Promise<RegisterResult> {
    const normalizedEmail = email.toLowerCase();

    // 1. Verify email is not registered
    const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
    });

    if (existingUser) {
        throw new ApiError("Email already registered", 409);
    }

    // 2. Verify there is a verified OTP for this email
    const verifiedOtp = await prisma.oTP.findFirst({
        where: {
            email: normalizedEmail,
            verified: true,
            expiresAt: { gt: new Date() }, // OTP must not be expired
        },
        orderBy: { createdAt: "desc" },
    });

    if (!verifiedOtp || verifiedOtp.code !== otp) {
        throw new ApiError("OTP not verified or verification has expired. Please verify OTP first.", 400);
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 4. Create real User record
    const user = await prisma.user.create({
        data: {
            email: normalizedEmail,
            password: hashedPassword,
            role: Role.USER,
        },
        select: {
            id: true,
            email: true,
            role: true,
            doctorId: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    // 5. Delete OTP records for this email after registration is complete
    await prisma.oTP.deleteMany({
        where: { email: normalizedEmail },
    });

    return user;
}

/**
 * Login with email
 */
export async function authenticateUser(
    email: string,
    password: string
): Promise<AuthResult> {
    const normalizedEmail = email.toLowerCase();

    const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
    });

    if (!user) {
        throw new ApiError("Invalid credentials", 401);
    }

    if (!user.password) {
        throw new ApiError("This account is registered via Google. Please log in using Google.", 400);
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
    const user = await prisma.user.findUnique({
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
    return user;
}

/**
 * Send OTP to email for password reset (checks if user exists)
 */
export async function sendResetOtpToEmail(email: string): Promise<void> {
    const normalizedEmail = email.toLowerCase();

    // Check if email exists in User table
    const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
    });

    if (!existingUser) {
        throw new ApiError("Email not found in our database", 404);
    }

    // Generate OTP (6 digits)
    const otp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Clear old OTPs for this email to avoid clutter
    await prisma.oTP.deleteMany({
        where: { email: normalizedEmail },
    });

    // Save OTP to database
    await prisma.oTP.create({
        data: {
            email: normalizedEmail,
            code: otp,
            expiresAt: otpExpiresAt,
            verified: false,
        },
    });

    // Send OTP via email
    await sendResetPasswordOtpEmail(normalizedEmail, otp);
}

/**
 * Verify OTP for password reset flow
 */
export async function verifyResetOtp(email: string, otp: string): Promise<{ isValid: boolean }> {
    const normalizedEmail = email.toLowerCase();

    const otpRecord = await prisma.oTP.findFirst({
        where: { email: normalizedEmail },
        orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
        throw new ApiError("No OTP requested for this email", 400);
    }

    if (otpRecord.code !== otp) {
        throw new ApiError("Invalid OTP code", 400);
    }

    if (new Date() > otpRecord.expiresAt) {
        throw new ApiError("OTP has expired", 400);
    }

    // Set OTP to verified
    await prisma.oTP.update({
        where: { id: otpRecord.id },
        data: { verified: true },
    });

    return { isValid: true };
}

/**
 * Reset password using email, OTP and new password
 */
export async function resetPassword(
    email: string,
    otp: string,
    newPassword: string
): Promise<void> {
    const normalizedEmail = email.toLowerCase();

    // 1. Verify user exists
    const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
    });

    if (!user) {
        throw new ApiError("Email not found in our database", 404);
    }

    // 2. Verify there is a verified OTP for this email
    const verifiedOtp = await prisma.oTP.findFirst({
        where: {
            email: normalizedEmail,
            verified: true,
            expiresAt: { gt: new Date() }, // OTP must not be expired
        },
        orderBy: { createdAt: "desc" },
    });

    if (!verifiedOtp || verifiedOtp.code !== otp) {
        throw new ApiError("OTP not verified or verification has expired. Please verify OTP first.", 400);
    }

    // 3. Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // 4. Update User password
    await prisma.user.update({
        where: { email: normalizedEmail },
        data: { password: hashedPassword },
    });

    // 5. Delete OTP records for this email
    await prisma.oTP.deleteMany({
        where: { email: normalizedEmail },
    });
}

/**
 * Verifies Google ID token and logs in the user (registers if first time)
 */
export async function googleLogin(idToken: string): Promise<AuthResult> {
    try {
        // Verify token with Google API
        const response = await axios.get<{
            email?: string;
            email_verified?: string | boolean;
            name?: string;
            picture?: string;
            aud?: string;
        }>(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);

        const payload = response.data;

        if (!payload.email) {
            throw new ApiError("Google login failed: Email not provided in token", 400);
        }

        const normalizedEmail = payload.email.toLowerCase();

        // Find or create user
        let user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        if (!user) {
            // Register new user with Google details
            user = await prisma.user.create({
                data: {
                    email: normalizedEmail,
                    password: null, // Nullable password for Google login
                    fullName: payload.name || null,
                    avatar: payload.picture || null,
                    role: Role.USER,
                },
            });
        } else {
            // Update profile fields if they are missing
            const dataToUpdate: { fullName?: string; avatar?: string } = {};
            if (!user.fullName && payload.name) dataToUpdate.fullName = payload.name;
            if (!user.avatar && payload.picture) dataToUpdate.avatar = payload.picture;

            if (Object.keys(dataToUpdate).length > 0) {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: dataToUpdate,
                });
            }
        }

        // Generate JWT token
        const tokenPayload: AuthTokenPayload = {
            userId: user.id,
            role: user.role,
        };

        const token = jwt.sign(tokenPayload, JWT_SECRET as string, {
            expiresIn: "7d",
        });

        const { password: _password, ...safeUser } = user;

        return { token, user: safeUser };
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        console.error("Google authentication error:", error);
        throw new ApiError("Invalid Google ID Token or network error", 401);
    }
}


