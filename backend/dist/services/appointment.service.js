"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAppointment = createAppointment;
exports.getAppointmentsByUser = getAppointmentsByUser;
exports.getAllAppointments = getAllAppointments;
exports.getAppointmentById = getAppointmentById;
exports.getDoctorAppointments = getDoctorAppointments;
exports.getAppointmentQueueStatus = getAppointmentQueueStatus;
const client_1 = __importDefault(require("../prisma/client"));
const apiError_1 = require("../utils/apiError");
async function createAppointment(params) {
    const doctor = await client_1.default.doctor.findUnique({ where: { id: params.doctorId } });
    if (!doctor) {
        throw new apiError_1.ApiError("Doctor not found", 404);
    }
    // prevent duplicate booking for the same doctor at the exact same datetime
    const existing = await client_1.default.appointment.findFirst({
        where: {
            doctorId: params.doctorId,
            appointmentDate: params.appointmentDate,
        },
    });
    if (existing) {
        throw new apiError_1.ApiError("Selected slot already booked", 409);
    }
    // Tính toán queueNumber dựa trên số lượng cuộc hẹn trong ngày của bác sĩ đó
    const startOfDay = new Date(params.appointmentDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(params.appointmentDate);
    endOfDay.setHours(23, 59, 59, 999);
    const lastAppointmentOnDay = await client_1.default.appointment.findFirst({
        where: {
            doctorId: params.doctorId,
            appointmentDate: {
                gte: startOfDay,
                lte: endOfDay,
            },
        },
        orderBy: {
            queueNumber: "desc",
        },
    });
    const queueNumber = lastAppointmentOnDay && lastAppointmentOnDay.queueNumber ? lastAppointmentOnDay.queueNumber + 1 : 1;
    return client_1.default.appointment.create({
        data: {
            userId: params.userId,
            doctorId: params.doctorId,
            appointmentDate: params.appointmentDate,
            status: "PENDING",
            notes: params.notes,
            queueNumber: queueNumber,
        },
    });
}
async function getAppointmentsByUser(userId) {
    return client_1.default.appointment.findMany({
        where: { userId },
        include: {
            doctor: true,
        },
        orderBy: {
            appointmentDate: "desc",
        },
    });
}
async function getAllAppointments() {
    return client_1.default.appointment.findMany({
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    role: true,
                },
            },
            doctor: true,
        },
        orderBy: {
            appointmentDate: "desc",
        },
    });
}
async function getAppointmentById(id) {
    return client_1.default.appointment.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    role: true,
                },
            },
            doctor: true,
        },
    });
}
async function getDoctorAppointments(doctorId) {
    return client_1.default.appointment.findMany({
        where: { doctorId },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    role: true,
                },
            },
            doctor: true,
        },
        orderBy: {
            appointmentDate: "asc",
        },
    });
}
/**
 * Lấy trạng thái xếp hàng và dự kiến thời gian chờ của cuộc hẹn
 */
async function getAppointmentQueueStatus(appointmentId) {
    const appointment = await client_1.default.appointment.findUnique({
        where: { id: appointmentId },
        include: { doctor: true },
    });
    if (!appointment) {
        throw new apiError_1.ApiError("Không tìm thấy cuộc hẹn", 404);
    }
    if (!appointment.queueNumber) {
        return {
            queueNumber: null,
            currentServingNumber: null,
            estimatedWaitMinutes: 0,
            status: appointment.status,
        };
    }
    const startOfDay = new Date(appointment.appointmentDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(appointment.appointmentDate);
    endOfDay.setHours(23, 59, 59, 999);
    // Tìm cuộc hẹn đang khám hoặc đã xong gần đây nhất trong ngày có queueNumber lớn nhất mà bé hơn hoặc bằng của mình
    const lastServedAppointment = await client_1.default.appointment.findFirst({
        where: {
            doctorId: appointment.doctorId,
            appointmentDate: {
                gte: startOfDay,
                lte: endOfDay,
            },
            status: {
                in: ["CONFIRMED", "COMPLETED"],
            },
        },
        orderBy: {
            queueNumber: "desc",
        },
    });
    const currentServingNumber = lastServedAppointment?.queueNumber ?? 0;
    // Ước tính 15 phút cho mỗi ca khám
    const averageTimePerPatientMinutes = 15;
    let estimatedWaitMinutes = 0;
    if (appointment.queueNumber > currentServingNumber) {
        estimatedWaitMinutes = (appointment.queueNumber - currentServingNumber) * averageTimePerPatientMinutes;
    }
    return {
        queueNumber: appointment.queueNumber,
        currentServingNumber,
        estimatedWaitMinutes,
        status: appointment.status,
    };
}
