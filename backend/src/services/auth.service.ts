import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User, Role } from "@prisma/client";

import prisma from "../prisma/client";
import { ApiError } from "../utils/apiError";
import { generateOtp, sendOtpEmail } from "../utils/emailService";

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
            createdAt: true,
            updatedAt: true,
        },
    });
    return user;
}
