import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const allQs = await prisma.quizQuestion.findMany();
  let deleted = 0;
  for (const q of allQs) {
    if (q.question.includes('[MOCK QUESTION') || 
        (typeof q.options === 'string' && q.options.includes('Đáp án chính xác được hệ thống xác thực'))) {
      await prisma.quizQuestion.delete({ where: { id: q.id } });
      deleted++;
    }
  }
  console.log(`Deleted ${deleted} mock questions from DB.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
