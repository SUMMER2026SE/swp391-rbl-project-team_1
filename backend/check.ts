import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const clinicCount = await prisma.clinic.count();
  console.log("=== CLINIC COUNT ===", clinicCount);

  if (clinicCount > 0) {
    const clinics = await prisma.clinic.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
        _count: {
          select: { doctors: true }
        }
      }
    });
    console.log("Sample clinics:", JSON.stringify(clinics, null, 2));
  }
}

main()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
