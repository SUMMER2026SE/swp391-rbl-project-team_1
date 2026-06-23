import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getPackages = async (req: Request, res: Response): Promise<void> => {
  try {
    const packages = await prisma.medicalPackage.findMany();
    res.status(200).json(packages);
  } catch (error) {
    console.error("Error fetching packages:", error);
    res.status(500).json({ message: "Server error fetching packages" });
  }
};
