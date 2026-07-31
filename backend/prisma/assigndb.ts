import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const pkgs = await prisma.medicalPackage.findMany({ select: { id: true, name: true } });
  const doctors = await prisma.doctor.findMany({
    select: { id: true, name: true, specialtyId: true },
    take: 10,
    where: { status: 'APPROVED' }
  });

  if (pkgs.length === 0 || doctors.length < 2) {
    console.log("Not enough packages or doctors.");
    return;
  }

  for (const pkg of pkgs) {
    console.log(`Assigning doctors to package: ${pkg.name}`);
    const primary1 = doctors[0];
    const primary2 = doctors[1];
    const backup1 = doctors[2 % doctors.length];
    const backup2 = doctors[3 % doctors.length];

    await prisma.medicalPackage.update({
      where: { id: pkg.id },
      data: {
        primaryDoctors: { connect: [{ id: primary1.id }, { id: primary2.id }] },
        backupDoctors: { connect: [{ id: backup1.id }, { id: backup2.id }] }
      }
    });
  }

  console.log("Successfully assigned doctors to all packages.");
}
main().catch(console.error).finally(async () => { await prisma.$disconnect(); });
