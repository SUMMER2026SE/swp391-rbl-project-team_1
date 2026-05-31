"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplaintStatus = void 0;
exports.createComplaint = createComplaint;
exports.getUserComplaints = getUserComplaints;
exports.getComplaintByIdForUser = getComplaintByIdForUser;
const client_1 = require("@prisma/client");
Object.defineProperty(exports, "ComplaintStatus", { enumerable: true, get: function () { return client_1.ComplaintStatus; } });
const client_2 = __importDefault(require("../prisma/client"));
const apiError_1 = require("../utils/apiError");
async function createComplaint(userId, message) {
    if (!message || message.trim().length < 10) {
        throw new apiError_1.ApiError("Complaint message must be at least 10 characters", 400);
    }
    return client_2.default.complaint.create({
        data: { userId, message: message.trim() },
        include: {
            user: { select: { id: true, email: true, fullName: true, role: true } },
        },
    });
}
async function getUserComplaints(userId) {
    return client_2.default.complaint.findMany({
        where: { userId },
        include: {
            user: { select: { id: true, email: true, fullName: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
    });
}
async function getComplaintByIdForUser(userId, complaintId) {
    const complaint = await client_2.default.complaint.findFirst({
        where: { id: complaintId, userId },
        include: {
            user: { select: { id: true, email: true, fullName: true, role: true } },
        },
    });
    if (!complaint) {
        throw new apiError_1.ApiError("Complaint not found", 404);
    }
    return complaint;
}
