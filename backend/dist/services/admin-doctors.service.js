"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllDoctors = getAllDoctors;
exports.getPendingDoctors = getPendingDoctors;
exports.moderateDoctor = moderateDoctor;
const client_1 = __importDefault(require("../prisma/client"));
const client_2 = require("@prisma/client");
const apiError_1 = require("../utils/apiError");
/**
 * Returns all doctors with specialty, clinic, and userAccount relations.
 */
async function getAllDoctors() {
    return client_1.default.doctor.findMany({
        include: {
            specialty: true,
            clinic: true,
            userAccount: {
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
 * Returns only pending doctors with relations.
 */
async function getPendingDoctors() {
    return client_1.default.doctor.findMany({
        where: { status: client_2.DoctorStatus.PENDING },
        include: {
            specialty: true,
            clinic: true,
            userAccount: {
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
 * Moderates a doctor: approve, reject, lock, or unlock.
 */
async function moderateDoctor(doctorId, input) {
    const doctor = await client_1.default.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor) {
        throw new apiError_1.ApiError("Doctor not found", 404);
    }
    const updateData = {};
    switch (input.action) {
        case "approve":
            if (doctor.status === client_2.DoctorStatus.APPROVED) {
                throw new apiError_1.ApiError("Doctor is already approved", 400);
            }
            updateData.status = client_2.DoctorStatus.APPROVED;
            updateData.rejectedReason = null;
            break;
        case "reject":
            if (!input.reason) {
                throw new apiError_1.ApiError("Reason is required when rejecting a doctor", 400);
            }
            updateData.status = client_2.DoctorStatus.REJECTED;
            updateData.rejectedReason = input.reason;
            break;
        case "lock":
            if (doctor.isLocked) {
                throw new apiError_1.ApiError("Doctor is already locked", 400);
            }
            updateData.isLocked = true;
            break;
        case "unlock":
            if (!doctor.isLocked) {
                throw new apiError_1.ApiError("Doctor is not locked", 400);
            }
            updateData.isLocked = false;
            break;
        default:
            throw new apiError_1.ApiError(`Invalid action. Must be one of: approve, reject, lock, unlock`, 400);
    }
    return client_1.default.doctor.update({
        where: { id: doctorId },
        data: updateData,
        include: {
            specialty: true,
            clinic: true,
            userAccount: {
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
