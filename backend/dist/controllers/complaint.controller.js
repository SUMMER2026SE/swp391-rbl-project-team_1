"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createComplaintHandler = createComplaintHandler;
exports.getUserComplaintsHandler = getUserComplaintsHandler;
const complaint_service_1 = require("../services/complaint.service");
async function createComplaintHandler(req, res, next) {
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
        const complaint = await (0, complaint_service_1.createUserComplaint)(req.user.userId, message, type, subject, images, appointmentId);
        res.status(201).json({
            message: "Gửi khiếu nại thành công",
            data: complaint
        });
    }
    catch (error) {
        if (error.message.includes("lịch hẹn")) {
            res.status(400).json({ message: error.message });
            return;
        }
        next(error);
    }
}
async function getUserComplaintsHandler(req, res, next) {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const complaints = await (0, complaint_service_1.getUserComplaints)(req.user.userId);
        res.json({
            message: "Lấy danh sách khiếu nại thành công",
            data: complaints
        });
    }
    catch (error) {
        next(error);
    }
}
