import { OAuth2Client } from "google-auth-library";
import { ApiError } from "./apiError";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

if (!GOOGLE_CLIENT_ID) {
    console.warn("WARNING: GOOGLE_CLIENT_ID is not set. Google ID token verification will fail.");
}

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

export interface GoogleTokenPayload {
    email: string;
    emailVerified: boolean;
    name?: string;
    picture?: string;
}

/**
 * Verifies a Google ID token using google-auth-library and validates audience (aud).
 */
export async function verifyGoogleIdToken(idToken: string): Promise<GoogleTokenPayload> {
    if (!GOOGLE_CLIENT_ID) {
        throw new ApiError("Google OAuth is not configured on the server", 500);
    }

    try {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();

        if (!payload) {
            throw new ApiError("Invalid Google ID Token", 401);
        }

        if (payload.aud !== GOOGLE_CLIENT_ID) {
            throw new ApiError("Google token audience mismatch", 401);
        }

        if (!payload.email) {
            throw new ApiError("Google login failed: email not provided", 400);
        }

        const emailVerified = payload.email_verified === true;

        if (!emailVerified) {
            throw new ApiError("Google email is not verified", 400);
        }

        return {
            email: payload.email.toLowerCase(),
            emailVerified: true,
            name: payload.name,
            picture: payload.picture,
        };
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        console.error("Google ID token verification failed:", error);
        throw new ApiError("Invalid Google ID Token", 401);
    }
}
