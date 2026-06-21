import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BADGES = [
  {
    condition: 'FIRST_QUIZ',
    imageUrl: '🎯',
    name: 'First Quiz',
    description: 'Làm bài trắc nghiệm BKT lần đầu tiên',
    points: 10
  },
  {
    condition: 'WEEK_WARRIOR',
    imageUrl: '🔥',
    name: 'Week Warrior',
    description: 'Duy trì chuỗi học tập liên tiếp 7 ngày',
    points: 50
  },
  {
    condition: 'MONTH_MASTER',
    imageUrl: '🏆',
    name: 'Month Master',
    description: 'Duy trì chuỗi học tập liên tiếp 30 ngày',
    points: 200
  },
  {
    condition: 'SKILL_MASTERED',
    imageUrl: '⭐',
    name: 'Skill Mastered',
    description: 'Đạt tỉ lệ thành thạo >= 80% cho một kỹ năng',
    points: 100
  },
  {
    condition: 'SPEED_LEARNER',
    imageUrl: '🚀',
    name: 'Speed Learner',
    description: 'Đạt tốc độ hoàn thành công việc cao',
    points: 20
  },
  {
    condition: 'FOCUS_CHAMPION',
    imageUrl: '🍅',
    name: 'Focus Champion',
    description: 'Hoàn thành 10 phiên Pomodoro tập trung',
    points: 50
  },
  {
    condition: 'KNOWLEDGE_SEEKER',
    imageUrl: '📚',
    name: 'Knowledge Seeker',
    description: 'Tham gia học tập và giải phóng 3 kỹ năng mới',
    points: 30
  }
];

async function seed() {
  console.log('Seeding Badges...');
  await prisma.studentBadge.deleteMany();
  await prisma.badge.deleteMany();

  for (const b of BADGES) {
    await prisma.badge.create({
      data: b
    });
  }
  console.log('Badges seeded successfully!');
}

seed()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
