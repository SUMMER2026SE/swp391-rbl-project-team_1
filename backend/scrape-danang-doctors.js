const axios = require("axios");
const fs = require("fs");
const path = require("path");

// Directly load Prisma client
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

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
            "https://bvdn.danang.gov.vn/resources/1/u_phongctxh/MOI2/bs%20cương639144497432208239.jpg",
        experience: 18,
    },
    {
        name: "Lê Hữu Trì",
        credentials: "TSBS",
        specialty: "Ngoại Thần kinh",
        position: "Phó Trưởng khoa",
        imageUrl:
            "https://bvdn.danang.gov.vn/resources/1/u_phongctxh/MOI2/2676151132976090001639144497506330793.jpg",
        experience: 15,
    },
    {
        name: "Bùi Thị Lựu",
        credentials: "ĐDCKI",
        specialty: "Điều dưỡng",
        position: "Điều dưỡng trưởng khoa",
        imageUrl:
            "https://bvdn.danang.gov.vn/resources/1/u_phongctxh/MOI2/2aOboQWY898Hmqpofl88Vf3RGHYJyrEEUCJ5ua5A639144497555514584.jpg",
        experience: 12,
    },
];

const hospitalDoctors = [
    {
        name: "Lê Quang Chí Cường",
        specialty: "Ngoại Thần kinh",
        position: "Bác sĩ",
        imageUrl:
            "https://bvdn.danang.gov.vn/resources/1/KHOAPHONG/NGOAI%20THAN%20KINH/ngoaitk2639008908126332809.jpg",
        experience: 10,
    },
];

async function downloadImage(url, filename) {
    try {
        // Create public/doctors directory if it doesn't exist
        const doctorsDir = path.join(process.cwd(), "public", "doctors");
        if (!fs.existsSync(doctorsDir)) {
            fs.mkdirSync(doctorsDir, { recursive: true });
        }

        const filepath = path.join(doctorsDir, filename);

        // Download image with timeout
        const response = await axios.get(url, {
            responseType: "arraybuffer",
            timeout: 10000,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
        });

        // Save image
        fs.writeFileSync(filepath, response.data);

        console.log(`✓ Downloaded: ${filename}`);
        return `/doctors/${filename}`;
    } catch (error) {
        console.error(`✗ Failed to download ${url}:`, error.message);
        return ""; // Return empty string if download fails
    }
}

async function addDoctorToDatabase(name, specialty, experience, avatarPath) {
    try {
        // Check if doctor already exists
        const existing = await prisma.doctor.findFirst({
            where: {
                name: name,
                specialty: specialty,
            },
        });

        if (existing) {
            console.log(`  Doctor already exists: ${name}`);
            // Update avatar if we have a new one and it's different
            if (avatarPath && existing.avatar !== avatarPath) {
                await prisma.doctor.update({
                    where: { id: existing.id },
                    data: { avatar: avatarPath },
                });
                console.log(`  ✓ Updated avatar for: ${name}`);
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

        console.log(`  ✓ Added doctor: ${name} (${specialty}) - Exp: ${experience} years`);
    } catch (error) {
        console.error(`  ✗ Error adding doctor ${name}:`, error.message);
    }
}

async function main() {
    console.log("Starting to scrape and add doctors from Đà Nẵng Hospital...\n");

    // Combine all doctors
    const allDoctors = [...doctorsData, ...hospitalDoctors];

    // Download images and add doctors
    for (const doctor of allDoctors) {
        // Generate filename from doctor name
        const sanitizedName = doctor.name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
        const filename = `${sanitizedName}_${Date.now()}.jpg`;

        console.log(`Processing: ${doctor.name}`);

        // Download image
        const avatarPath = await downloadImage(doctor.imageUrl, filename);

        // Add to database
        if (avatarPath) {
            await addDoctorToDatabase(doctor.name, doctor.specialty, doctor.experience, avatarPath);
        } else {
            // Add without image if download fails
            console.log(`  ℹ Adding doctor without image...`);
            await addDoctorToDatabase(doctor.name, doctor.specialty, doctor.experience, "");
        }

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log("\n✓ Done! Doctors have been added/updated in the database.\n");

    // Display summary
    const doctors = await prisma.doctor.findMany({
        where: {
            specialty: "Ngoại Thần kinh",
        },
    });

    console.log(`📊 Summary - Total Neurosurgery doctors in database: ${doctors.length}`);
    console.log("━".repeat(60));
    doctors.forEach((doc) => {
        const imageStatus = doc.avatar ? "✓ has image" : "✗ no image";
        console.log(`• ${doc.name} (${doc.experience} years) [${imageStatus}]`);
    });
    console.log("━".repeat(60));
}

main()
    .catch((error) => {
        console.error("Fatal error:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
