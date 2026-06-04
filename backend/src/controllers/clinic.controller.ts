import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function listClinics(
    _req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const clinics = await prisma.clinic.findMany();
        res.json({
            message: "Clinics retrieved successfully",
            count: clinics.length,
            clinics: clinics,
        });
    } catch (error) {
        next(error);
    }
}

export async function getClinic(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { id } = req.params;
        const clinic = await prisma.clinic.findUnique({
            where: { id: id as string },
        });

        if (!clinic) {
            res.status(404).json({ message: "Không tìm thấy bệnh viện" });
            return;
        }

        res.json({
            message: "Clinic retrieved successfully",
            clinic: clinic,
        });
    } catch (error) {
        next(error);
    }
}
