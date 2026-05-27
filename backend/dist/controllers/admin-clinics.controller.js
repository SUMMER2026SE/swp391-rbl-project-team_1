"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClinics = getClinics;
exports.createClinicHandler = createClinicHandler;
exports.updateClinicHandler = updateClinicHandler;
exports.deleteClinicHandler = deleteClinicHandler;
const admin_clinics_service_1 = require("../services/admin-clinics.service");
const apiError_1 = require("../utils/apiError");
/**
 * GET /api/admin/clinics
 * Returns all clinics with doctor count.
 */
async function getClinics(_req, res, next) {
    try {
        const clinics = await (0, admin_clinics_service_1.getAllClinics)();
        res.json({
            message: "Clinics retrieved successfully",
            count: clinics.length,
            data: clinics,
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * POST /api/admin/clinics
 * Creates a new clinic.
 */
async function createClinicHandler(req, res, next) {
    try {
        const { name, address, image } = req.body;
        if (!name || !address) {
            throw new apiError_1.ApiError("Name and address are required", 400);
        }
        const clinic = await (0, admin_clinics_service_1.createClinic)({ name, address, image });
        res.status(201).json({
            message: "Clinic created successfully",
            data: clinic,
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * PUT /api/admin/clinics/:id
 * Updates an existing clinic.
 */
async function updateClinicHandler(req, res, next) {
    try {
        const id = req.params.id;
        if (!id) {
            throw new apiError_1.ApiError("Clinic ID is required", 400);
        }
        const { name, address, image } = req.body;
        const clinic = await (0, admin_clinics_service_1.updateClinic)(id, { name, address, image });
        res.json({
            message: "Clinic updated successfully",
            data: clinic,
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * DELETE /api/admin/clinics/:id
 * Deletes a clinic (fails if doctors are linked).
 */
async function deleteClinicHandler(req, res, next) {
    try {
        const id = req.params.id;
        if (!id) {
            throw new apiError_1.ApiError("Clinic ID is required", 400);
        }
        await (0, admin_clinics_service_1.deleteClinic)(id);
        res.json({
            message: "Clinic deleted successfully",
        });
    }
    catch (error) {
        next(error);
    }
}
