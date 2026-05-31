import { AuthTokenPayload } from "../services/auth.service";

declare global {
    namespace Express {
        // Express.User is identical to AuthTokenPayload.
        // Since the user object returned by Passport verify callback is mapped to this type,
        // we extend Express.User to match it.
        interface User extends AuthTokenPayload {}
    }
}
