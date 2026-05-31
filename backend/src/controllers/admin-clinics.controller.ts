import { NextFunction, Response } from "express";

import { AuthenticatedRequest } from "../middleware/auth.middleware";
import {
    getAllClinics,
    createClinic,
    updateClinic,
    deleteClinic,
    getClinicDoctors,
    getUnassignedDoctors,
    addDoctorToClinic,
    removeDoctorFromClinic,
} from "../services/admin-clinics.service";
import { ApiError } from "../utils/apiError";

/**
 * GET /api/admin/clinics
 * Returns all clinics with doctor count.
 */
export async function getClinics(
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const clinics = await getAllClinics();
        res.json({
            message: "Clinics retrieved successfully",
            count: clinics.length,
            data: clinics,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/admin/clinics
 * Creates a new clinic.
 */
export async function createClinicHandler(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { name, address, image } = req.body as {
            name?: string;
            address?: string;
            image?: string;
        };

        if (!name || !address) {
            throw new ApiError("Name and address are required", 400);
        }

        const clinic = await createClinic({ name, address, image });
        res.status(201).json({
            message: "Clinic created successfully",
            data: clinic,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/admin/clinics/:id
 * Updates an existing clinic.
 */
export async function updateClinicHandler(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const id = req.params.id as string;

        if (!id) {
            throw new ApiError("Clinic ID is required", 400);
        }

        const { name, address, image } = req.body as {
            name?: string;
            address?: string;
            image?: string;
        };

        const clinic = await updateClinic(id, { name, address, image });
        res.json({
            message: "Clinic updated successfully",
            data: clinic,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * DELETE /api/admin/clinics/:id
 * Deletes a clinic (fails if doctors are linked).
 */
export async function deleteClinicHandler(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const id = req.params.id as string;

        if (!id) {
            throw new ApiError("Clinic ID is required", 400);
        }

        await deleteClinic(id);
        res.json({
            message: "Clinic deleted successfully",
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/admin/clinics/:id/doctors
 * Returns all doctors belonging to a specific clinic.
 */
export async function getClinicDoctorsHandler(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const id = req.params.id as string;
        if (!id) {
            throw new ApiError("Clinic ID is required", 400);
        }

        const doctors = await getClinicDoctors(id);
        res.json({
            message: "Clinic doctors retrieved successfully",
            count: doctors.length,
            data: doctors,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/admin/clinics/unassigned-doctors
 * Returns all approved doctors who are currently not assigned to any clinic.
 */
export async function getUnassignedDoctorsHandler(
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const doctors = await getUnassignedDoctors();
        res.json({
            message: "Unassigned doctors retrieved successfully",
            count: doctors.length,
            data: doctors,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/admin/clinics/:id/doctors/:doctorId
 * Links a doctor to a clinic.
 */
export async function addDoctorToClinicHandler(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const id = req.params.id as string;
        const doctorId = req.params.doctorId as string;

        if (!id || !doctorId) {
            throw new ApiError("Clinic ID and Doctor ID are required", 400);
        }

        const doctor = await addDoctorToClinic(id, doctorId);
        res.json({
            message: "Doctor added to clinic successfully",
            data: doctor,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * DELETE /api/admin/clinics/:id/doctors/:doctorId
 * Unlinks a doctor from a clinic.
 */
export async function removeDoctorFromClinicHandler(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const id = req.params.id as string;
        const doctorId = req.params.doctorId as string;

        if (!id || !doctorId) {
            throw new ApiError("Clinic ID and Doctor ID are required", 400);
        }

        const doctor = await removeDoctorFromClinic(id, doctorId);
        res.json({
            message: "Doctor removed from clinic successfully",
            data: doctor,
        });
    } catch (error) {
        next(error);
    }
}
