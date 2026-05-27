import prisma from "../prisma/client";
import { DoctorStatus, Prisma } from "@prisma/client";
import { ApiError } from "../utils/apiError";

type DoctorWithRelations = Prisma.DoctorGetPayload<{
    include: {
        specialty: true;
        clinic: true;
        userAccount: {
            select: {
                id: true;
                email: true;
                fullName: true;
                role: true;
            };
        };
    };
}>;

type ModerationAction = "approve" | "reject" | "lock" | "unlock";

interface ModerationInput {
    action: ModerationAction;
    reason?: string;
}

/**
 * Returns all doctors with specialty, clinic, and userAccount relations.
 */
export async function getAllDoctors(): Promise<DoctorWithRelations[]> {
    return prisma.doctor.findMany({
        include: {
            specialty: true,
            clinic: true,
            userAccount: {
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    role: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
}

/**
 * Returns only pending doctors with relations.
 */
export async function getPendingDoctors(): Promise<DoctorWithRelations[]> {
    return prisma.doctor.findMany({
        where: { status: DoctorStatus.PENDING },
        include: {
            specialty: true,
            clinic: true,
            userAccount: {
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    role: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
}

/**
 * Moderates a doctor: approve, reject, lock, or unlock.
 */
export async function moderateDoctor(
    doctorId: string,
    input: ModerationInput
): Promise<DoctorWithRelations> {
    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });

    if (!doctor) {
        throw new ApiError("Doctor not found", 404);
    }

    const updateData: Prisma.DoctorUpdateInput = {};

    switch (input.action) {
        case "approve":
            if (doctor.status === DoctorStatus.APPROVED) {
                throw new ApiError("Doctor is already approved", 400);
            }
            updateData.status = DoctorStatus.APPROVED;
            updateData.rejectedReason = null;
            break;

        case "reject":
            if (!input.reason) {
                throw new ApiError("Reason is required when rejecting a doctor", 400);
            }
            updateData.status = DoctorStatus.REJECTED;
            updateData.rejectedReason = input.reason;
            break;

        case "lock":
            if (doctor.isLocked) {
                throw new ApiError("Doctor is already locked", 400);
            }
            updateData.isLocked = true;
            break;

        case "unlock":
            if (!doctor.isLocked) {
                throw new ApiError("Doctor is not locked", 400);
            }
            updateData.isLocked = false;
            break;

        default:
            throw new ApiError(
                `Invalid action. Must be one of: approve, reject, lock, unlock`,
                400
            );
    }

    return prisma.doctor.update({
        where: { id: doctorId },
        data: updateData,
        include: {
            specialty: true,
            clinic: true,
            userAccount: {
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    role: true,
                },
            },
        },
    });
}
