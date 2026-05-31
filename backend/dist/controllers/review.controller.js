"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitReview = submitReview;
exports.listDoctorReviews = listDoctorReviews;
exports.listMyReviews = listMyReviews;
const review_service_1 = require("../services/review.service");
const apiError_1 = require("../utils/apiError");
async function submitReview(req, res, next) {
    try {
        const userId = req.user?.userId;
        if (!userId)
            throw new apiError_1.ApiError("Authentication required", 401);
        const { appointmentId, rating, comment } = req.body;
        if (!appointmentId || rating === undefined) {
            throw new apiError_1.ApiError("appointmentId and rating are required", 400);
        }
        const review = await (0, review_service_1.createReview)(userId, { appointmentId, rating, comment });
        res.status(201).json({ message: "Review submitted", data: review });
    }
    catch (error) {
        next(error);
    }
}
async function listDoctorReviews(req, res, next) {
    try {
        const doctorId = req.params.doctorId;
        const result = await (0, review_service_1.getDoctorReviews)(doctorId);
        res.json({ message: "Doctor reviews retrieved", data: result });
    }
    catch (error) {
        next(error);
    }
}
async function listMyReviews(req, res, next) {
    try {
        const userId = req.user?.userId;
        if (!userId)
            throw new apiError_1.ApiError("Authentication required", 401);
        const reviews = await (0, review_service_1.getUserReviews)(userId);
        res.json({ message: "Reviews retrieved", count: reviews.length, data: reviews });
    }
    catch (error) {
        next(error);
    }
}
