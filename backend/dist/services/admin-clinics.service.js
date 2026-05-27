"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllClinics = getAllClinics;
exports.createClinic = createClinic;
exports.updateClinic = updateClinic;
exports.deleteClinic = deleteClinic;
const client_1 = __importDefault(require("../prisma/client"));
const apiError_1 = require("../utils/apiError");
/**
 * Returns all clinics with doctor count.
 */
async function getAllClinics() {
    return client_1.default.clinic.findMany({
        include: {
            _count: { select: { doctors: true } },
        },
        orderBy: { name: "asc" },
    });
}
/**
 * Creates a new clinic.
 */
async function createClinic(input) {
    return client_1.default.clinic.create({
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
async function updateClinic(id, input) {
    const clinic = await client_1.default.clinic.findUnique({ where: { id } });
    if (!clinic) {
        throw new apiError_1.ApiError("Clinic not found", 404);
    }
    return client_1.default.clinic.update({
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
async function deleteClinic(id) {
    const clinic = await client_1.default.clinic.findUnique({
        where: { id },
        include: { _count: { select: { doctors: true } } },
    });
    if (!clinic) {
        throw new apiError_1.ApiError("Clinic not found", 404);
    }
    if (clinic._count.doctors > 0) {
        throw new apiError_1.ApiError(`Cannot delete clinic: ${clinic._count.doctors} doctor(s) are still linked`, 400);
    }
    await client_1.default.clinic.delete({ where: { id } });
}
