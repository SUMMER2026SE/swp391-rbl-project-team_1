import fs from "fs";
import csv from "csv-parse/sync";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface DoctorImageRecord {
    doctorId: string;
    imagePath: string;
}

async function batchUpdateDoctorImages() {
    try {
        const csvFile = process.argv[2];

        if (!csvFile) {
            console.log("⚠️  No CSV file provided!");
            console.log(
                "\n📌 Usage: npx ts-node batch-update-doctor-images.ts <csv-file>"
            );
            console.log(
                "\n📄 CSV File Format:\n" +
                "   doctorId,imagePath\n" +
                "   doctor_1,/public/doctors/doctor_1.jpg\n" +
                "   doctor_2,/public/doctors/doctor_2.jpg\n"
            );
            await prisma.$disconnect();
            return;
        }

        if (!fs.existsSync(csvFile)) {
            throw new Error(`CSV file not found: ${csvFile}`);
        }

        console.log(`📖 Reading CSV file: ${csvFile}\n`);

        const fileContent = fs.readFileSync(csvFile, "utf-8");
        const records: DoctorImageRecord[] = csv.parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
        });

        console.log(`📊 Found ${records.length} records in CSV:\n`);

        let successCount = 0;
        let skipCount = 0;
        let errorCount = 0;

        for (const record of records) {
            const { doctorId, imagePath } = record;

            if (!doctorId || !imagePath) {
                console.log(`⚠️  Skipped - Missing data: ${JSON.stringify(record)}`);
                skipCount++;
                continue;
            }

            try {
                const doctor = await prisma.doctor.findUnique({
                    where: { id: doctorId.trim() },
                });

                if (!doctor) {
                    console.log(
                        `⚠️  Doctor not found: ${doctorId} - skipping`
                    );
                    skipCount++;
                    continue;
                }

                await prisma.doctor.update({
                    where: { id: doctorId.trim() },
                    data: { avatar: imagePath.trim() },
                });

                console.log(`✅ Updated ${doctorId}: ${imagePath}`);
                successCount++;
            } catch (error) {
                console.log(
                    `❌ Error updating ${doctorId}:`,
                    error instanceof Error ? error.message : error
                );
                errorCount++;
            }
        }

        console.log(`\n📊 Results:`);
        console.log(`   ✅ Success: ${successCount}`);
        console.log(`   ⚠️  Skipped: ${skipCount}`);
        console.log(`   ❌ Errors: ${errorCount}`);
        console.log(`\n✨ Batch update completed!`);
    } catch (error) {
        console.error("❌ Error during batch update:", error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

batchUpdateDoctorImages();
