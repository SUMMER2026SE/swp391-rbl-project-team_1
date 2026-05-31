import prisma from "./src/prisma/client";

async function deleteAllClinics() {
    try {
        console.log("🗑️  Starting deletion of all clinics...");

        // First, unlink all doctors from clinics
        const unlinkResult = await prisma.doctor.updateMany({
            data: { clinicId: null },
        });
        console.log(`✅ Unlinked ${unlinkResult.count} doctors from clinics`);

        // Then delete all clinics
        const deleteResult = await prisma.clinic.deleteMany({});
        console.log(`✅ Deleted ${deleteResult.count} clinics`);

        console.log("✨ All clinics have been deleted successfully!");
    } catch (error) {
        console.error("❌ Error deleting clinics:", error);
    } finally {
        await prisma.$disconnect();
    }
}

deleteAllClinics();
