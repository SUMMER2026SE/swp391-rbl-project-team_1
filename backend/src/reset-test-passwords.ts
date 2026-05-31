import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DEFAULT_PASSWORD = "123456";
const BCRYPT_ROUNDS = 10;

async function main() {
  console.log("🔐 Starting to reset passwords of test accounts to 123456...");
  
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, BCRYPT_ROUNDS);

  const testEmails = [
    "admin.test@medbooking.com",
    "manager.test@medbooking.com",
    "doctor.test@medbooking.com",
    "doctor.pending@medbooking.com",
    "patient.test@medbooking.com"
  ];

  for (const email of testEmails) {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (user) {
      await prisma.user.update({
        where: { email },
        data: { password: hashedPassword }
      });
      console.log(`   ✅ Reset password for ${email}`);
    } else {
      console.log(`   ⚠️ Test account ${email} not found.`);
    }
  }

  console.log("🎉 Reset completed successfully.");
}

main()
  .catch((err) => console.error(err))
  .finally(() => prisma.$disconnect());
