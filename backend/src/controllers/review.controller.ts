import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import prisma from "../prisma/client";
import { ApiError } from "../utils/apiError";

/**
 * POST /api/reviews
 * Protected: Allows a patient to rate and review their completed appointment.
 */
export async function createReview(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            throw new ApiError("Authentication required", 401);
        }

        const { appointmentId, rating, comment } = req.body as {
            appointmentId: string;
            rating: number;
            comment?: string;
        };

        if (!appointmentId) {
            throw new ApiError("Appointment ID is required", 400);
        }

        const ratingNum = Number(rating);
        if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
            throw new ApiError("Rating must be an integer between 1 and 5", 400);
        }

        // 1. Fetch the appointment to verify ownership and completion
        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
        });

        if (!appointment) {
            throw new ApiError("Appointment not found", 404);
        }

        if (appointment.userId !== userId) {
            throw new ApiError("You are not authorized to review this appointment", 403);
        }

        if (appointment.status !== "COMPLETED") {
            throw new ApiError("You can only review completed appointments", 400);
        }

        // 2. Check if a review already exists
        const existingReview = await prisma.review.findUnique({
            where: { appointmentId },
        });

        if (existingReview) {
            throw new ApiError("You have already reviewed this appointment", 400);
        }

        // 3. Create the review
        const review = await prisma.review.create({
            data: {
                appointmentId,
                userId,
                doctorId: appointment.doctorId,
                rating: ratingNum,
                comment: comment ? comment.trim() : null,
            },
            include: {
                user: {
                    select: {
                        fullName: true,
                        avatar: true,
                    },
                },
            },
        });

        res.status(201).json({
            message: "Review submitted successfully",
            data: review,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/doctors/:id/reviews
 * Public: Returns reviews and statistics for a specific doctor.
 */
export async function getDoctorReviews(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const doctorId = req.params.id as string;

        if (!doctorId) {
            throw new ApiError("Doctor ID is required", 400);
        }

        // 1. Verify doctor exists
        const doctorExists = await prisma.doctor.findUnique({
            where: { id: doctorId },
        });

        if (!doctorExists) {
            throw new ApiError("Doctor not found", 404);
        }

        // 2. Fetch all reviews
        const reviews = await prisma.review.findMany({
            where: { doctorId },
            include: {
                user: {
                    select: {
                        fullName: true,
                        avatar: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        // 3. Calculate statistics
        const totalReviews = await prisma.review.count({
            where: { doctorId },
        });

        const avgResult = await prisma.review.aggregate({
            where: { doctorId },
            _avg: {
                rating: true,
            },
        });

        const averageRating = avgResult._avg?.rating ? Math.round(avgResult._avg.rating * 10) / 10 : 0;

        // Fetch distribution (counts for 1 to 5 stars)
        const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        for (let star = 1; star <= 5; star++) {
            distribution[star] = await prisma.review.count({
                where: { doctorId, rating: star },
            });
        }

        res.json({
            message: "Reviews retrieved successfully",
            data: {
                reviews,
                stats: {
                    averageRating,
                    totalReviews,
                    distribution,
                },
            },
        });
    } catch (error) {
        next(error);
    }
}
