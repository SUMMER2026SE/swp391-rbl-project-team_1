import { NextFunction, Response } from "express";

import { AuthenticatedRequest } from "../middleware/auth.middleware";
import {
    getAllComplaints,
    resolveComplaint,
} from "../services/admin-complaints.service";
import { ApiError } from "../utils/apiError";

/**
 * GET /api/admin/complaints
 * Returns all complaints with user relation.
 */
export async function getComplaints(
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const complaints = await getAllComplaints();
        res.json({
            message: "Complaints retrieved successfully",
            count: complaints.length,
            data: complaints,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/admin/complaints/:id/resolve
 * Marks a complaint as resolved.
 */
export async function resolveComplaintHandler(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const id = req.params.id as string;

        if (!id) {
            throw new ApiError("Complaint ID is required", 400);
        }

        const complaint = await resolveComplaint(id);
        res.json({
            message: "Complaint resolved successfully",
            data: complaint,
        });
    } catch (error) {
        next(error);
    }
}
