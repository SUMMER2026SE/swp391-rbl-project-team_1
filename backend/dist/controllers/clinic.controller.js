"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listClinics = listClinics;
exports.getClinic = getClinic;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function listClinics(_req, res, next) {
    try {
        const clinics = await prisma.clinic.findMany();
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
        const clinic = await prisma.clinic.findUnique({
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
