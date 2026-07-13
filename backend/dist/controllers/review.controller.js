"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReview = createReview;
exports.getDoctorReviews = getDoctorReviews;
const client_1 = __importDefault(require("../prisma/client"));
const apiError_1 = require("../utils/apiError");
/**
 * POST /api/reviews
 * Protected: Allows a patient to rate and review their completed appointment.
 */
async function createReview(req, res, next) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new apiError_1.ApiError("Authentication required", 401);
        }
        const { appointmentId, rating, comment } = req.body;
        if (!appointmentId) {
            throw new apiError_1.ApiError("Appointment ID is required", 400);
        }
        const ratingNum = Number(rating);
        if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
            throw new apiError_1.ApiError("Rating must be an integer between 1 and 5", 400);
        }
        // 1. Fetch the appointment to verify ownership and completion
        const appointment = await client_1.default.appointment.findUnique({
            where: { id: appointmentId },
        });
        if (!appointment) {
            throw new apiError_1.ApiError("Appointment not found", 404);
        }
        if (appointment.userId !== userId) {
            throw new apiError_1.ApiError("You are not authorized to review this appointment", 403);
        }
        if (appointment.status !== "COMPLETED") {
            throw new apiError_1.ApiError("You can only review completed appointments", 400);
        }
        // 2. Check if a review already exists
        const existingReview = await client_1.default.review.findUnique({
            where: { appointmentId },
        });
        if (existingReview) {
            throw new apiError_1.ApiError("You have already reviewed this appointment", 400);
        }
        // 3. Create the review
        const review = await client_1.default.review.create({
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
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/doctors/:id/reviews
 * Public: Returns reviews and statistics for a specific doctor.
 */
async function getDoctorReviews(req, res, next) {
    try {
        const doctorId = req.params.id;
        if (!doctorId) {
            throw new apiError_1.ApiError("Doctor ID is required", 400);
        }
        // 1. Verify doctor exists
        const doctorExists = await client_1.default.doctor.findUnique({
            where: { id: doctorId },
        });
        if (!doctorExists) {
            throw new apiError_1.ApiError("Doctor not found", 404);
        }
        // 2. Fetch all reviews
        const reviews = await client_1.default.review.findMany({
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
        const totalReviews = await client_1.default.review.count({
            where: { doctorId },
        });
        const avgResult = await client_1.default.review.aggregate({
            where: { doctorId },
            _avg: {
                rating: true,
            },
        });
        const averageRating = avgResult._avg?.rating ? Math.round(avgResult._avg.rating * 10) / 10 : 0;
        // Fetch distribution (counts for 1 to 5 stars)
        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        for (let star = 1; star <= 5; star++) {
            distribution[star] = await client_1.default.review.count({
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
    }
    catch (error) {
        next(error);
    }
}
