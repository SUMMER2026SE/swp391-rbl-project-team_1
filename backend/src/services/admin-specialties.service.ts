import prisma from "../prisma/client";
import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/apiError";

type SpecialtyWithCount = Prisma.SpecialtyGetPayload<{
    include: { _count: { select: { doctors: true } } };
}>;

interface CreateSpecialtyInput {
    name: string;
    slug: string;
    description?: string;
    icon?: string;
}

interface UpdateSpecialtyInput {
    name?: string;
    slug?: string;
    description?: string;
    icon?: string;
}

/**
 * Returns all specialties with doctor count.
 */
export async function getAllSpecialties(): Promise<SpecialtyWithCount[]> {
    return prisma.specialty.findMany({
        include: {
            _count: { select: { doctors: true } },
        },
        orderBy: { name: "asc" },
    });
}

/**
 * Creates a new specialty.
 */
export async function createSpecialty(
    input: CreateSpecialtyInput
): Promise<SpecialtyWithCount> {
    const existing = await prisma.specialty.findFirst({
        where: {
            OR: [{ name: input.name }, { slug: input.slug }],
        },
    });

    if (existing) {
        throw new ApiError("A specialty with this name or slug already exists", 409);
    }

    return prisma.specialty.create({
        data: {
            name: input.name,
            slug: input.slug,
            description: input.description,
            icon: input.icon,
        },
        include: {
            _count: { select: { doctors: true } },
        },
    });
}

/**
 * Updates an existing specialty.
 */
export async function updateSpecialty(
    id: string,
    input: UpdateSpecialtyInput
): Promise<SpecialtyWithCount> {
    const specialty = await prisma.specialty.findUnique({ where: { id } });

    if (!specialty) {
        throw new ApiError("Specialty not found", 404);
    }

    // Check uniqueness if name or slug is being changed
    if (input.name || input.slug) {
        const conflict = await prisma.specialty.findFirst({
            where: {
                id: { not: id },
                OR: [
                    ...(input.name ? [{ name: input.name }] : []),
                    ...(input.slug ? [{ slug: input.slug }] : []),
                ],
            },
        });

        if (conflict) {
            throw new ApiError("A specialty with this name or slug already exists", 409);
        }
    }

    return prisma.specialty.update({
        where: { id },
        data: {
            ...(input.name !== undefined && { name: input.name }),
            ...(input.slug !== undefined && { slug: input.slug }),
            ...(input.description !== undefined && { description: input.description }),
            ...(input.icon !== undefined && { icon: input.icon }),
        },
        include: {
            _count: { select: { doctors: true } },
        },
    });
}

/**
 * Deletes a specialty. Fails if doctors are linked.
 */
export async function deleteSpecialty(id: string): Promise<void> {
    const specialty = await prisma.specialty.findUnique({
        where: { id },
        include: { _count: { select: { doctors: true } } },
    });

    if (!specialty) {
        throw new ApiError("Specialty not found", 404);
    }

    if (specialty._count.doctors > 0) {
        throw new ApiError(
            `Cannot delete specialty: ${specialty._count.doctors} doctor(s) are still linked`,
            400
        );
    }

    await prisma.specialty.delete({ where: { id } });
}
