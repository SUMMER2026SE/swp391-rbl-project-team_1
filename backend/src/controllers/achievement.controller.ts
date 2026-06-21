import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAchievements = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    const allAchievements = await prisma.achievement.findMany();
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true }
    });

    const unlockedIds = userAchievements.map(ua => ua.achievementId);
    
    // Group them or just return them with status
    const achievements = allAchievements.map(a => ({
      ...a,
      unlocked: unlockedIds.includes(a.id),
      unlockedAt: userAchievements.find(ua => ua.achievementId === a.id)?.unlockedAt || null
    }));

    res.json({ success: true, achievements });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
