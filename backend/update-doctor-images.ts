import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DOCTORS_DIR = path.join(process.cwd(), "public", "doctors");

interface DoctorImageMap {
    [doctorId: string]: string;
}

async function updateDoctorImages() {
    try {
        console.log("🖼️  Scanning for doctor images...\n");

        // Create doctors directory if it doesn't exist
        if (!fs.existsSync(DOCTORS_DIR)) {
            fs.mkdirSync(DOCTORS_DIR, { recursive: true });
            console.log(`📁 Created directory: ${DOCTORS_DIR}`);
        }

        // Get all image files from the doctors directory
        const imageFiles = fs.readdirSync(DOCTORS_DIR);
        const supportedFormats = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
        const doctorImages = imageFiles.filter((file) =>
            supportedFormats.some((ext) => file.toLowerCase().endsWith(ext))
        );

        console.log(`📷 Found ${doctorImages.length} image files:\n`);
        doctorImages.forEach((file) => console.log(`   - ${file}`));
        console.log();

        if (doctorImages.length === 0) {
            console.log("⚠️  No images found in public/doctors/ directory");
            console.log(
                "📌 Instructions:\n" +
                "   1. Add doctor images to: public/doctors/\n" +
                "   2. Name them as: doctor_1.jpg, doctor_2.png, etc.\n" +
                "   3. Run this script again\n"
            );
            await prisma.$disconnect();
            return;
        }

        // Update doctors with matching images
        let updatedCount = 0;
        for (const imageFile of doctorImages) {
            const imagePath = `/public/doctors/${imageFile}`;
            const doctorIdMatch = imageFile.match(/doctor_(\d+)/i);

            if (doctorIdMatch) {
                const doctorId = `doctor_${doctorIdMatch[1]}`;

                const doctor = await prisma.doctor.findUnique({
                    where: { id: doctorId },
                });

                if (doctor) {
                    await prisma.doctor.update({
                        where: { id: doctorId },
                        data: { avatar: imagePath },
                    });
                    console.log(`✅ Updated ${doctorId}: ${imagePath}`);
                    updatedCount++;
                } else {
                    console.log(`⚠️  No doctor found with ID: ${doctorId}`);
                }
            } else {
                console.log(
                    `⚠️  Could not parse doctor ID from filename: ${imageFile}`
                );
            }
        }

        console.log(`\n✨ Updated ${updatedCount} doctor images!`);
    } catch (error) {
        console.error("❌ Error updating doctor images:", error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

updateDoctorImages();
