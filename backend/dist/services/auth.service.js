"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUser = registerUser;
exports.authenticateUser = authenticateUser;
exports.findUserById = findUserById;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const client_2 = __importDefault(require("../prisma/client"));
const apiError_1 = require("../utils/apiError");
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is required");
}
async function registerUser(phone, password) {
    const existingUser = await client_2.default.user.findUnique({
        where: { phone },
    });
    if (existingUser) {
        throw new apiError_1.ApiError("Phone already registered", 409);
    }
    const hashedPassword = await bcrypt_1.default.hash(password, 12);
    const user = await client_2.default.user.create({
        data: {
            phone,
            password: hashedPassword,
            role: client_1.Role.USER,
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
async function authenticateUser(phone, password) {
    const user = await client_2.default.user.findUnique({
        where: { phone },
    });
    if (!user) {
        // Avoid user enumeration — same error for "not found" and "wrong password"
        throw new apiError_1.ApiError("Invalid credentials", 401);
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
    return client_2.default.user.findUnique({
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
