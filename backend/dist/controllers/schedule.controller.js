"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSchedule = createSchedule;
exports.listSchedules = listSchedules;
const schedule_service_1 = require("../services/schedule.service");
const apiError_1 = require("../utils/apiError");
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
        res.json({ message: "Schedules fetched", schedules });
    }
    catch (error) {
        next(error);
    }
}
