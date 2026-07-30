"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listClinics = listClinics;
exports.getClinic = getClinic;
const client_1 = __importDefault(require("../prisma/client"));
async function listClinics(_req, res, next) {
    try {
        const clinics = await client_1.default.clinic.findMany();
        res.json({
            message: "Clinics retrieved successfully",
            count: clinics.length,
            clinics: clinics,
        });
    }
    catch (error) {
        next(error);
    }
}
async function getClinic(req, res, next) {
    try {
        const { id } = req.params;
        const clinic = await client_1.default.clinic.findUnique({
            where: { id: id },
        });
        if (!clinic) {
            res.status(404).json({ message: "Không tìm thấy bệnh viện" });
            return;
        }
        res.json({
            message: "Clinic retrieved successfully",
            clinic: clinic,
        });
    }
    catch (error) {
        next(error);
    }
}
