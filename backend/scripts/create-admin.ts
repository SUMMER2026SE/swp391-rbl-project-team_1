import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
    const adminEmail = "admin@gmail.com";
    const plainPassword = "123456";

    // Hash the password
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Upsert admin user
    const adminUser = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
            password: hashedPassword,
            role: Role.ADMIN,
            fullName: "System Admin",
            isLocked: false,
        },
        create: {
            email: adminEmail,
            password: hashedPassword,
            role: Role.ADMIN,
            fullName: "System Admin",
            isLocked: false,
        },
    });

    console.log("Admin user created/updated successfully:", adminUser.email);
}

main()
    .catch((e) => {
        console.error("Error creating admin user:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
