const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function backup() {
  console.log('Starting DB Backup...');
  try {
    const backupData = {
      users: await prisma.user.findMany(),
      profiles: await prisma.studentProfile.findMany(),
      otp: await prisma.otp.findMany(),
      templates: await prisma.roadmapTemplate.findMany({ include: { phases: { include: { tasks: true } } } }),
      roadmaps: await prisma.roadmap.findMany({ include: { phases: { include: { tasks: true } } } }),
      skills: await prisma.skill.findMany(),
      masteries: await prisma.skillMastery.findMany(),
      knowledge: await prisma.knowledgeUnit.findMany(),
      quizzes: await prisma.quizQuestion.findMany(),
      attempts: await prisma.quizAttempt.findMany(),
      pomodoros: await prisma.pomodoroSession.findMany(),
      badges: await prisma.badge.findMany(),
      activityLog: await prisma.activityLog.findMany(),
      risk: await prisma.riskProfile.findMany(),
      redFlags: await prisma.redFlag.findMany(),
    };

    fs.writeFileSync('db_backup.json', JSON.stringify(backupData, null, 2));
    console.log('Backup completed: db_backup.json');
  } catch (err) {
    console.error('Backup failed', err);
  } finally {
    await prisma.$disconnect();
  }
}

backup();
