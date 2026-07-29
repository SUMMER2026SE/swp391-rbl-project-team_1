const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findFirst({ where: { doctorId: 'doctor_26' } });
  console.log("User:", user);
}
main().finally(() => prisma.$disconnect());
