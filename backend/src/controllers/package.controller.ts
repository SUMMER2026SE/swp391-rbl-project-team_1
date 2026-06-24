import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getPackages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { hospital, search } = req.query;
    const where: any = {};
    
    if (hospital) {
      where.hospital = String(hospital);
    }
    
    if (search) {
      where.name = {
        contains: String(search),
        mode: "insensitive"
      };
    }

    const packages = await prisma.medicalPackage.findMany({ where });
    res.status(200).json(packages);
  } catch (error) {
    console.error("Error fetching packages:", error);
    res.status(500).json({ message: "Server error fetching packages" });
  }
};

export const getPackageById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const packageData = await prisma.medicalPackage.findUnique({
      where: { id }
    });
    
    if (!packageData) {
      res.status(404).json({ message: "Package not found" });
      return;
    }
    
    res.status(200).json(packageData);
  } catch (error) {
    console.error("Error fetching package by id:", error);
    res.status(500).json({ message: "Server error fetching package details" });
  }
};
