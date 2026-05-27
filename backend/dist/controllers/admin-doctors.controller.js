"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDoctors = getDoctors;
exports.moderateDoctorHandler = moderateDoctorHandler;
exports.getPendingDoctorsHandler = getPendingDoctorsHandler;
exports.approveDoctorHandler = approveDoctorHandler;
exports.rejectDoctorHandler = rejectDoctorHandler;
exports.lockDoctorHandler = lockDoctorHandler;
const admin_doctors_service_1 = require("../services/admin-doctors.service");
const apiError_1 = require("../utils/apiError");
const client_1 = __importDefault(require("../prisma/client"));
/**
 * GET /api/admin/doctors
 * Returns all doctors with specialty, clinic, and userAccount relations.
 */
async function getDoctors(_req, res, next) {
    try {
        const doctors = await (0, admin_doctors_service_1.getAllDoctors)();
        res.json({
            message: "Doctors retrieved successfully",
            count: doctors.length,
            data: doctors,
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * PUT /api/admin/doctors/:id/moderation
 * Moderates a doctor: approve, reject, lock, or unlock.
 */
async function moderateDoctorHandler(req, res, next) {
    try {
        const id = req.params.id;
        if (!id) {
            throw new apiError_1.ApiError("Doctor ID is required", 400);
        }
        const { action, reason } = req.body;
        if (!action) {
            throw new apiError_1.ApiError("Action is required", 400);
        }
        const validActions = ["approve", "reject", "lock", "unlock"];
        if (!validActions.includes(action)) {
            throw new apiError_1.ApiError(`Invalid action. Must be one of: ${validActions.join(", ")}`, 400);
        }
        const doctor = await (0, admin_doctors_service_1.moderateDoctor)(id, {
            action: action,
            reason,
        });
        res.json({
            message: `Doctor ${action}ed successfully`,
            data: doctor,
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/admin/doctors/pending
 * Returns pending doctors.
 */
async function getPendingDoctorsHandler(_req, res, next) {
    try {
        const doctors = await (0, admin_doctors_service_1.getPendingDoctors)();
        res.json({
            message: "Pending doctors retrieved successfully",
            count: doctors.length,
            data: doctors,
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * PATCH /api/admin/doctors/:id/approve
 * Approves a doctor.
 */
async function approveDoctorHandler(req, res, next) {
    try {
        const id = req.params.id;
        if (!id) {
            throw new apiError_1.ApiError("Doctor ID is required", 400);
        }
        const doctor = await (0, admin_doctors_service_1.moderateDoctor)(id, { action: "approve" });
        res.json({
            message: "Doctor approved successfully",
            data: doctor,
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * PATCH /api/admin/doctors/:id/reject
 * Rejects a doctor.
 */
async function rejectDoctorHandler(req, res, next) {
    try {
        const id = req.params.id;
        const { reason } = req.body;
        if (!id) {
            throw new apiError_1.ApiError("Doctor ID is required", 400);
        }
        const doctor = await (0, admin_doctors_service_1.moderateDoctor)(id, { action: "reject", reason });
        res.json({
            message: "Doctor rejected successfully",
            data: doctor,
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * PATCH /api/admin/doctors/:id/lock
 * Toggle lock/unlock of a doctor account.
 */
async function lockDoctorHandler(req, res, next) {
    try {
        const id = req.params.id;
        if (!id) {
            throw new apiError_1.ApiError("Doctor ID is required", 400);
        }
        // Find current lock state
        const current = await client_1.default.doctor.findUnique({ where: { id } });
        if (!current) {
            throw new apiError_1.ApiError("Doctor not found", 404);
        }
        const action = current.isLocked ? "unlock" : "lock";
        const doctor = await (0, admin_doctors_service_1.moderateDoctor)(id, { action });
        res.json({
            message: `Doctor ${action}ed successfully`,
            data: doctor,
        });
    }
    catch (error) {
        next(error);
    }
}
