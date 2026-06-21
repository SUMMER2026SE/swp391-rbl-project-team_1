import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultAchievements = [
  {
    code: 'first_quiz',
    icon: '🎯',
    name: 'First Quiz',
    description: 'Làm bài trắc nghiệm BKT lần đầu tiên',
    criteria: 'quiz_1'
  },
  {
    code: 'week_warrior',
    icon: '🔥',
    name: 'Week Warrior',
    description: 'Duy trì chuỗi học tập liên tiếp 7 ngày',
    criteria: 'streak_7'
  },
  {
    code: 'month_master',
    icon: '🏆',
    name: 'Month Master',
    description: 'Duy trì chuỗi học tập liên tiếp 30 ngày',
    criteria: 'streak_30'
  },
  {
    code: 'skill_mastered',
    icon: '⭐',
    name: 'Skill Mastered',
    description: 'Đạt tỉ lệ thành thạo >= 80% cho một kỹ năng',
    criteria: 'mastery_80'
  },
  {
    code: 'speed_learner',
    icon: '🚀',
    name: 'Speed Learner',
    description: 'Đạt tốc độ hoàn thành công việc cao (Velocity > 0)',
    criteria: 'velocity_0'
  },
  {
    code: 'focus_champion',
    icon: '🍅',
    name: 'Focus Champion',
    description: 'Hoàn thành 10 phiên Pomodoro tập trung',
    criteria: 'pomodoro_10'
  },
  {
    code: 'knowledge_seeker',
    icon: '📚',
    name: 'Knowledge Seeker',
    description: 'Tham gia học tập và giải phóng 3 kỹ năng mới',
    criteria: 'skills_3'
  }
];

async function seed() {
  console.log('Seeding achievements...');
  for (const ach of defaultAchievements) {
    await prisma.achievement.upsert({
      where: { code: ach.code },
      update: {},
      create: ach
    });
  }
  console.log('Achievements seeded!');
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
