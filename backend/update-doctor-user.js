const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();
async function main() {
  const hashedPassword = await bcrypt.hash('123456', 12);
  await prisma.user.update({
    where: { id: 'a9d43ea3-1098-444b-b265-42eb2aeaf475' },
    data: { email: 'buiquocdat@gmail.com', password: hashedPassword }
  });
  console.log("Updated buiquocdat@gmail.com");
}
main().finally(() => prisma.$disconnect());
