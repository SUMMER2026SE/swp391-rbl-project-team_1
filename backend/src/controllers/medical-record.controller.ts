import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import {
    getUserMedicalRecords,
    getUserMedicalRecordById,
    getPrescriptionsByRecordId,
} from "../services/medical-record.service";
import { ApiError } from "../utils/apiError";

export async function listMyMedicalRecords(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.userId;
        if (!userId) throw new ApiError("Authentication required", 401);

        const records = await getUserMedicalRecords(userId);
        res.json({ message: "Medical records retrieved", count: records.length, data: records });
    } catch (error) {
        next(error);
    }
}

export async function getMyMedicalRecord(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.userId;
        const id = req.params.id as string;
        if (!userId) throw new ApiError("Authentication required", 401);

        const record = await getUserMedicalRecordById(userId, id);
        res.json({ message: "Medical record retrieved", data: record });
    } catch (error) {
        next(error);
    }
}

export async function listMyPrescriptions(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.userId;
        const medicalRecordId = req.params.medicalRecordId as string;
        if (!userId) throw new ApiError("Authentication required", 401);

        const prescriptions = await getPrescriptionsByRecordId(userId, medicalRecordId);
        res.json({ message: "Prescriptions retrieved", count: prescriptions.length, data: prescriptions });
    } catch (error) {
        next(error);
    }
}
