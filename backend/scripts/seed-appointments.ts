import { PrismaClient, Role, AppointmentStatus, PaymentStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Starting random appointments seed...");

    // 1. Fetch some users with role USER
    let users = await prisma.user.findMany({
        where: { role: Role.USER },
        include: { patientProfiles: true }
    });

    if (users.length === 0) {
        console.log("No users found. Please run the main seed first, or create users.");
        return;
    }

    // 2. Fetch doctors and packages
    const doctors = await prisma.doctor.findMany();
    const packages = await prisma.medicalPackage.findMany();

    if (doctors.length === 0 || packages.length === 0) {
        console.log("No doctors or packages found.");
        return;
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0]; // YYYY-MM-DD

    const appointmentsToCreate: any[] = [];
    
    // Helper to pick a random user and their profile
    const getRandomProfile = () => {
        const user = users[Math.floor(Math.random() * users.length)];
        let profileId = null;
        if (user.patientProfiles && user.patientProfiles.length > 0) {
            profileId = user.patientProfiles[0].id;
        }
        return { userId: user.id, profileId };
    };

    // Helper to generate transaction code
    const genTxCode = () => Math.random().toString(36).substring(2, 10).toUpperCase();

    // 1. Create 19 appointments for Doctor 1 at 08:00
    const doctor1 = doctors[0];
    const time8am = new Date(`${dateStr}T08:00:00`);
    for (let i = 0; i < 19; i++) {
        const { userId, profileId } = getRandomProfile();
        appointmentsToCreate.push({
            userId,
            patientProfileId: profileId,
            doctorId: doctor1.id,
            appointmentDate: time8am,
            status: AppointmentStatus.CONFIRMED,
            transactionCode: genTxCode(),
            amount: 50000,
            paymentAt: new Date()
        });
    }

    // 2. Create 20 appointments for Doctor 1 at 09:00 (Full)
    const time9am = new Date(`${dateStr}T09:00:00`);
    for (let i = 0; i < 20; i++) {
        const { userId, profileId } = getRandomProfile();
        appointmentsToCreate.push({
            userId,
            patientProfileId: profileId,
            doctorId: doctor1.id,
            appointmentDate: time9am,
            status: AppointmentStatus.CONFIRMED,
            transactionCode: genTxCode(),
            amount: 50000,
            paymentAt: new Date()
        });
    }

    // 3. Create 5 appointments for Doctor 1 at 10:00
    const time10am = new Date(`${dateStr}T10:00:00`);
    for (let i = 0; i < 5; i++) {
        const { userId, profileId } = getRandomProfile();
        appointmentsToCreate.push({
            userId,
            patientProfileId: profileId,
            doctorId: doctor1.id,
            appointmentDate: time10am,
            status: AppointmentStatus.CONFIRMED,
            transactionCode: genTxCode(),
            amount: 50000,
            paymentAt: new Date()
        });
    }

    // 4. Create 19 appointments for Package 1 at 08:00
    const pkg1 = packages[0];
    for (let i = 0; i < 19; i++) {
        const { userId, profileId } = getRandomProfile();
        appointmentsToCreate.push({
            userId,
            patientProfileId: profileId,
            packageId: pkg1.id,
            appointmentDate: time8am,
            status: AppointmentStatus.CONFIRMED,
            transactionCode: genTxCode(),
            amount: pkg1.depositAmount || 0,
            paymentAt: new Date()
        });
    }

    console.log(`Inserting ${appointmentsToCreate.length} appointments...`);
    await prisma.appointment.createMany({
        data: appointmentsToCreate,
        skipDuplicates: true
    });

    console.log("✅ Seed complete! You can now check the frontend.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
