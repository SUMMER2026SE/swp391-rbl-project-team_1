import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DOCTORS_DIR = path.join(process.cwd(), "public", "doctors");

async function generatePlaceholders() {
    try {
        console.log("🎨 Generating placeholder images...\n");

        // Create directory if needed
        if (!fs.existsSync(DOCTORS_DIR)) {
            fs.mkdirSync(DOCTORS_DIR, { recursive: true });
            console.log(`📁 Created directory: ${DOCTORS_DIR}\n`);
        }

        // Get all doctors
        const doctors = await prisma.doctor.findMany({
            orderBy: { id: "asc" },
        });

        console.log(`👨‍⚕️  Found ${doctors.length} doctors. Generating placeholders...\n`);

        // Since we can't generate images without additional libraries, 
        // we'll use a workaround: create simple SVG placeholders
        for (let i = 1; i <= doctors.length; i++) {
            const doctorId = `doctor_${i}`;
            const doctor = doctors.find((d) => d.id === doctorId);

            if (!doctor) continue;

            // Create a simple SVG placeholder
            const initials = doctor.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);

            const svgContent = `
<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <rect width="200" height="200" fill="#3B82F6"/>
  <circle cx="100" cy="80" r="40" fill="#FFFFFF"/>
  <path d="M 100 120 Q 60 150 50 180 L 150 180 Q 140 150 100 120 Z" fill="#FFFFFF"/>
  <text x="100" y="155" font-size="48" font-weight="bold" text-anchor="middle" fill="#3B82F6">
    ${initials}
  </text>
  <text x="100" y="195" font-size="14" text-anchor="middle" fill="#FFFFFF">
    ${doctor.name.slice(0, 20)}
  </text>
</svg>
            `;

            const filename = `${doctorId}.svg`;
            const filepath = path.join(DOCTORS_DIR, filename);

            fs.writeFileSync(filepath, svgContent);
            console.log(`✅ Generated: ${filename}`);
        }

        // Update database
        console.log("\n🔄 Updating database...\n");
        let updatedCount = 0;

        for (const doctor of doctors) {
            const filename = `/public/doctors/${doctor.id}.svg`;
            await prisma.doctor.update({
                where: { id: doctor.id },
                data: { avatar: filename },
            });
            updatedCount++;
        }

        console.log(`✅ Updated ${updatedCount} doctor avatars in database`);
        console.log(`\n✨ Placeholder generation completed!`);
        console.log(`📂 All files saved to: ${DOCTORS_DIR}`);
    } catch (error) {
        console.error("❌ Error generating placeholders:", error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

generatePlaceholders();
