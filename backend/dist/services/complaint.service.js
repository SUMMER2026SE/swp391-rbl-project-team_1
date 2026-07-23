"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserComplaint = createUserComplaint;
exports.getUserComplaints = getUserComplaints;
const client_1 = __importDefault(require("../prisma/client"));
async function createUserComplaint(userId, message, type = 'SYSTEM', subject, images, appointmentId) {
    if (type === 'SERVICE' && !appointmentId) {
        throw new Error("Mã lịch hẹn là bắt buộc đối với khiếu nại dịch vụ.");
    }
    if (appointmentId) {
        const appointment = await client_1.default.appointment.findUnique({
            where: { id: appointmentId, userId }
        });
        if (!appointment) {
            throw new Error("Không tìm thấy lịch hẹn hoặc bạn không có quyền truy cập.");
        }
    }
    return await client_1.default.complaint.create({
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
async function getUserComplaints(userId) {
    return await client_1.default.complaint.findMany({
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
