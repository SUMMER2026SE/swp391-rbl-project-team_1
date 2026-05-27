"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOtpToEmail = sendOtpToEmail;
exports.verifyOtp = verifyOtp;
exports.registerUser = registerUser;
exports.authenticateUser = authenticateUser;
exports.findUserById = findUserById;
exports.sendResetOtpToEmail = sendResetOtpToEmail;
exports.verifyResetOtp = verifyResetOtp;
exports.resetPassword = resetPassword;
exports.googleLogin = googleLogin;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const axios_1 = __importDefault(require("axios"));
const client_1 = require("@prisma/client");
const client_2 = __importDefault(require("../prisma/client"));
const apiError_1 = require("../utils/apiError");
const emailService_1 = require("../utils/emailService");
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is required");
}
/**
 * Step 1: Send OTP to email
 */
async function sendOtpToEmail(email) {
    const normalizedEmail = email.toLowerCase();
    // Check if email already registered in User table
    const existingUser = await client_2.default.user.findUnique({
        where: { email: normalizedEmail },
    });
    if (existingUser) {
        throw new apiError_1.ApiError("Email already registered", 409);
    }
    // Generate OTP (6 digits)
    const otp = (0, emailService_1.generateOtp)();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    // Clear old OTPs for this email to avoid clutter
    await client_2.default.oTP.deleteMany({
        where: { email: normalizedEmail },
    });
    // Save OTP to database
    await client_2.default.oTP.create({
        data: {
            email: normalizedEmail,
            code: otp,
            expiresAt: otpExpiresAt,
            verified: false,
        },
    });
    // Send OTP via email
    await (0, emailService_1.sendOtpEmail)(normalizedEmail, otp);
}
/**
 * Step 2: Verify OTP
 */
async function verifyOtp(email, otp) {
    const normalizedEmail = email.toLowerCase();
    const otpRecord = await client_2.default.oTP.findFirst({
        where: { email: normalizedEmail },
        orderBy: { createdAt: "desc" },
    });
    if (!otpRecord) {
        throw new apiError_1.ApiError("No OTP requested for this email", 400);
    }
    if (otpRecord.code !== otp) {
        throw new apiError_1.ApiError("Invalid OTP code", 400);
    }
    if (new Date() > otpRecord.expiresAt) {
        throw new apiError_1.ApiError("OTP has expired", 400);
    }
    // Set OTP to verified
    await client_2.default.oTP.update({
        where: { id: otpRecord.id },
        data: { verified: true },
    });
    return { isValid: true };
}
/**
 * Step 3: Complete registration with password (save user to database)
 */
async function registerUser(email, password, otp) {
    const normalizedEmail = email.toLowerCase();
    // 1. Verify email is not registered
    const existingUser = await client_2.default.user.findUnique({
        where: { email: normalizedEmail },
    });
    if (existingUser) {
        throw new apiError_1.ApiError("Email already registered", 409);
    }
    // 2. Verify there is a verified OTP for this email
    const verifiedOtp = await client_2.default.oTP.findFirst({
        where: {
            email: normalizedEmail,
            verified: true,
            expiresAt: { gt: new Date() }, // OTP must not be expired
        },
        orderBy: { createdAt: "desc" },
    });
    if (!verifiedOtp || verifiedOtp.code !== otp) {
        throw new apiError_1.ApiError("OTP not verified or verification has expired. Please verify OTP first.", 400);
    }
    // 3. Hash password
    const hashedPassword = await bcrypt_1.default.hash(password, 12);
    // 4. Create real User record
    const user = await client_2.default.user.create({
        data: {
            email: normalizedEmail,
            password: hashedPassword,
            role: client_1.Role.USER,
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
    await client_2.default.oTP.deleteMany({
        where: { email: normalizedEmail },
    });
    return user;
}
/**
 * Login with email
 */
async function authenticateUser(email, password) {
    const normalizedEmail = email.toLowerCase();
    const user = await client_2.default.user.findUnique({
        where: { email: normalizedEmail },
    });
    if (!user) {
        throw new apiError_1.ApiError("Invalid credentials", 401);
    }
    if (!user.password) {
        throw new apiError_1.ApiError("This account is registered via Google. Please log in using Google.", 400);
    }
    const passwordMatches = await bcrypt_1.default.compare(password, user.password);
    if (!passwordMatches) {
        throw new apiError_1.ApiError("Invalid credentials", 401);
    }
    const payload = {
        userId: user.id,
        role: user.role,
    };
    const token = jsonwebtoken_1.default.sign(payload, JWT_SECRET, {
        expiresIn: "7d",
    });
    const { password: _password, ...safeUser } = user;
    return { token, user: safeUser };
}
async function findUserById(id) {
    const user = await client_2.default.user.findUnique({
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
async function sendResetOtpToEmail(email) {
    const normalizedEmail = email.toLowerCase();
    // Check if email exists in User table
    const existingUser = await client_2.default.user.findUnique({
        where: { email: normalizedEmail },
    });
    if (!existingUser) {
        throw new apiError_1.ApiError("Email not found in our database", 404);
    }
    // Generate OTP (6 digits)
    const otp = (0, emailService_1.generateOtp)();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    // Clear old OTPs for this email to avoid clutter
    await client_2.default.oTP.deleteMany({
        where: { email: normalizedEmail },
    });
    // Save OTP to database
    await client_2.default.oTP.create({
        data: {
            email: normalizedEmail,
            code: otp,
            expiresAt: otpExpiresAt,
            verified: false,
        },
    });
    // Send OTP via email
    await (0, emailService_1.sendResetPasswordOtpEmail)(normalizedEmail, otp);
}
/**
 * Verify OTP for password reset flow
 */
async function verifyResetOtp(email, otp) {
    const normalizedEmail = email.toLowerCase();
    const otpRecord = await client_2.default.oTP.findFirst({
        where: { email: normalizedEmail },
        orderBy: { createdAt: "desc" },
    });
    if (!otpRecord) {
        throw new apiError_1.ApiError("No OTP requested for this email", 400);
    }
    if (otpRecord.code !== otp) {
        throw new apiError_1.ApiError("Invalid OTP code", 400);
    }
    if (new Date() > otpRecord.expiresAt) {
        throw new apiError_1.ApiError("OTP has expired", 400);
    }
    // Set OTP to verified
    await client_2.default.oTP.update({
        where: { id: otpRecord.id },
        data: { verified: true },
    });
    return { isValid: true };
}
/**
 * Reset password using email, OTP and new password
 */
async function resetPassword(email, otp, newPassword) {
    const normalizedEmail = email.toLowerCase();
    // 1. Verify user exists
    const user = await client_2.default.user.findUnique({
        where: { email: normalizedEmail },
    });
    if (!user) {
        throw new apiError_1.ApiError("Email not found in our database", 404);
    }
    // 2. Verify there is a verified OTP for this email
    const verifiedOtp = await client_2.default.oTP.findFirst({
        where: {
            email: normalizedEmail,
            verified: true,
            expiresAt: { gt: new Date() }, // OTP must not be expired
        },
        orderBy: { createdAt: "desc" },
    });
    if (!verifiedOtp || verifiedOtp.code !== otp) {
        throw new apiError_1.ApiError("OTP not verified or verification has expired. Please verify OTP first.", 400);
    }
    // 3. Hash new password
    const hashedPassword = await bcrypt_1.default.hash(newPassword, 12);
    // 4. Update User password
    await client_2.default.user.update({
        where: { email: normalizedEmail },
        data: { password: hashedPassword },
    });
    // 5. Delete OTP records for this email
    await client_2.default.oTP.deleteMany({
        where: { email: normalizedEmail },
    });
}
/**
 * Verifies Google ID token and logs in the user (registers if first time)
 */
async function googleLogin(idToken) {
    try {
        // Verify token with Google API
        const response = await axios_1.default.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
        const payload = response.data;
        if (!payload.email) {
            throw new apiError_1.ApiError("Google login failed: Email not provided in token", 400);
        }
        const normalizedEmail = payload.email.toLowerCase();
        // Find or create user
        let user = await client_2.default.user.findUnique({
            where: { email: normalizedEmail },
        });
        if (!user) {
            // Register new user with Google details
            user = await client_2.default.user.create({
                data: {
                    email: normalizedEmail,
                    password: null, // Nullable password for Google login
                    fullName: payload.name || null,
                    avatar: payload.picture || null,
                    role: client_1.Role.USER,
                },
            });
        }
        else {
            // Update profile fields if they are missing
            const dataToUpdate = {};
            if (!user.fullName && payload.name)
                dataToUpdate.fullName = payload.name;
            if (!user.avatar && payload.picture)
                dataToUpdate.avatar = payload.picture;
            if (Object.keys(dataToUpdate).length > 0) {
                user = await client_2.default.user.update({
                    where: { id: user.id },
                    data: dataToUpdate,
                });
            }
        }
        // Generate JWT token
        const tokenPayload = {
            userId: user.id,
            role: user.role,
        };
        const token = jsonwebtoken_1.default.sign(tokenPayload, JWT_SECRET, {
            expiresIn: "7d",
        });
        const { password: _password, ...safeUser } = user;
        return { token, user: safeUser };
    }
    catch (error) {
        if (error instanceof apiError_1.ApiError) {
            throw error;
        }
        console.error("Google authentication error:", error);
        throw new apiError_1.ApiError("Invalid Google ID Token or network error", 401);
    }
}
