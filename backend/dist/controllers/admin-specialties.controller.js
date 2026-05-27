"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSpecialties = getSpecialties;
exports.createSpecialtyHandler = createSpecialtyHandler;
exports.updateSpecialtyHandler = updateSpecialtyHandler;
exports.deleteSpecialtyHandler = deleteSpecialtyHandler;
const admin_specialties_service_1 = require("../services/admin-specialties.service");
const apiError_1 = require("../utils/apiError");
/**
 * GET /api/admin/specialties
 * Returns all specialties with doctor count.
 */
async function getSpecialties(_req, res, next) {
    try {
        const specialties = await (0, admin_specialties_service_1.getAllSpecialties)();
        res.json({
            message: "Specialties retrieved successfully",
            count: specialties.length,
            data: specialties,
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * POST /api/admin/specialties
 * Creates a new specialty.
 */
async function createSpecialtyHandler(req, res, next) {
    try {
        const { name, slug, description, icon } = req.body;
        if (!name || !slug) {
            throw new apiError_1.ApiError("Name and slug are required", 400);
        }
        const specialty = await (0, admin_specialties_service_1.createSpecialty)({ name, slug, description, icon });
        res.status(201).json({
            message: "Specialty created successfully",
            data: specialty,
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * PUT /api/admin/specialties/:id
 * Updates an existing specialty.
 */
async function updateSpecialtyHandler(req, res, next) {
    try {
        const id = req.params.id;
        if (!id) {
            throw new apiError_1.ApiError("Specialty ID is required", 400);
        }
        const { name, slug, description, icon } = req.body;
        const specialty = await (0, admin_specialties_service_1.updateSpecialty)(id, { name, slug, description, icon });
        res.json({
            message: "Specialty updated successfully",
            data: specialty,
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * DELETE /api/admin/specialties/:id
 * Deletes a specialty (fails if doctors are linked).
 */
async function deleteSpecialtyHandler(req, res, next) {
    try {
        const id = req.params.id;
        if (!id) {
            throw new apiError_1.ApiError("Specialty ID is required", 400);
        }
        await (0, admin_specialties_service_1.deleteSpecialty)(id);
        res.json({
            message: "Specialty deleted successfully",
        });
    }
    catch (error) {
        next(error);
    }
}
