import { HealthProfile } from "@prisma/client";
import prisma from "../prisma/client";
import { ApiError } from "../utils/apiError";

export interface HealthProfileInput {
    chronicConditions?: string | null;
    allergies?: string | null;
    medications?: string | null;
    familyHistory?: string | null;
    bloodType?: string | null;
    notes?: string | null;
}

export async function getHealthProfile(userId: string): Promise<HealthProfile | null> {
    return prisma.healthProfile.findUnique({ where: { userId } });
}

export async function upsertHealthProfile(
    userId: string,
    input: HealthProfileInput
): Promise<HealthProfile> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new ApiError("User not found", 404);
    }

    return prisma.healthProfile.upsert({
        where: { userId },
        create: { userId, ...input },
        update: { ...input },
    });
}
