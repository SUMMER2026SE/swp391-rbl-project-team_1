import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import prisma from "./src/prisma/client";

// Get current directory
const __filename = new URL("", `file://${__dirname || process.cwd()}/`).pathname;
const __dirname = path.dirname(__filename);

/**
 * Doctor information from the Đà Nẵng Hospital neurosurgery department
 * Extracted from https://bvdn.danang.gov.vn/chi-tiet/khoa-ngoai-than-kinh-14246
 */
const doctorsData = [
    {
        name: "Trà Tấn Hoành",
        credentials: "BSCKII",
        specialty: "Ngoại Thần kinh",
        position: "Trưởng khoa",
        imageUrl:
            "tratanhoanh.jpg",
        experience: 20,
    },
    {
        name: "Lê Quang Chí Cường",
        credentials: "BSCKII",
        specialty: "Ngoại Thần kinh",
        position: "Phó Trưởng khoa",
        imageUrl:
            "lequangchicuong.jpg",
        experience: 18,
    },
    {
        name: "Lê Hữu Trì",
        credentials: "TSBS",
        specialty: "Ngoại Thần kinh",
        position: "Phó Trưởng khoa",
        imageUrl:
            "lehutri.jpg",
        experience: 15,
    },
    {
        name: "Bùi Thị Lựu",
        credentials: "ĐDCKI",
        specialty: "Điều dưỡng",
        position: "Điều dưỡng trưởng khoa",
        imageUrl:
            "buitriluu.jpg",
        experience: 12,
    },
];


async function downloadImage(url: string, filename: string): Promise<string> {
    try {
        // Create public/doctors directory if it doesn't exist
        const doctorsDir = path.join(process.cwd(), "public", "doctors");

        const filepath = path.join(doctorsDir, filename);

        // Download image
        const response = await axios.get(url, {
            responseType: "arraybuffer",
            timeout: 10000,
        });

        // Save image
        fs.writeFileSync(filepath, response.data);

        console.log(`Downloaded: ${filename}`);
        return `/doctors/${filename}`;
    } catch (error) {
        console.error(`Failed to download ${url}:`, error instanceof Error ? error.message : error);
        return ""; // Return empty string if download fails
    }
}

async function addDoctorToDatabase(
    name: string,
    specialty: string,
    experience: number,
    avatarPath: string
): Promise<void> {
    try {
        // Check if doctor already exists
        const existing = await prisma.doctor.findFirst({
            where: {
                name: name,
                specialty: specialty,
            },
        });

        if (existing) {
            console.log(`Doctor already exists: ${name}`);
            // Update avatar if we have a new one
            if (avatarPath) {
                await prisma.doctor.update({
                    where: { id: existing.id },
                    data: { avatar: avatarPath },
                });
                console.log(`Updated avatar for: ${name}`);
            }
            return;
        }

        // Add new doctor
        const doctor = await prisma.doctor.create({
            data: {
                name,
                specialty,
                experience,
                hospital: "Bệnh viện Đa khoa Đà Nẵng",
                avatar: avatarPath,
            },
        });

        console.log(`Added doctor: ${name} (${specialty})`);
    } catch (error) {
        console.error(`Error adding doctor ${name}:`, error instanceof Error ? error.message : error);
    }
}

async function main() {
    console.log("Starting to scrape and add doctors from Đà Nẵng Hospital...\n");

    // Combine all doctors
    const allDoctors = [...doctorsData, ...hospitalDoctors];

    // Download images and add doctors
    for (const doctor of allDoctors) {
        // Generate filename from doctor name
        const filename = `${doctor.name.replace(/\s+/g, "_")}_${Date.now()}.jpg`;

        console.log(`Processing: ${doctor.name}`);

        // Download image
        const avatarPath = await downloadImage(doctor.imageUrl, filename);

        // Add to database
        if (avatarPath) {
            await addDoctorToDatabase(doctor.name, doctor.specialty, doctor.experience, avatarPath);
        } else {
            // Add without image if download fails
            await addDoctorToDatabase(doctor.name, doctor.specialty, doctor.experience, "");
        }

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log("\nDone! Doctors have been added to the database.");

    // Display summary
    const doctors = await prisma.doctor.findMany({
        where: {
            specialty: "Ngoại Thần kinh",
        },
    });

    console.log(`\nTotal Neurosurgery doctors in database: ${doctors.length}`);
    doctors.forEach((doc) => {
        console.log(`- ${doc.name} (${doc.specialty}): ${doc.avatar ? "✓ has image" : "✗ no image"}`);
    });
}

main()
    .catch((error) => {
        console.error("Fatal error:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
