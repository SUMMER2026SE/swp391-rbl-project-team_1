import { PrismaClient } from '@prisma/client';
import {
  evaluateQuizBadges,
  evaluatePomodoroBadges,
  evaluateMasteryBadges,
  evaluateStreakBadges
} from '../src/services/badge.service';

const prisma = new PrismaClient();

async function backfill() {
  console.log('Starting Badge Backfill Process...');
  const students = await prisma.student.findMany({
    select: { id: true, userId: true }
  });

  console.log(`Found ${students.length} students. Backfilling...`);

  for (const student of students) {
    console.log(`Evaluating badges for student ${student.id}...`);
    // Await all sequential logic to prevent memory/connection exhaustion
    await evaluateQuizBadges(student.id);
    await evaluatePomodoroBadges(student.id);
    await evaluateMasteryBadges(student.id);
    await evaluateStreakBadges(student.id);
  }

  console.log('Badge Backfill Process completed successfully!');
}

backfill()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
