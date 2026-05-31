import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { getHealthProfile, upsertHealthProfile } from "../services/health-profile.service";
import { ApiError } from "../utils/apiError";

export async function getMyHealthProfile(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.userId;
        if (!userId) throw new ApiError("Authentication required", 401);

        const profile = await getHealthProfile(userId);
        res.json({ message: "Health profile retrieved", data: profile });
    } catch (error) {
        next(error);
    }
}

export async function updateMyHealthProfile(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.userId;
        if (!userId) throw new ApiError("Authentication required", 401);

        const { chronicConditions, allergies, medications, familyHistory, bloodType, notes } =
            req.body as {
                chronicConditions?: string | null;
                allergies?: string | null;
                medications?: string | null;
                familyHistory?: string | null;
                bloodType?: string | null;
                notes?: string | null;
            };

        const profile = await upsertHealthProfile(userId, {
            chronicConditions,
            allergies,
            medications,
            familyHistory,
            bloodType,
            notes,
        });

        res.json({ message: "Health profile updated", data: profile });
    } catch (error) {
        next(error);
    }
}
