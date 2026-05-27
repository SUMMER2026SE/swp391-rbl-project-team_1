"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllSpecialties = getAllSpecialties;
exports.createSpecialty = createSpecialty;
exports.updateSpecialty = updateSpecialty;
exports.deleteSpecialty = deleteSpecialty;
const client_1 = __importDefault(require("../prisma/client"));
const apiError_1 = require("../utils/apiError");
/**
 * Returns all specialties with doctor count.
 */
async function getAllSpecialties() {
    return client_1.default.specialty.findMany({
        include: {
            _count: { select: { doctors: true } },
        },
        orderBy: { name: "asc" },
    });
}
/**
 * Creates a new specialty.
 */
async function createSpecialty(input) {
    const existing = await client_1.default.specialty.findFirst({
        where: {
            OR: [{ name: input.name }, { slug: input.slug }],
        },
    });
    if (existing) {
        throw new apiError_1.ApiError("A specialty with this name or slug already exists", 409);
    }
    return client_1.default.specialty.create({
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
async function updateSpecialty(id, input) {
    const specialty = await client_1.default.specialty.findUnique({ where: { id } });
    if (!specialty) {
        throw new apiError_1.ApiError("Specialty not found", 404);
    }
    // Check uniqueness if name or slug is being changed
    if (input.name || input.slug) {
        const conflict = await client_1.default.specialty.findFirst({
            where: {
                id: { not: id },
                OR: [
                    ...(input.name ? [{ name: input.name }] : []),
                    ...(input.slug ? [{ slug: input.slug }] : []),
                ],
            },
        });
        if (conflict) {
            throw new apiError_1.ApiError("A specialty with this name or slug already exists", 409);
        }
    }
    return client_1.default.specialty.update({
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
async function deleteSpecialty(id) {
    const specialty = await client_1.default.specialty.findUnique({
        where: { id },
        include: { _count: { select: { doctors: true } } },
    });
    if (!specialty) {
        throw new apiError_1.ApiError("Specialty not found", 404);
    }
    if (specialty._count.doctors > 0) {
        throw new apiError_1.ApiError(`Cannot delete specialty: ${specialty._count.doctors} doctor(s) are still linked`, 400);
    }
    await client_1.default.specialty.delete({ where: { id } });
}
