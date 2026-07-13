"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSchedule = createSchedule;
exports.listSchedules = listSchedules;
const schedule_service_1 = require("../services/schedule.service");
const apiError_1 = require("../utils/apiError");
const client_1 = __importDefault(require("../prisma/client"));
async function createSchedule(req, res, next) {
    try {
        const doctorId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!doctorId) {
            throw new apiError_1.ApiError("Doctor id is required", 400);
        }
        const body = req.body;
        if (body.dayOfWeek === undefined || !body.startTime || !body.endTime) {
            throw new apiError_1.ApiError("dayOfWeek, startTime and endTime are required", 400);
        }
        const schedule = await (0, schedule_service_1.createDoctorSchedule)({
            doctorId,
            dayOfWeek: body.dayOfWeek,
            startTime: body.startTime,
            endTime: body.endTime,
            isAvailable: body.isAvailable,
        });
        res.status(201).json({ message: "Schedule created", schedule });
    }
    catch (error) {
        next(error);
    }
}
async function listSchedules(req, res, next) {
    try {
        const doctorId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!doctorId) {
            throw new apiError_1.ApiError("Doctor id is required", 400);
        }
        const schedules = await (0, schedule_service_1.getSchedulesByDoctor)(doctorId);
        // Fetch active appointments (not cancelled) starting from 24 hours ago
        const startThreshold = new Date();
        startThreshold.setHours(startThreshold.getHours() - 24);
        const activeAppointments = await client_1.default.appointment.findMany({
            where: {
                doctorId,
                appointmentDate: {
                    gte: startThreshold,
                },
                status: {
                    in: ["PENDING", "CONFIRMED", "COMPLETED"]
                }
            },
            select: {
                appointmentDate: true
            }
        });
        const bookedCounts = {};
        activeAppointments.forEach(app => {
            const iso = app.appointmentDate.toISOString();
            bookedCounts[iso] = (bookedCounts[iso] || 0) + 1;
        });
        res.json({
            message: "Schedules fetched",
            schedules,
            bookedCounts
        });
    }
    catch (error) {
        next(error);
    }
}
