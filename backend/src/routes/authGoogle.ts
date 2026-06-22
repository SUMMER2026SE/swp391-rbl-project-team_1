import { Router } from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is required");
}

// GET /api/auth/google
router.get(
    "/api/auth/google",
    (req, res, next) => {
        const state = crypto.randomBytes(16).toString("hex");
        res.cookie("oauth_state", state, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 10 * 60 * 1000, // 10 minutes
            sameSite: "lax",
            path: "/"
        });
        passport.authenticate("google", { scope: ["profile", "email"], session: false, state })(req, res, next);
    }
);

// GET /api/auth/google/callback
router.get(
    "/api/auth/google/callback",
    (req, res, next) => {
        // CSRF Verification
        const cookieHeader = req.headers.cookie || "";
        const match = cookieHeader.match(/(?:^|;\s*)oauth_state=([^;]+)/);
        const cookieState = match ? decodeURIComponent(match[1]) : null;
        const queryState = req.query.state;

        if (!cookieState || !queryState || cookieState !== queryState) {
            console.error("CSRF Validation failed: State mismatch");
            return res.redirect(`${CLIENT_URL}/login?error=google_failed`);
        }
        res.clearCookie("oauth_state");
        next();
    },
    (req, res, next) => {
        passport.authenticate("google", { session: false }, (err, user, info) => {
            if (err || !user) {
                console.error("Google Auth Error:", err || info);
                return res.redirect(`${CLIENT_URL}/login?error=google_failed`);
            }
            req.user = user;
            next();
        })(req, res, next);
    },
    (req, res) => {
        // req.user is guaranteed to be defined and implements Express.User (AuthTokenPayload)
        const user = req.user!;

        // JWT payload structure: { userId, role }
        const payload = {
            userId: user.userId,
            role: user.role,
        };

        // JWT expiry: 7d
        const token = jwt.sign(payload, JWT_SECRET, {
            expiresIn: "7d",
        });

        res.cookie("token", token, {
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/"
        });

        res.redirect(`${CLIENT_URL}/auth/callback`);
    }
);

export default router;
