"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startSession = startSession;
exports.completeSession = completeSession;
exports.getSessionHistory = getSessionHistory;
const client_1 = __importDefault(require("../prisma/client"));
const zod_1 = require("zod");
const apiError_1 = require("../utils/apiError");
const risk_service_1 = require("../services/risk.service");
const startSessionSchema = zod_1.z.object({
    taskId: zod_1.z.string().optional(),
    durationMin: zod_1.z.number().int().min(1).default(25)
});
/**
 * Start a new Pomodoro focus session.
 */
async function startSession(req, res, next) {
    try {
        const studentId = req.user?.studentId;
        if (!studentId) {
            throw new apiError_1.ApiError(400, 'Không tìm thấy thông tin Student.');
        }
        const { taskId, durationMin } = startSessionSchema.parse(req.body);
        // If taskId is specified, check if it belongs to the student
        if (taskId) {
            const task = await client_1.default.task.findUnique({ where: { id: taskId } });
            if (!task || task.studentId !== studentId) {
                throw new apiError_1.ApiError(404, 'Không tìm thấy task hoặc bạn không có quyền.');
            }
        }
        const session = await client_1.default.pomodoroSession.create({
            data: {
                studentId,
                taskId: taskId || null,
                durationMin,
                completed: false
            }
        });
        res.status(201).json({
            success: true,
            session
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * Mark a Pomodoro session as completed and accumulate study time.
 */
async function completeSession(req, res, next) {
    try {
        const studentId = req.user?.studentId;
        const { id } = req.params;
        if (!studentId) {
            throw new apiError_1.ApiError(400, 'Không tìm thấy thông tin Student.');
        }
        const session = await client_1.default.pomodoroSession.findUnique({
            where: { id }
        });
        if (!session || session.studentId !== studentId) {
            throw new apiError_1.ApiError(404, 'Không tìm thấy Pomodoro session.');
        }
        if (session.completed) {
            res.status(200).json({ success: true, message: 'Session already completed', session });
            return;
        }
        // Update session as completed
        const updatedSession = await client_1.default.pomodoroSession.update({
            where: { id },
            data: {
                completed: true,
                endedAt: new Date()
            }
        });
        // Update student's accumulated focus time
        const student = await client_1.default.student.update({
            where: { id: studentId },
            data: {
                totalFocusTime: {
                    increment: session.durationMin
                }
            }
        });
        // Recalculate risk since study time changes the normalized timeSpent
        const newRiskScore = await (0, risk_service_1.recalculate)(studentId);
        res.status(200).json({
            success: true,
            session: updatedSession,
            totalFocusTime: student.totalFocusTime,
            newRiskScore
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * Get Pomodoro session history for the student.
 * Supports ?week=current filter.
 */
async function getSessionHistory(req, res, next) {
    try {
        const studentId = req.user?.studentId;
        if (!studentId) {
            throw new apiError_1.ApiError(400, 'Không tìm thấy thông tin Student.');
        }
        const { week } = req.query;
        const whereClause = { studentId };
        if (week === 'current') {
            const today = new Date();
            // Calculate Monday of current week
            const day = today.getDay();
            const diff = today.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(today.setDate(diff));
            monday.setHours(0, 0, 0, 0);
            whereClause.createdAt = {
                gte: monday
            };
        }
        const sessions = await client_1.default.pomodoroSession.findMany({
            where: whereClause,
            include: {
                task: {
                    include: {
                        skill: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.status(200).json({
            success: true,
            sessions
        });
    }
    catch (error) {
        next(error);
    }
}
