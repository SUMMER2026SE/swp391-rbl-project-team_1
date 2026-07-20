import prisma from "../prisma/client";
import { ComplaintType } from "@prisma/client";

export async function createUserComplaint(
    userId: string,
    message: string,
    type: ComplaintType = 'SYSTEM',
    subject?: string,
    images?: string[],
    appointmentId?: string
) {
    if (type === 'SERVICE' && !appointmentId) {
        throw new Error("Mã lịch hẹn là bắt buộc đối với khiếu nại dịch vụ.");
    }

    if (appointmentId) {
        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId, userId }
        });
        if (!appointment) {
            throw new Error("Không tìm thấy lịch hẹn hoặc bạn không có quyền truy cập.");
        }
    }

    return await prisma.complaint.create({
        data: {
            userId,
            message,
            type,
            subject,
            images: images || [],
            appointmentId
        }
    });
}

export async function getUserComplaints(userId: string) {
    return await prisma.complaint.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
            appointment: {
                include: {
                    doctor: true
                }
            }
        }
    });
}
