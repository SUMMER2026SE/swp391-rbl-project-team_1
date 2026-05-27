import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const doctors = await prisma.doctor.findMany({ include: { userAccount: true } });
  for (const doc of doctors) {
    if (doc.userAccount && doc.name) {
      await prisma.user.update({
        where: { id: doc.userAccount.id },
        data: { fullName: doc.name }
      });
      console.log(`Updated user ${doc.userAccount.email} with name ${doc.name}`);
    }
  }
}
main();
