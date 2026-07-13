import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import prisma from "../prisma/client";
import { ApiError } from "../utils/apiError";

/**
 * POST /api/video-calls/log
 * Logs a video call after it ends.
 */
export async function logVideoCall(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new ApiError("Authentication required", 401);
        }

        const {
            appointmentId,
            conversationId,
            callerId,
            calleeId,
            startedAt,
            endedAt,
            durationSeconds,
            callType
        } = req.body;

        if (!callerId || !calleeId || !startedAt || !callType) {
            throw new ApiError("Missing required fields", 400);
        }

        const log = await prisma.videoCallLog.create({
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
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/video-calls/history
 * Gets the video call history for the authenticated user (either as caller or callee).
 */
export async function getVideoCallHistory(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new ApiError("Authentication required", 401);
        }

        const logs = await prisma.videoCallLog.findMany({
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
    } catch (error) {
        next(error);
    }
}
