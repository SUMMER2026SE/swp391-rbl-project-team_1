import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const clinicIdsToDelete = ["clinic_hai_chau", "clinic_family", "clinic_hoan_my"];

  console.log("🚀 Starting deletion of 3 clinics:", clinicIdsToDelete);

  for (const id of clinicIdsToDelete) {
    try {
      const clinic = await prisma.clinic.findUnique({
        where: { id }
      });

      if (!clinic) {
        console.log(`⚠️ Clinic with ID ${id} not found.`);
        continue;
      }

      console.log(`\nProcessing clinic: ${clinic.name} (${id})`);

      // 1. Clear clinicId from Doctor records linked to this clinic
      const doctorUpdate = await prisma.doctor.updateMany({
        where: { clinicId: id },
        data: { clinicId: null }
      });
      console.log(`   Updated ${doctorUpdate.count} doctors to set clinicId = null.`);

      // 2. Clear clinicId from User records (managers, etc.) linked to this clinic
      const userUpdate = await prisma.user.updateMany({
        where: { clinicId: id },
        data: { clinicId: null }
      });
      console.log(`   Updated ${userUpdate.count} users to set clinicId = null.`);

      // 3. Delete the clinic itself
      await prisma.clinic.delete({
        where: { id }
      });
      console.log(`   🗑️ Deleted clinic ${clinic.name} successfully.`);
    } catch (error) {
      console.error(`❌ Error deleting clinic ${id}:`, error);
    }
  }

  console.log("\n🎉 Deletion process completed successfully.");
}

main()
  .catch((err) => console.error("❌ Process crashed:", err))
  .finally(() => prisma.$disconnect());
