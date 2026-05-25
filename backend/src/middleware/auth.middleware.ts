import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload, TokenExpiredError, JsonWebTokenError } from "jsonwebtoken";

import { ApiError } from "../utils/apiError";
import { AuthTokenPayload } from "../services/auth.service";

export interface AuthenticatedRequest extends Request {
    user?: AuthTokenPayload;
}

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
    throw new Error("JWT_SECRET environment variable is required");
}

/**
 * Middleware: Verifies Bearer JWT token and attaches payload to req.user.
 * Returns 401 for missing/invalid tokens, 401 for expired tokens.
 */
export function verifyToken(
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
): void {
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
        next(new ApiError("Authorization header is missing or malformed", 401));
        return;
    }

    const token = authorizationHeader.slice(7).trim();

    if (!token) {
        next(new ApiError("Token is empty", 401));
        return;
    }

    try {
        const decoded = jwt.verify(token, jwtSecret as string);

        if (typeof decoded !== "object" || decoded === null) {
            throw new ApiError("Invalid token payload", 401);
        }

        const payload = decoded as JwtPayload;
        const { userId, role } = payload;

        if (typeof userId !== "string" || typeof role !== "string") {
            throw new ApiError("Invalid token payload structure", 401);
        }

        req.user = {
            userId,
            role: role as AuthTokenPayload["role"],
            iat: payload.iat,
            exp: payload.exp,
        };

        next();
    } catch (error) {
        if (error instanceof TokenExpiredError) {
            next(new ApiError("Token has expired", 401));
            return;
        }
        if (error instanceof JsonWebTokenError) {
            next(new ApiError("Invalid token", 401));
            return;
        }
        next(new ApiError("Unauthorized access", 401, error));
    }
}
