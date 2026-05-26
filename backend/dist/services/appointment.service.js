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
    return client_1.default.appointment.create({
        data: {
            userId: params.userId,
            doctorId: params.doctorId,
            appointmentDate: params.appointmentDate,
            status: "PENDING",
            notes: params.notes,
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
