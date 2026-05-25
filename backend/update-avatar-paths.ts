import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Function to remove Vietnamese diacritics and format for avatar path
function formatAvatarPath(name: string): string {
    // Remove titles/prefixes (BS, CK1, CK2, TS, ThS, Ths, Bác sĩ, etc.)
    let cleaned = name;

    // Regex to match and remove common doctor titles
    const titlePattern = /^(bs|ths|ts|thạc\s*sỹ|bác\s*s[ỹi]|bác\s*sĩ|bac\s*si|bac\s*sy|dr\.?|tiến\s*sĩ|thạc\s*sĩ)\s*\.?\s*/gi;
    const rankPattern = /(ck[12i]|ckii|cki|ck1|ck2)\s*\.?\s*/gi;

    // Remove titles and ranks repeatedly until none are left
    let prevCleaned = '';
    while (prevCleaned !== cleaned) {
        prevCleaned = cleaned;
        cleaned = cleaned.replace(titlePattern, '').replace(rankPattern, '').trim();
    }

    // Remove Vietnamese diacritical marks
    const normalized = cleaned
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'd');

    // Convert to lowercase and remove spaces
    const final = normalized
        .toLowerCase()
        .replace(/\s+/g, '') // Remove all whitespace
        .replace(/[^a-z0-9]/g, ''); // Remove any non-alphanumeric characters

    return `/DoctorAvatar/${final}.jpg`;
}

async function updateAvatarPaths() {
    try {
        console.log("🏥 Starting to update doctor avatar paths...");

        const doctors = await prisma.doctor.findMany();
        console.log(`Found ${doctors.length} doctors to update\n`);

        for (const doctor of doctors) {
            const newAvatar = formatAvatarPath(doctor.name);

            await prisma.doctor.update({
                where: { id: doctor.id },
                data: { avatar: newAvatar },
            });

            console.log(`✅ ${doctor.name.padEnd(30)} → ${newAvatar}`);
        }

        console.log(`\n✨ All ${doctors.length} doctor avatars updated successfully!`);
    } catch (error) {
        console.error("❌ Error updating avatars:", error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

updateAvatarPaths();
