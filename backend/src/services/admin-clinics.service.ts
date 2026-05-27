import prisma from "../prisma/client";
import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/apiError";

type ClinicWithCount = Prisma.ClinicGetPayload<{
    include: { _count: { select: { doctors: true } } };
}>;

interface CreateClinicInput {
    name: string;
    address: string;
    image?: string;
}

interface UpdateClinicInput {
    name?: string;
    address?: string;
    image?: string;
}

/**
 * Returns all clinics with doctor count.
 */
export async function getAllClinics(): Promise<ClinicWithCount[]> {
    return prisma.clinic.findMany({
        include: {
            _count: { select: { doctors: true } },
        },
        orderBy: { name: "asc" },
    });
}

/**
 * Creates a new clinic.
 */
export async function createClinic(
    input: CreateClinicInput
): Promise<ClinicWithCount> {
    return prisma.clinic.create({
        data: {
            name: input.name,
            address: input.address,
            image: input.image,
        },
        include: {
            _count: { select: { doctors: true } },
        },
    });
}

/**
 * Updates an existing clinic.
 */
export async function updateClinic(
    id: string,
    input: UpdateClinicInput
): Promise<ClinicWithCount> {
    const clinic = await prisma.clinic.findUnique({ where: { id } });

    if (!clinic) {
        throw new ApiError("Clinic not found", 404);
    }

    return prisma.clinic.update({
        where: { id },
        data: {
            ...(input.name !== undefined && { name: input.name }),
            ...(input.address !== undefined && { address: input.address }),
            ...(input.image !== undefined && { image: input.image }),
        },
        include: {
            _count: { select: { doctors: true } },
        },
    });
}

/**
 * Deletes a clinic. Fails if doctors are linked.
 */
export async function deleteClinic(id: string): Promise<void> {
    const clinic = await prisma.clinic.findUnique({
        where: { id },
        include: { _count: { select: { doctors: true } } },
    });

    if (!clinic) {
        throw new ApiError("Clinic not found", 404);
    }

    if (clinic._count.doctors > 0) {
        throw new ApiError(
            `Cannot delete clinic: ${clinic._count.doctors} doctor(s) are still linked`,
            400
        );
    }

    await prisma.clinic.delete({ where: { id } });
}
