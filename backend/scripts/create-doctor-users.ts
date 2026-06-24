import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function createMissingDoctorUsers() {
    try {
        // Find all doctors who don't have a linked user account
        const doctorsWithoutUsers = await prisma.doctor.findMany({
            where: {
                userAccount: null
            }
        });

        console.log(`Found ${doctorsWithoutUsers.length} doctors without user accounts.`);

        if (doctorsWithoutUsers.length === 0) {
            console.log("No action needed.");
            return;
        }

        const defaultPassword = await bcrypt.hash("123456", 12);
        let createdCount = 0;

        for (const doctor of doctorsWithoutUsers) {
            // Generate a unique email for the doctor
            // e.g. doctor_uuid@medbooking.com
            const email = `doctor_${doctor.id.substring(0, 8)}@medbooking.com`;
            
            // Check if email already exists just to be safe
            const existing = await prisma.user.findUnique({
                where: { email }
            });

            if (!existing) {
                await prisma.user.create({
                    data: {
                        email: email,
                        password: defaultPassword,
                        fullName: doctor.name,
                        avatar: doctor.avatar,
                        role: Role.DOCTOR,
                        doctorId: doctor.id
                    }
                });
                createdCount++;
                console.log(`Created user account for doctor ${doctor.name} (${email})`);
            }
        }

        console.log(`Successfully created ${createdCount} user accounts for doctors.`);

    } catch (error) {
        console.error("Error creating doctor user accounts:", error);
    } finally {
        await prisma.$disconnect();
    }
}

createMissingDoctorUsers();
