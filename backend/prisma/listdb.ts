import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const doctors = await prisma.doctor.findMany({
    select: { id: true, name: true },
    where: { status: 'APPROVED' },
    take: 30
  });
  const pkgs = await prisma.medicalPackage.findMany({ select: { id: true, name: true } });
  console.log('=== DOCTORS ===');
  doctors.forEach((d: any) => console.log(`  ${d.id} | ${d.name}`));
  console.log('\n=== PACKAGES ===');
  pkgs.forEach((p: any) => console.log(`  ${p.id} | ${p.name}`));
}
main().catch(console.error).finally(async () => { await prisma.$disconnect(); });
