"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyGoogleIdToken = verifyGoogleIdToken;
const google_auth_library_1 = require("google-auth-library");
const apiError_1 = require("./apiError");
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
if (!GOOGLE_CLIENT_ID) {
    console.warn("WARNING: GOOGLE_CLIENT_ID is not set. Google ID token verification will fail.");
}
const client = new google_auth_library_1.OAuth2Client(GOOGLE_CLIENT_ID);
/**
 * Verifies a Google ID token using google-auth-library and validates audience (aud).
 */
async function verifyGoogleIdToken(idToken) {
    if (!GOOGLE_CLIENT_ID) {
        throw new apiError_1.ApiError("Google OAuth is not configured on the server", 500);
    }
    try {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload) {
            throw new apiError_1.ApiError("Invalid Google ID Token", 401);
        }
        if (payload.aud !== GOOGLE_CLIENT_ID) {
            throw new apiError_1.ApiError("Google token audience mismatch", 401);
        }
        if (!payload.email) {
            throw new apiError_1.ApiError("Google login failed: email not provided", 400);
        }
        const emailVerified = payload.email_verified === true;
        if (!emailVerified) {
            throw new apiError_1.ApiError("Google email is not verified", 400);
        }
        return {
            email: payload.email.toLowerCase(),
            emailVerified: true,
            name: payload.name,
            picture: payload.picture,
        };
    }
    catch (error) {
        if (error instanceof apiError_1.ApiError) {
            throw error;
        }
        console.error("Google ID token verification failed:", error);
        throw new apiError_1.ApiError("Invalid Google ID Token", 401);
    }
}
