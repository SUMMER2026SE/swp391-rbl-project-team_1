"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReview = createReview;
exports.getDoctorReviews = getDoctorReviews;
exports.getUserReviews = getUserReviews;
const client_1 = require("@prisma/client");
const client_2 = __importDefault(require("../prisma/client"));
const apiError_1 = require("../utils/apiError");
const reviewInclude = {
    user: { select: { id: true, fullName: true, avatar: true } },
    doctor: { select: { id: true, name: true, avatar: true } },
};
async function createReview(userId, input) {
    const { appointmentId, rating, comment } = input;
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
        throw new apiError_1.ApiError("Rating must be an integer between 1 and 5", 400);
    }
    const appointment = await client_2.default.appointment.findFirst({
        where: { id: appointmentId, userId },
    });
    if (!appointment) {
        throw new apiError_1.ApiError("Appointment not found", 404);
    }
    if (appointment.status !== client_1.AppointmentStatus.COMPLETED) {
        throw new apiError_1.ApiError("You can only review completed appointments", 400);
    }
    const existing = await client_2.default.review.findUnique({
        where: { appointmentId },
    });
    if (existing) {
        throw new apiError_1.ApiError("You have already reviewed this appointment", 409);
    }
    return client_2.default.review.create({
        data: {
            userId,
            doctorId: appointment.doctorId,
            appointmentId,
            rating,
            comment: comment?.trim() || null,
        },
        include: reviewInclude,
    });
}
async function getDoctorReviews(doctorId) {
    const reviews = await client_2.default.review.findMany({
        where: { doctorId },
        include: reviewInclude,
        orderBy: { createdAt: "desc" },
    });
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
        ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10) / 10
        : 0;
    return { reviews, averageRating, totalReviews };
}
async function getUserReviews(userId) {
    return client_2.default.review.findMany({
        where: { userId },
        include: reviewInclude,
        orderBy: { createdAt: "desc" },
    });
}
