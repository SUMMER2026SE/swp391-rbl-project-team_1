import { Request, Response, NextFunction } from "express";
import { getNearbyClinics, getClinicById, getAllPublicClinics } from "../services/clinic.service";
import { ApiError } from "../utils/apiError";

export async function getNearbyClinicsHandler(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { lat, lng, radius } = req.query;

        if (!lat || !lng) {
            throw new ApiError("Latitude (lat) and longitude (lng) are required", 400);
        }

        const latitude = parseFloat(lat as string);
        const longitude = parseFloat(lng as string);
        const radiusKm = radius ? parseFloat(radius as string) : 10;

        if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
            throw new ApiError("Invalid latitude or longitude values", 400);
        }

        const clinics = await getNearbyClinics(latitude, longitude, radiusKm);

        res.json({
            message: "Nearby clinics fetched successfully",
            count: clinics.length,
            clinics,
        });
    } catch (error) {
        next(error);
    }
}

export async function getClinicByIdHandler(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { id } = req.params;
        const clinic = await getClinicById(id as string);

        if (!clinic) {
            throw new ApiError("Clinic not found", 404);
        }

        res.json({
            message: "Clinic details fetched successfully",
            clinic,
        });
    } catch (error) {
        next(error);
    }
}

export async function getAllPublicClinicsHandler(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const clinics = await getAllPublicClinics();
        res.json({
            message: "Clinics fetched successfully",
            count: clinics.length,
            clinics,
        });
    } catch (error) {
        next(error);
    }
}
