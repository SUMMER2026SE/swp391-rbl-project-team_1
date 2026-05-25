"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = verifyToken;
const jsonwebtoken_1 = __importStar(require("jsonwebtoken"));
const apiError_1 = require("../utils/apiError");
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
    throw new Error("JWT_SECRET environment variable is required");
}
/**
 * Middleware: Verifies Bearer JWT token and attaches payload to req.user.
 * Returns 401 for missing/invalid tokens, 401 for expired tokens.
 */
function verifyToken(req, _res, next) {
    const authorizationHeader = req.headers.authorization;
    if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
        next(new apiError_1.ApiError("Authorization header is missing or malformed", 401));
        return;
    }
    const token = authorizationHeader.slice(7).trim();
    if (!token) {
        next(new apiError_1.ApiError("Token is empty", 401));
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        if (typeof decoded !== "object" || decoded === null) {
            throw new apiError_1.ApiError("Invalid token payload", 401);
        }
        const payload = decoded;
        const { userId, role } = payload;
        if (typeof userId !== "string" || typeof role !== "string") {
            throw new apiError_1.ApiError("Invalid token payload structure", 401);
        }
        req.user = {
            userId,
            role: role,
            iat: payload.iat,
            exp: payload.exp,
        };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.TokenExpiredError) {
            next(new apiError_1.ApiError("Token has expired", 401));
            return;
        }
        if (error instanceof jsonwebtoken_1.JsonWebTokenError) {
            next(new apiError_1.ApiError("Invalid token", 401));
            return;
        }
        next(new apiError_1.ApiError("Unauthorized access", 401, error));
    }
}
