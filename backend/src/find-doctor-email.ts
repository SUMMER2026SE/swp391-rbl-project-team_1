import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      email: {
        contains: "nhan"
      }
    },
    select: {
      email: true,
      role: true,
      doctorId: true
    }
  });

  console.log("=== Matches for 'nhan' ===");
  console.log(users);
}

main()
  .catch((err) => console.error(err))
  .finally(() => prisma.$disconnect());
