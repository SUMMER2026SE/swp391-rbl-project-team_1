import prisma from '../prisma/client';

/**
 * Robustly assign a badge to a student. Uses upsert to avoid race conditions (Prisma P2002 unique constraint violations).
 * @param studentId The student's ID
 * @param condition The badge's unique condition string (e.g. 'FIRST_QUIZ')
 * @param earnedAt Custom earned date (e.g. for backfilling), defaults to now()
 */
async function awardBadge(studentId: string, condition: string, earnedAt: Date = new Date()) {
  try {
    const badge = await prisma.badge.findFirst({ where: { condition } });
    if (!badge) return; // Badge not seeded

    // Upsert avoids race condition if two concurrent requests try to grant the same badge
    await prisma.studentBadge.upsert({
      where: {
        studentId_badgeId: {
          studentId,
          badgeId: badge.id
        }
      },
      update: {}, // Do nothing if exists
      create: {
        studentId,
        badgeId: badge.id,
        earnedAt
      }
    });
  } catch (error) {
    console.error(`[BadgeService] Failed to award badge ${condition} to student ${studentId}:`, error);
  }
}

export async function evaluateQuizBadges(studentId: string) {
  try {
    const attempts = await prisma.quizAttempt.findMany({
      where: { studentId },
      orderBy: { createdAt: 'asc' },
      take: 1
    });

    if (attempts.length > 0) {
      await awardBadge(studentId, 'FIRST_QUIZ', attempts[0].createdAt);
    }
  } catch (error) {
    console.error(`[BadgeService] evaluateQuizBadges error:`, error);
  }
}

export async function evaluatePomodoroBadges(studentId: string) {
  try {
    const sessions = await prisma.pomodoroSession.findMany({
      where: { studentId, completed: true },
      orderBy: { createdAt: 'asc' }
    });

    const totalMin = sessions.reduce((sum, s) => sum + s.durationMin, 0);
    const totalHours = totalMin / 60;

    if (totalHours >= 4.1) {
      // Find the session that tipped the scale to >= 4.1h
      let runningTotal = 0;
      let earnedAt = new Date();
      for (const s of sessions) {
        runningTotal += s.durationMin;
        if (runningTotal / 60 >= 4.1) {
          earnedAt = s.createdAt;
          break;
        }
      }
      await awardBadge(studentId, 'FOCUS_CHAMPION', earnedAt);
    }
  } catch (error) {
    console.error(`[BadgeService] evaluatePomodoroBadges error:`, error);
  }
}

export async function evaluateMasteryBadges(studentId: string) {
  try {
    const masteries = await prisma.skillMastery.findMany({
      where: { studentId },
      orderBy: { updatedAt: 'asc' }
    });

    // SKILL_MASTERED
    const masteredSkill = masteries.find(m => m.masteryLevel >= 0.8);
    if (masteredSkill) {
      await awardBadge(studentId, 'SKILL_MASTERED', masteredSkill.updatedAt);
    }

    // KNOWLEDGE_SEEKER
    if (masteries.length >= 3) {
      // The 3rd mastery to be created is the one that triggered the badge
      const thirdMastery = masteries[2];
      await awardBadge(studentId, 'KNOWLEDGE_SEEKER', thirdMastery.createdAt);
    }
  } catch (error) {
    console.error(`[BadgeService] evaluateMasteryBadges error:`, error);
  }
}

export async function evaluateStreakBadges(studentId: string) {
  try {
    const attempts = await prisma.quizAttempt.findMany({
      where: { studentId },
      select: { createdAt: true }
    });

    const pomodoros = await prisma.pomodoroSession.findMany({
      where: { studentId, completed: true },
      select: { createdAt: true }
    });

    const activeDates = new Set<string>();
    attempts.forEach(a => activeDates.add(a.createdAt.toISOString().split('T')[0]));
    pomodoros.forEach(p => activeDates.add(p.createdAt.toISOString().split('T')[0]));

    // Evaluate streak purely historically to find the *first time* they reached 7 or 30 days
    const sortedDates = Array.from(activeDates).sort();
    
    let currentStreak = 0;
    let maxStreak = 0;
    let earnedWeekAt: Date | null = null;
    let earnedMonthAt: Date | null = null;

    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        currentStreak = 1;
      } else {
        const prevDate = new Date(sortedDates[i - 1]);
        const currDate = new Date(sortedDates[i]);
        const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 3600 * 24));
        
        if (diffDays === 1) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
      }

      if (currentStreak >= 7 && !earnedWeekAt) {
        earnedWeekAt = new Date(sortedDates[i]);
      }
      if (currentStreak >= 30 && !earnedMonthAt) {
        earnedMonthAt = new Date(sortedDates[i]);
      }
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
      }
    }

    if (maxStreak > 0) {
      await awardBadge(studentId, 'SPEED_LEARNER', new Date(sortedDates[0])); // Simply requires >0 streak
    }
    if (earnedWeekAt) {
      await awardBadge(studentId, 'WEEK_WARRIOR', earnedWeekAt);
    }
    if (earnedMonthAt) {
      await awardBadge(studentId, 'MONTH_MASTER', earnedMonthAt);
    }

  } catch (error) {
    console.error(`[BadgeService] evaluateStreakBadges error:`, error);
  }
}
