import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== USERS IN DATABASE ===");
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      fullName: true,
      doctorId: true,
      clinicId: true
    }
  });

  console.log(`Total users found: ${users.length}`);
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch((err) => console.error(err))
  .finally(() => prisma.$disconnect());
