const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.medicalPackage.updateMany({ data: { price: 5000 } });
  await prisma.doctor.updateMany({ data: { price: 2000 } });
  console.log('Prices updated');
}
main().finally(() => prisma.$disconnect());
