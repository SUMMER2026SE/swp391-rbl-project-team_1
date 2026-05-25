import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanAndMigrateDoctorIds() {
    try {
        console.log("🔧 Starting doctor ID migration with cleanup...\n");

        // First, check what doctors we have
        const allCurrentDoctors = await prisma.doctor.findMany({
            orderBy: { id: "asc" },
        });

        console.log(`📋 Current doctors in database: ${allCurrentDoctors.length}`);
        console.log(`First 5 IDs: ${allCurrentDoctors.slice(0, 5).map(d => d.id).join(", ")}\n`);

        // Disable foreign key constraints
        await prisma.$executeRaw`SET session_replication_role = REPLICA;`;
        console.log("🔓 Foreign key constraints disabled\n");

        // Delete any existing doctor_N records to start fresh
        console.log("🗑️  Cleaning up any existing sequential doctor IDs...");
        const toDelete = await prisma.doctor.findMany({
            where: {
                id: {
                    startsWith: "doctor_",
                },
            },
        });

        if (toDelete.length > 0) {
            // Delete related records first
            for (const doc of toDelete) {
                await prisma.$executeRaw`DELETE FROM "Appointment" WHERE "doctorId" = ${doc.id};`;
                await prisma.$executeRaw`DELETE FROM "DoctorSchedule" WHERE "doctorId" = ${doc.id};`;
                await prisma.$executeRaw`UPDATE "User" SET "doctorId" = NULL WHERE "doctorId" = ${doc.id};`;
                await prisma.$executeRaw`DELETE FROM "Doctor" WHERE id = ${doc.id};`;
            }
            console.log(`✅ Deleted ${toDelete.length} old sequential doctor records\n`);
        }

        // Get fresh list of doctors
        const doctorsToMigrate = await prisma.doctor.findMany({
            orderBy: { createdAt: "asc" },
        });

        console.log(`📋 Migrating ${doctorsToMigrate.length} doctors...\n`);

        // Now migrate each doctor
        for (let i = 0; i < doctorsToMigrate.length; i++) {
            const oldId = doctorsToMigrate[i].id;
            const newId = `doctor_${i + 1}`;

            try {
                // Copy doctor record with new ID
                await prisma.$executeRaw`
                    INSERT INTO "Doctor" (id, name, specialty, experience, hospital, avatar, "createdAt")
                    SELECT ${newId}, name, specialty, experience, hospital, avatar, "createdAt"
                    FROM "Doctor" WHERE id = ${oldId};
                `;

                // Update all appointments
                await prisma.$executeRaw`
                    UPDATE "Appointment" SET "doctorId" = ${newId} WHERE "doctorId" = ${oldId};
                `;

                // Update all doctor schedules
                await prisma.$executeRaw`
                    UPDATE "DoctorSchedule" SET "doctorId" = ${newId} WHERE "doctorId" = ${oldId};
                `;

                // Update all users
                await prisma.$executeRaw`
                    UPDATE "User" SET "doctorId" = ${newId} WHERE "doctorId" = ${oldId};
                `;

                // Delete old doctor record
                await prisma.$executeRaw`DELETE FROM "Doctor" WHERE id = ${oldId}`;

                console.log(`✅ [${i + 1}/${doctorsToMigrate.length}] ${oldId} → ${newId}`);
            } catch (error) {
                console.error(`❌ Error migrating ${oldId}:`, error);
                throw error;
            }
        }

        // Update all hospitals
        console.log("\n🏥 Updating all hospitals...");
        await prisma.$executeRaw`UPDATE "Doctor" SET hospital = 'Bệnh Viện Đa Khoa Đà Nẵng';`;
        console.log("✅ All hospitals updated to 'Bệnh Viện Đa Khoa Đà Nẵng'");

        // Re-enable foreign key constraints
        await prisma.$executeRaw`SET session_replication_role = DEFAULT;`;

        console.log(`\n✨ Migration completed successfully!`);
        console.log(`✅ All ${doctorsToMigrate.length} doctors now have IDs: doctor_1 to doctor_${doctorsToMigrate.length}`);

        // Verify
        const verifyDoctors = await prisma.doctor.findMany({
            take: 10,
            orderBy: { id: "asc" },
        });

        console.log("\n📊 Final results (first 10 doctors):");
        verifyDoctors.forEach((doc) => {
            console.log(`  ${doc.id.padEnd(12)} | ${doc.name.padEnd(40)} | ${doc.specialty}`);
        });
    } catch (error) {
        console.error("❌ Error during migration:", error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

cleanAndMigrateDoctorIds();
