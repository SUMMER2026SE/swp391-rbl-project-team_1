import { NextFunction, Response } from "express";

import { AuthenticatedRequest } from "../middleware/auth.middleware";
import {
    getAllSpecialties,
    createSpecialty,
    updateSpecialty,
    deleteSpecialty,
} from "../services/admin-specialties.service";
import { ApiError } from "../utils/apiError";

/**
 * GET /api/admin/specialties
 * Returns all specialties with doctor count.
 */
export async function getSpecialties(
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const specialties = await getAllSpecialties();
        res.json({
            message: "Specialties retrieved successfully",
            count: specialties.length,
            data: specialties,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/admin/specialties
 * Creates a new specialty.
 */
export async function createSpecialtyHandler(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { name, slug, description, icon } = req.body as {
            name?: string;
            slug?: string;
            description?: string;
            icon?: string;
        };

        if (!name || !slug) {
            throw new ApiError("Name and slug are required", 400);
        }

        const specialty = await createSpecialty({ name, slug, description, icon });
        res.status(201).json({
            message: "Specialty created successfully",
            data: specialty,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/admin/specialties/:id
 * Updates an existing specialty.
 */
export async function updateSpecialtyHandler(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const id = req.params.id as string;

        if (!id) {
            throw new ApiError("Specialty ID is required", 400);
        }

        const { name, slug, description, icon } = req.body as {
            name?: string;
            slug?: string;
            description?: string;
            icon?: string;
        };

        const specialty = await updateSpecialty(id, { name, slug, description, icon });
        res.json({
            message: "Specialty updated successfully",
            data: specialty,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * DELETE /api/admin/specialties/:id
 * Deletes a specialty (fails if doctors are linked).
 */
export async function deleteSpecialtyHandler(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const id = req.params.id as string;

        if (!id) {
            throw new ApiError("Specialty ID is required", 400);
        }

        await deleteSpecialty(id);
        res.json({
            message: "Specialty deleted successfully",
        });
    } catch (error) {
        next(error);
    }
}
