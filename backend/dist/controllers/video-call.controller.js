"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logVideoCall = logVideoCall;
exports.getVideoCallHistory = getVideoCallHistory;
const client_1 = __importDefault(require("../prisma/client"));
const apiError_1 = require("../utils/apiError");
/**
 * POST /api/video-calls/log
 * Logs a video call after it ends.
 */
async function logVideoCall(req, res, next) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new apiError_1.ApiError("Authentication required", 401);
        }
        const { appointmentId, conversationId, callerId, calleeId, startedAt, endedAt, durationSeconds, callType } = req.body;
        if (!callerId || !calleeId || !startedAt || !callType) {
            throw new apiError_1.ApiError("Missing required fields", 400);
        }
        const log = await client_1.default.videoCallLog.create({
            data: {
                appointmentId,
                conversationId,
                callerId,
                calleeId,
                startedAt: new Date(startedAt),
                endedAt: endedAt ? new Date(endedAt) : null,
                durationSeconds: durationSeconds ? Number(durationSeconds) : null,
                callType
            }
        });
        res.status(201).json({ message: "Video call logged successfully", log });
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/video-calls/history
 * Gets the video call history for the authenticated user (either as caller or callee).
 */
async function getVideoCallHistory(req, res, next) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new apiError_1.ApiError("Authentication required", 401);
        }
        const logs = await client_1.default.videoCallLog.findMany({
            where: {
                OR: [
                    { callerId: userId },
                    { calleeId: userId }
                ]
            },
            include: {
                caller: {
                    select: { id: true, fullName: true, avatar: true }
                },
                callee: {
                    select: { id: true, fullName: true, avatar: true }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });
        res.json({ logs });
    }
    catch (error) {
        next(error);
    }
}
