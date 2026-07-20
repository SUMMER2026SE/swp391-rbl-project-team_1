import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { createUserComplaint, getUserComplaints } from "../services/complaint.service";

export async function createComplaintHandler(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const { message, type, subject, images, appointmentId } = req.body;

        if (!message) {
            res.status(400).json({ message: "Nội dung khiếu nại là bắt buộc" });
            return;
        }

        const complaint = await createUserComplaint(
            req.user.userId,
            message,
            type,
            subject,
            images,
            appointmentId
        );

        res.status(201).json({
            message: "Gửi khiếu nại thành công",
            data: complaint
        });
    } catch (error: any) {
        if (error.message.includes("lịch hẹn")) {
            res.status(400).json({ message: error.message });
            return;
        }
        next(error);
    }
}

export async function getUserComplaintsHandler(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const complaints = await getUserComplaints(req.user.userId);
        res.json({
            message: "Lấy danh sách khiếu nại thành công",
            data: complaints
        });
    } catch (error) {
        next(error);
    }
}
