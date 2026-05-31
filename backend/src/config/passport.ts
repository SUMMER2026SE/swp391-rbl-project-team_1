import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import prisma from "../prisma/client";
import { Role } from "@prisma/client";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.warn("WARNING: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET environment variable is missing.");
}

passport.use(
    new GoogleStrategy(
        {
            clientID: GOOGLE_CLIENT_ID || "GOOGLE_CLIENT_ID_PLACEHOLDER",
            clientSecret: GOOGLE_CLIENT_SECRET || "GOOGLE_CLIENT_SECRET_PLACEHOLDER",
            callbackURL: "/api/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails?.[0]?.value?.toLowerCase();
                if (!email) {
                    return done(new Error("No email found in Google profile"), undefined);
                }

                const name = profile.displayName || `${profile.name?.givenName || ""} ${profile.name?.familyName || ""}`.trim() || "Google User";
                const avatar = profile.photos?.[0]?.value || "";

                // Find user by email
                let user = await prisma.user.findUnique({
                    where: { email },
                });

                if (user) {
                    // Update profile fields if they are missing in the database
                    const dataToUpdate: { fullName?: string; avatar?: string } = {};
                    if (!user.fullName && name) dataToUpdate.fullName = name;
                    if (!user.avatar && avatar) dataToUpdate.avatar = avatar;

                    if (Object.keys(dataToUpdate).length > 0) {
                        user = await prisma.user.update({
                            where: { id: user.id },
                            data: dataToUpdate,
                        });
                    }
                } else {
                    // Register new user with Google details (password is nullable in schema)
                    user = await prisma.user.create({
                        data: {
                            email,
                            password: null,
                            fullName: name,
                            avatar,
                            role: Role.USER,
                        },
                    });
                }

                // Map to AuthTokenPayload for JWT token generation on callback
                const expressUser = {
                    userId: user.id,
                    role: user.role,
                };
                return done(null, expressUser);
            } catch (error) {
                return done(error, undefined);
            }
        }
    )
);

export default passport;
