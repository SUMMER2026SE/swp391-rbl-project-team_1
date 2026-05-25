import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function clearOldAvatars() {
    try {
        console.log("🗑️  Clearing old gravatar URLs...\n");

        // Get all doctors with gravatar URLs
        const oldDoctors = await prisma.doctor.findMany({
            where: {
                avatar: {
                    contains: "pravatar.cc",
                },
            },
        });

        console.log(`📊 Found ${oldDoctors.length} doctors with gravatar URLs\n`);

        // Update them to empty string
        const result = await prisma.doctor.updateMany({
            where: {
                avatar: {
                    contains: "pravatar.cc",
                },
            },
            data: {
                avatar: "",
            },
        });

        console.log(`✅ Cleared ${result.count} doctor avatars`);
        console.log(
            "\n📌 Next step: Add new images to public/doctors/ and run:\n" +
            "   npx ts-node update-doctor-images.ts"
        );
    } catch (error) {
        console.error("❌ Error clearing avatars:", error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

clearOldAvatars();
