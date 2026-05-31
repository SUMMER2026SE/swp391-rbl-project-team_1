"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitComplaint = submitComplaint;
exports.listMyComplaints = listMyComplaints;
exports.getMyComplaint = getMyComplaint;
const complaint_service_1 = require("../services/complaint.service");
const apiError_1 = require("../utils/apiError");
async function submitComplaint(req, res, next) {
    try {
        const userId = req.user?.userId;
        if (!userId)
            throw new apiError_1.ApiError("Authentication required", 401);
        const { message } = req.body;
        const complaint = await (0, complaint_service_1.createComplaint)(userId, message || "");
        res.status(201).json({ message: "Complaint submitted successfully", data: complaint });
    }
    catch (error) {
        next(error);
    }
}
async function listMyComplaints(req, res, next) {
    try {
        const userId = req.user?.userId;
        if (!userId)
            throw new apiError_1.ApiError("Authentication required", 401);
        const complaints = await (0, complaint_service_1.getUserComplaints)(userId);
        res.json({ message: "Complaints retrieved", count: complaints.length, data: complaints });
    }
    catch (error) {
        next(error);
    }
}
async function getMyComplaint(req, res, next) {
    try {
        const userId = req.user?.userId;
        const id = req.params.id;
        if (!userId)
            throw new apiError_1.ApiError("Authentication required", 401);
        const complaint = await (0, complaint_service_1.getComplaintByIdForUser)(userId, id);
        res.json({ message: "Complaint retrieved", data: complaint });
    }
    catch (error) {
        next(error);
    }
}
