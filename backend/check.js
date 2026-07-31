const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const records = await prisma.medicalRecord.findMany({
    include: { appointment: true }
  });
  console.log(JSON.stringify(records, null, 2));
}

main().finally(() => prisma.$disconnect());
