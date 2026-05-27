import prisma from "../prisma/client";
import { ComplaintStatus, Prisma } from "@prisma/client";
import { ApiError } from "../utils/apiError";

type ComplaintWithUser = Prisma.ComplaintGetPayload<{
    include: {
        user: {
            select: {
                id: true;
                email: true;
                fullName: true;
                role: true;
            };
        };
    };
}>;

/**
 * Returns all complaints with user relation.
 */
export async function getAllComplaints(): Promise<ComplaintWithUser[]> {
    return prisma.complaint.findMany({
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    role: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
}

/**
 * Marks a complaint as resolved.
 */
export async function resolveComplaint(id: string): Promise<ComplaintWithUser> {
    const complaint = await prisma.complaint.findUnique({ where: { id } });

    if (!complaint) {
        throw new ApiError("Complaint not found", 404);
    }

    if (complaint.status === ComplaintStatus.RESOLVED) {
        throw new ApiError("Complaint is already resolved", 400);
    }

    return prisma.complaint.update({
        where: { id },
        data: { status: ComplaintStatus.RESOLVED },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    role: true,
                },
            },
        },
    });
}
