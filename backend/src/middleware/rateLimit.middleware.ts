import rateLimit from "express-rate-limit";

/** Limit OTP requests: 5 per 15 minutes per IP */
export const sendOtpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many OTP requests. Please try again later." },
});

/** Limit login attempts: 10 per 15 minutes per IP */
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many login attempts. Please try again later." },
});
