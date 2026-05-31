import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const clinicIds = ["clinic_danang_hospital", "clinic_hoa_khanh"];

  console.log("🔗 Distributing doctors evenly between clinics:", clinicIds);

  const doctors = await prisma.doctor.findMany({});
  console.log(`Found ${doctors.length} doctors in the database.`);

  if (doctors.length === 0) {
    console.log("⚠️ No doctors found.");
    return;
  }

  let count = 0;
  for (let i = 0; i < doctors.length; i++) {
    const clinicId = clinicIds[i % clinicIds.length];
    await prisma.doctor.update({
      where: { id: doctors[i].id },
      data: { clinicId }
    });
    count++;
  }

  console.log(`🎉 Successfully distributed and linked ${count} doctors evenly to the 2 remaining clinics.`);
}

main()
  .catch((err) => console.error("❌ Process crashed:", err))
  .finally(() => prisma.$disconnect());
