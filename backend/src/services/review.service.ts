import { AppointmentStatus, Prisma } from "@prisma/client";
import prisma from "../prisma/client";
import { ApiError } from "../utils/apiError";

const reviewInclude = {
    user: { select: { id: true, fullName: true, avatar: true } },
    doctor: { select: { id: true, name: true, avatar: true } },
} satisfies Prisma.ReviewInclude;

export type ReviewWithRelations = Prisma.ReviewGetPayload<{ include: typeof reviewInclude }>;

export async function createReview(
    userId: string,
    input: { appointmentId: string; rating: number; comment?: string }
): Promise<ReviewWithRelations> {
    const { appointmentId, rating, comment } = input;

    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
        throw new ApiError("Rating must be an integer between 1 and 5", 400);
    }

    const appointment = await prisma.appointment.findFirst({
        where: { id: appointmentId, userId },
    });

    if (!appointment) {
        throw new ApiError("Appointment not found", 404);
    }

    if (appointment.status !== AppointmentStatus.COMPLETED) {
        throw new ApiError("You can only review completed appointments", 400);
    }

    const existing = await prisma.review.findUnique({
        where: { appointmentId },
    });

    if (existing) {
        throw new ApiError("You have already reviewed this appointment", 409);
    }

    return prisma.review.create({
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

export async function getDoctorReviews(doctorId: string): Promise<{
    reviews: ReviewWithRelations[];
    averageRating: number;
    totalReviews: number;
}> {
    const reviews = await prisma.review.findMany({
        where: { doctorId },
        include: reviewInclude,
        orderBy: { createdAt: "desc" },
    });

    const totalReviews = reviews.length;
    const averageRating =
        totalReviews > 0
            ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10) / 10
            : 0;

    return { reviews, averageRating, totalReviews };
}

export async function getUserReviews(userId: string): Promise<ReviewWithRelations[]> {
    return prisma.review.findMany({
        where: { userId },
        include: reviewInclude,
        orderBy: { createdAt: "desc" },
    });
}
