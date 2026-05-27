"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllDoctors = getAllDoctors;
exports.getAllSpecialties = getAllSpecialties;
exports.getDoctorById = getDoctorById;
exports.getDoctorByUserId = getDoctorByUserId;
const client_1 = __importDefault(require("../prisma/client"));
const apiError_1 = require("../utils/apiError");
async function getAllDoctors(specialtySlug) {
    const whereClause = specialtySlug
        ? { specialty: { slug: specialtySlug } }
        : {};
    return client_1.default.doctor.findMany({
        where: whereClause,
        include: {
            specialty: true,
        },
        orderBy: { name: "asc" },
    });
}
async function getAllSpecialties() {
    return client_1.default.specialty.findMany({
        include: {
            _count: {
                select: { doctors: true },
            },
        },
        orderBy: { name: "asc" },
    });
}
async function getDoctorById(id) {
    const doctor = await client_1.default.doctor.findUnique({
        where: { id },
    });
    if (!doctor) {
        throw new apiError_1.ApiError("Doctor not found", 404);
    }
    return doctor;
}
/**
 * Finds the Doctor record linked to a User account.
 * Used when a DOCTOR-role user accesses protected doctor endpoints.
 *
 * @param userId - The User.id from the JWT token
 * @returns Doctor record or throws 404/403
 */
async function getDoctorByUserId(userId) {
    // User.doctorId links the User account to the Doctor record
    const user = await client_1.default.user.findUnique({
        where: { id: userId },
        select: { doctorId: true, role: true },
    });
    if (!user) {
        throw new apiError_1.ApiError("User account not found", 404);
    }
    if (!user.doctorId) {
        throw new apiError_1.ApiError("Doctor profile not linked to this account. Contact an administrator.", 403);
    }
    const doctor = await client_1.default.doctor.findUnique({
        where: { id: user.doctorId },
        include: { specialty: true },
    });
    if (!doctor) {
        throw new apiError_1.ApiError("Doctor profile not found", 404);
    }
    return doctor;
}
