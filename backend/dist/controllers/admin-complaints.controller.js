"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getComplaints = getComplaints;
exports.resolveComplaintHandler = resolveComplaintHandler;
const admin_complaints_service_1 = require("../services/admin-complaints.service");
const apiError_1 = require("../utils/apiError");
/**
 * GET /api/admin/complaints
 * Returns all complaints with user relation.
 */
async function getComplaints(_req, res, next) {
    try {
        const complaints = await (0, admin_complaints_service_1.getAllComplaints)();
        res.json({
            message: "Complaints retrieved successfully",
            count: complaints.length,
            data: complaints,
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * PUT /api/admin/complaints/:id/resolve
 * Marks a complaint as resolved.
 */
async function resolveComplaintHandler(req, res, next) {
    try {
        const id = req.params.id;
        if (!id) {
            throw new apiError_1.ApiError("Complaint ID is required", 400);
        }
        const complaint = await (0, admin_complaints_service_1.resolveComplaint)(id);
        res.json({
            message: "Complaint resolved successfully",
            data: complaint,
        });
    }
    catch (error) {
        next(error);
    }
}
