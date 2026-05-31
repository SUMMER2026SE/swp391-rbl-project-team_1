import { Router } from "express";
import passport from "passport";
import jwt from "jsonwebtoken";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is required");
}

// GET /api/auth/google
router.get(
    "/api/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

// GET /api/auth/google/callback
router.get(
    "/api/auth/google/callback",
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

        res.redirect(`${CLIENT_URL}/auth/callback?token=${token}`);
    }
);

export default router;
