import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function migrateDoctoridSerial() {
    try {
        console.log("🔄 Starting doctor ID migration (UUID → doctor_1, doctor_2, ...)...\n");

        // First, update all hospitals
        const hospitalUpdateResult = await prisma.doctor.updateMany({
            data: {
                hospital: "Bệnh Viện Đa Khoa Đà Nẵng",
            },
        });
        console.log(`✅ Updated ${hospitalUpdateResult.count} doctors' hospital\n`);

        // Get all doctors ordered by createdAt
        const allDoctors = await prisma.doctor.findMany({
            orderBy: {
                createdAt: "asc",
            },
        });

        console.log(`📋 Found ${allDoctors.length} doctors. Creating migration...\n`);

        // Disable foreign key constraints
        await prisma.$executeRaw`SET session_replication_role = REPLICA;`;

        // Step 1: Create temporary doctors table with new IDs and copy data
        for (let i = 0; i < allDoctors.length; i++) {
            const oldId = allDoctors[i].id;
            const newId = `doctor_${i + 1}`;

            // Copy doctor record with new ID
            await prisma.$executeRaw`
                INSERT INTO "Doctor" (id, name, specialty, experience, hospital, avatar, "createdAt")
                SELECT ${newId}, name, specialty, experience, hospital, avatar, "createdAt"
                FROM "Doctor" WHERE id = ${oldId};
            `;

            // Update all appointments that referenced the old doctor ID
            await prisma.$executeRaw`
                UPDATE "Appointment" SET "doctorId" = ${newId} WHERE "doctorId" = ${oldId};
            `;

            // Update all doctor schedules that referenced the old doctor ID
            await prisma.$executeRaw`
                UPDATE "DoctorSchedule" SET "doctorId" = ${newId} WHERE "doctorId" = ${oldId};
            `;

            // Update all users that referenced the old doctor ID
            await prisma.$executeRaw`
                UPDATE "User" SET "doctorId" = ${newId} WHERE "doctorId" = ${oldId};
            `;

            console.log(`✅ Migrated: ${oldId} → ${newId}`);
        }

        // Step 2: Delete old doctor records
        console.log("\n🗑️  Cleaning up old records...");
        for (const doctor of allDoctors) {
            await prisma.$executeRaw`DELETE FROM "Doctor" WHERE id = ${doctor.id}`;
        }

        // Re-enable foreign key constraints
        await prisma.$executeRaw`SET session_replication_role = DEFAULT;`;

        console.log(`\n✨ Migration completed successfully!`);
        console.log(`✅ All ${allDoctors.length} doctors now have sequential IDs: doctor_1 to doctor_${allDoctors.length}`);
        console.log(`✅ All hospitals are: "Bệnh Viện Đa Khoa Đà Nẵng"`);

        // Verify the updates
        const verifyDoctors = await prisma.doctor.findMany({
            take: 5,
            orderBy: { id: "asc" },
        });

        console.log("\n📊 Sample of updated doctors:");
        verifyDoctors.forEach((doc) => {
            console.log(`  ID: ${doc.id} | Name: ${doc.name} | Hospital: ${doc.hospital}`);
        });
    } catch (error) {
        console.error("❌ Error during migration:", error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

migrateDoctoridSerial();
