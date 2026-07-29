import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const searchMedicines = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query } = req.query;
    let medicines;

    if (query && typeof query === 'string' && query.trim() !== '') {
      medicines = await prisma.medicine.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { activeIngredient: { contains: query, mode: 'insensitive' } }
          ]
        },
        take: 20
      });
    } else {
      medicines = await prisma.medicine.findMany({ take: 20 });
    }

    res.status(200).json({ success: true, data: medicines });
  } catch (error: any) {
    console.error('Error searching medicines:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};
