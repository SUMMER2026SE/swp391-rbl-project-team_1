import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import {
    createComplaint,
    getUserComplaints,
    getComplaintByIdForUser,
} from "../services/complaint.service";
import { ApiError } from "../utils/apiError";

export async function submitComplaint(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.userId;
        if (!userId) throw new ApiError("Authentication required", 401);

        const { message } = req.body as { message?: string };
        const complaint = await createComplaint(userId, message || "");
        res.status(201).json({ message: "Complaint submitted successfully", data: complaint });
    } catch (error) {
        next(error);
    }
}

export async function listMyComplaints(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.userId;
        if (!userId) throw new ApiError("Authentication required", 401);

        const complaints = await getUserComplaints(userId);
        res.json({ message: "Complaints retrieved", count: complaints.length, data: complaints });
    } catch (error) {
        next(error);
    }
}

export async function getMyComplaint(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.userId;
        const id = req.params.id as string;
        if (!userId) throw new ApiError("Authentication required", 401);

        const complaint = await getComplaintByIdForUser(userId, id);
        res.json({ message: "Complaint retrieved", data: complaint });
    } catch (error) {
        next(error);
    }
}
