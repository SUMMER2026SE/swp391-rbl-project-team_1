"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyApprovedDoctor = verifyApprovedDoctor;
exports.validateDoctorAvailable = validateDoctorAvailable;
const client_1 = require("@prisma/client");
const client_2 = __importDefault(require("../prisma/client"));
const apiError_1 = require("../utils/apiError");
/**
 * Ensures the authenticated DOCTOR account is approved and not locked.
 * Must run after verifyToken + verifyDoctor.
 */
async function verifyApprovedDoctor(req, _res, next) {
    try {
        if (!req.user?.userId) {
            next(new apiError_1.ApiError("User not authenticated", 401));
            return;
        }
        const doctor = await client_2.default.doctor.findFirst({
            where: { userAccount: { id: req.user.userId } },
            select: { id: true, status: true, isLocked: true },
        });
        if (!doctor) {
            next(new apiError_1.ApiError("Doctor profile not found", 404));
            return;
        }
        if (doctor.status !== client_1.DoctorStatus.APPROVED) {
            next(new apiError_1.ApiError("Your doctor account is not approved yet. Please wait for admin approval.", 403));
            return;
        }
        if (doctor.isLocked) {
            next(new apiError_1.ApiError("Your doctor account has been locked. Contact support.", 403));
            return;
        }
        next();
    }
    catch (error) {
        next(error);
    }
}
/**
 * Validates a doctor (by doctorId) is approved and not locked — for booking/public actions.
 */
async function validateDoctorAvailable(req, _res, next) {
    try {
        const { doctorId } = req.body;
        if (!doctorId) {
            next(new apiError_1.ApiError("doctorId is required", 400));
            return;
        }
        const doctor = await client_2.default.doctor.findUnique({
            where: { id: doctorId },
            select: { status: true, isLocked: true },
        });
        if (!doctor) {
            next(new apiError_1.ApiError("Doctor not found", 404));
            return;
        }
        if (doctor.status !== client_1.DoctorStatus.APPROVED) {
            next(new apiError_1.ApiError("This doctor is not available for booking", 400));
            return;
        }
        if (doctor.isLocked) {
            next(new apiError_1.ApiError("This doctor is currently unavailable", 400));
            return;
        }
        next();
    }
    catch (error) {
        next(error);
    }
}
