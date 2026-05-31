import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { createReview, getDoctorReviews, getUserReviews } from "../services/review.service";
import { ApiError } from "../utils/apiError";

export async function submitReview(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.userId;
        if (!userId) throw new ApiError("Authentication required", 401);

        const { appointmentId, rating, comment } = req.body as {
            appointmentId?: string;
            rating?: number;
            comment?: string;
        };

        if (!appointmentId || rating === undefined) {
            throw new ApiError("appointmentId and rating are required", 400);
        }

        const review = await createReview(userId, { appointmentId, rating, comment });
        res.status(201).json({ message: "Review submitted", data: review });
    } catch (error) {
        next(error);
    }
}

export async function listDoctorReviews(
    req: import("express").Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const doctorId = req.params.doctorId as string;
        const result = await getDoctorReviews(doctorId);
        res.json({ message: "Doctor reviews retrieved", data: result });
    } catch (error) {
        next(error);
    }
}

export async function listMyReviews(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.userId;
        if (!userId) throw new ApiError("Authentication required", 401);

        const reviews = await getUserReviews(userId);
        res.json({ message: "Reviews retrieved", count: reviews.length, data: reviews });
    } catch (error) {
        next(error);
    }
}
