import { ComplaintStatus, Prisma } from "@prisma/client";
import prisma from "../prisma/client";
import { ApiError } from "../utils/apiError";

type ComplaintWithUser = Prisma.ComplaintGetPayload<{
    include: {
        user: { select: { id: true; email: true; fullName: true; role: true } };
    };
}>;

export async function createComplaint(userId: string, message: string): Promise<ComplaintWithUser> {
    if (!message || message.trim().length < 10) {
        throw new ApiError("Complaint message must be at least 10 characters", 400);
    }

    return prisma.complaint.create({
        data: { userId, message: message.trim() },
        include: {
            user: { select: { id: true, email: true, fullName: true, role: true } },
        },
    });
}

export async function getUserComplaints(userId: string): Promise<ComplaintWithUser[]> {
    return prisma.complaint.findMany({
        where: { userId },
        include: {
            user: { select: { id: true, email: true, fullName: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
    });
}

export async function getComplaintByIdForUser(
    userId: string,
    complaintId: string
): Promise<ComplaintWithUser> {
    const complaint = await prisma.complaint.findFirst({
        where: { id: complaintId, userId },
        include: {
            user: { select: { id: true, email: true, fullName: true, role: true } },
        },
    });

    if (!complaint) {
        throw new ApiError("Complaint not found", 404);
    }

    return complaint;
}

export { ComplaintStatus };
