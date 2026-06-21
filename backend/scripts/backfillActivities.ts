import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export function getVietnamDateString(date: Date): string {
  const dateInVietnam = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return dateInVietnam.toISOString().split('T')[0];
}

async function backfill() {
  console.log('Starting ActivityLog Backfill Process...');

  // Xoá trắng ActivityLog để backfill lại từ đầu với schema mới
  await prisma.activityLog.deleteMany();
  console.log('Cleared existing ActivityLog data.');
  
  // 1. Backfill QuizAttempts
  const quizzes = await prisma.quizAttempt.findMany();
  console.log(`Backfilling ${quizzes.length} Quiz Attempts...`);
  for (const q of quizzes) {
    const activityDate = getVietnamDateString(q.createdAt);
    await prisma.activityLog.upsert({
      where: {
        studentId_actionType_referenceId_activityDate: {
          studentId: q.studentId,
          actionType: 'QUIZ_ATTEMPT',
          referenceId: q.id, // referenceId
          activityDate
        }
      },
      update: {},
      create: {
        studentId: q.studentId,
        actionType: 'QUIZ_ATTEMPT',
        referenceId: q.id,
        activityDate,
        description: `Question: ${q.questionId}`,
        createdAt: q.createdAt
      }
    });
  }

  // 2. Backfill PomodoroSessions
  const pomodoros = await prisma.pomodoroSession.findMany({
    where: { completed: true }
  });
  console.log(`Backfilling ${pomodoros.length} completed Pomodoro Sessions...`);
  for (const p of pomodoros) {
    const createdAt = p.endedAt || p.createdAt;
    const activityDate = getVietnamDateString(createdAt);
    await prisma.activityLog.upsert({
      where: {
        studentId_actionType_referenceId_activityDate: {
          studentId: p.studentId,
          actionType: 'POMODORO_COMPLETED',
          referenceId: p.id,
          activityDate
        }
      },
      update: {},
      create: {
        studentId: p.studentId,
        actionType: 'POMODORO_COMPLETED',
        referenceId: p.id,
        activityDate,
        description: `Session: ${p.id}`,
        createdAt
      }
    });
  }

  // 3. Backfill Tasks (only DONE)
  const tasks = await prisma.task.findMany({
    where: { status: 'DONE' }
  });
  console.log(`Backfilling ${tasks.length} completed Tasks...`);
  for (const t of tasks) {
    const createdAt = t.completedAt || t.updatedAt;
    const activityDate = getVietnamDateString(createdAt);
    await prisma.activityLog.upsert({
      where: {
        studentId_actionType_referenceId_activityDate: {
          studentId: t.studentId,
          actionType: 'TASK_COMPLETED',
          referenceId: t.id,
          activityDate
        }
      },
      update: {},
      create: {
        studentId: t.studentId,
        actionType: 'TASK_COMPLETED',
        referenceId: t.id,
        activityDate,
        description: `Task: ${t.id}`,
        createdAt
      }
    });
  }

  console.log('ActivityLog Backfill Process completed successfully!');
}

backfill()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
