import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../prisma/client';

/**
 * Calculates student learning velocity and ranks them.
 * Query params: period (week/month/all), limit
 */
export async function getLeaderboard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { period, limit } = req.query;
    const limitNum = limit ? parseInt(limit as string, 10) : 10;

    let days = 7;
    if (period === 'month') {
      days = 30;
    } else if (period === 'all') {
      days = 90; // Use 90 days as representation of all-time active window
    }

    const now = new Date();
    const recentHalfStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const priorHalfStart = new Date(now.getTime() - 2 * days * 24 * 60 * 60 * 1000);

    const students = await prisma.student.findMany({
      include: {
        user: {
          select: {
            fullName: true,
            email: true
          }
        },
        skillMasteries: true
      }
    });

    const leaderboardData = [];

    for (const student of students) {
      // 1. Calculate Average Mastery Now
      const masteries = student.skillMasteries;
      const avgMastery = masteries.length > 0
        ? masteries.reduce((sum, m) => sum + m.masteryLevel, 0) / masteries.length
        : 0.3;

      // 2. Fetch BKT history for velocity calculation
      // Recent BKT updates (last `days` days)
      const recentHistory = await prisma.bKTHistory.findMany({
        where: {
          skillMastery: { studentId: student.id },
          createdAt: { gte: recentHalfStart, lte: now }
        },
        select: { masteryAfter: true }
      });

      // Prior BKT updates (the `days` days before)
      const priorHistory = await prisma.bKTHistory.findMany({
        where: {
          skillMastery: { studentId: student.id },
          createdAt: { gte: priorHalfStart, lt: recentHalfStart }
        },
        select: { masteryAfter: true }
      });

      const avgMasteryNow = recentHistory.length > 0
        ? recentHistory.reduce((sum, h) => sum + h.masteryAfter, 0) / recentHistory.length
        : avgMastery;

      const avgMasteryBefore = priorHistory.length > 0
        ? priorHistory.reduce((sum, h) => sum + h.masteryAfter, 0) / priorHistory.length
        : (recentHistory.length > 0 ? recentHistory[recentHistory.length - 1].masteryAfter : 0.3);

      // velocity = delta mastery per day
      const velocity = (avgMasteryNow - avgMasteryBefore) / days;

      // 3. Calculate Streak (consecutive days with quiz or pomodoro)
      const attempts = await prisma.quizAttempt.findMany({
        where: { studentId: student.id },
        select: { createdAt: true }
      });

      const pomodoros = await prisma.pomodoroSession.findMany({
        where: { studentId: student.id, completed: true },
        select: { createdAt: true }
      });

      const activeDates = new Set<string>();
      attempts.forEach(a => activeDates.add(a.createdAt.toISOString().split('T')[0]));
      pomodoros.forEach(p => activeDates.add(p.createdAt.toISOString().split('T')[0]));

      // Count streak back from today
      let streak = 0;
      let checkDate = new Date();
      while (true) {
        const dateStr = checkDate.toISOString().split('T')[0];
        if (activeDates.has(dateStr)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          // If today is not active, but yesterday was, check from yesterday
          if (streak === 0) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yestStr = yesterday.toISOString().split('T')[0];
            if (activeDates.has(yestStr)) {
              streak++;
              checkDate = yesterday;
              checkDate.setDate(checkDate.getDate() - 1);
              continue;
            }
          }
          break;
        }
      }

      leaderboardData.push({
        studentId: student.id,
        fullName: student.user.fullName,
        email: student.user.email,
        currentRiskScore: student.currentRiskScore,
        avgMastery: parseFloat((avgMastery * 100).toFixed(1)), // convert to percentage
        learningVelocity: parseFloat(velocity.toFixed(4)),
        streak,
        trend: velocity >= 0 ? 'UP' : 'DOWN'
      });
    }

    // Sort by velocity DESC
    leaderboardData.sort((a, b) => b.learningVelocity - a.learningVelocity);

    // Limit output
    const topRanked = leaderboardData.slice(0, limitNum);

    // Find the rank of the current user
    const currentStudentId = req.user?.studentId;
    let myRank = -1;
    let myData = null;
    
    if (currentStudentId) {
      myRank = leaderboardData.findIndex(s => s.studentId === currentStudentId) + 1;
      myData = leaderboardData.find(s => s.studentId === currentStudentId) || null;
    }

    res.status(200).json({
      success: true,
      leaderboard: topRanked,
      myRank: {
        rank: myRank,
        details: myData
      }
    });
  } catch (error) {
    next(error);
  }
}
