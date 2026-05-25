"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDoctorSchedule = createDoctorSchedule;
exports.getSchedulesByDoctor = getSchedulesByDoctor;
const client_1 = __importDefault(require("../prisma/client"));
const apiError_1 = require("../utils/apiError");
async function createDoctorSchedule(params) {
    const doctor = await client_1.default.doctor.findUnique({ where: { id: params.doctorId } });
    if (!doctor) {
        throw new apiError_1.ApiError("Doctor not found", 404);
    }
    // Basic validation of times
    if (!/^\d{2}:\d{2}$/.test(params.startTime) || !/^\d{2}:\d{2}$/.test(params.endTime)) {
        throw new apiError_1.ApiError("Invalid time format. Use HH:MM", 400);
    }
    return client_1.default.doctorSchedule.create({
        data: {
            doctorId: params.doctorId,
            dayOfWeek: params.dayOfWeek,
            startTime: params.startTime,
            endTime: params.endTime,
            isAvailable: params.isAvailable ?? true,
        },
    });
}
async function getSchedulesByDoctor(doctorId) {
    const doctor = await client_1.default.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor) {
        throw new apiError_1.ApiError("Doctor not found", 404);
    }
    return client_1.default.doctorSchedule.findMany({ where: { doctorId } });
}
