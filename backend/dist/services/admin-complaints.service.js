"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllComplaints = getAllComplaints;
exports.resolveComplaint = resolveComplaint;
const client_1 = __importDefault(require("../prisma/client"));
const client_2 = require("@prisma/client");
const apiError_1 = require("../utils/apiError");
/**
 * Returns all complaints with user relation.
 */
async function getAllComplaints() {
    return client_1.default.complaint.findMany({
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    role: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
}
/**
 * Marks a complaint as resolved.
 */
async function resolveComplaint(id) {
    const complaint = await client_1.default.complaint.findUnique({ where: { id } });
    if (!complaint) {
        throw new apiError_1.ApiError("Complaint not found", 404);
    }
    if (complaint.status === client_2.ComplaintStatus.RESOLVED) {
        throw new apiError_1.ApiError("Complaint is already resolved", 400);
    }
    return client_1.default.complaint.update({
        where: { id },
        data: { status: client_2.ComplaintStatus.RESOLVED },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    role: true,
                },
            },
        },
    });
}
