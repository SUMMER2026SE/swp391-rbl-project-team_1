"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const client_1 = __importDefault(require("../prisma/client"));
const client_2 = require("@prisma/client");
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.warn("WARNING: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET environment variable is missing.");
}
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: GOOGLE_CLIENT_ID || "GOOGLE_CLIENT_ID_PLACEHOLDER",
    clientSecret: GOOGLE_CLIENT_SECRET || "GOOGLE_CLIENT_SECRET_PLACEHOLDER",
    callbackURL: "/api/auth/google/callback",
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails?.[0]?.value?.toLowerCase();
        if (!email) {
            return done(new Error("No email found in Google profile"), undefined);
        }
        const name = profile.displayName || `${profile.name?.givenName || ""} ${profile.name?.familyName || ""}`.trim() || "Google User";
        const avatar = profile.photos?.[0]?.value || "";
        // Find user by email
        let user = await client_1.default.user.findUnique({
            where: { email },
        });
        if (user) {
            // Update profile fields if they are missing in the database
            const dataToUpdate = {};
            if (!user.fullName && name)
                dataToUpdate.fullName = name;
            if (!user.avatar && avatar)
                dataToUpdate.avatar = avatar;
            if (Object.keys(dataToUpdate).length > 0) {
                user = await client_1.default.user.update({
                    where: { id: user.id },
                    data: dataToUpdate,
                });
            }
        }
        else {
            // Register new user with Google details (password is nullable in schema)
            user = await client_1.default.user.create({
                data: {
                    email,
                    password: null,
                    fullName: name,
                    avatar,
                    role: client_2.Role.USER,
                },
            });
        }
        // Map to AuthTokenPayload for JWT token generation on callback
        const expressUser = {
            userId: user.id,
            role: user.role,
        };
        return done(null, expressUser);
    }
    catch (error) {
        return done(error, undefined);
    }
}));
exports.default = passport_1.default;
