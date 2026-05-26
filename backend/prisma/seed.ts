import bcrypt from "bcrypt";
import { PrismaClient, Role, AppointmentStatus } from "@prisma/client";

const prisma = new PrismaClient();

interface SeedConfig {
    adminEmail: string;
    adminPassword: string;
    doctorCount: number;
    patientCount: number;
    appointmentsPerDoctor: number;
}

const SEED_CONFIG: SeedConfig = {
    adminEmail: "admin@medbooking.com",
    adminPassword: "admin@123",
    doctorCount: 5,
    patientCount: 10,
    appointmentsPerDoctor: 3,
};

interface DoctorData {
    name: string;
    specialty: string;
    experience: number;
    hospital: string;
    avatar: string;
}

const DOCTOR_DATA: DoctorData[] = [
    {
        name: "Dr. Nguyễn Văn An",
        specialty: "Tim mạch",
        experience: 15,
        hospital: "Bệnh viện Chợ Rẫy",
        avatar: "/public/doctors/dr-nguyen-van-an.jpg",
    },
    {
        name: "Dr. Trần Thị Bảo",
        specialty: "Nhi khoa",
        experience: 12,
        hospital: "Bệnh viện Nhi đồng 1",
        avatar: "/public/doctors/dr-tran-thi-bao.jpg",
    },
    {
        name: "Dr. Lê Minh Châu",
        specialty: "Chỉnh hình",
        experience: 10,
        hospital: "Bệnh viện Traumatology",
        avatar: "/public/doctors/dr-le-minh-chau.jpg",
    },
    {
        name: "Dr. Phạm Hồng Giang",
        specialty: "Da liễu",
        experience: 8,
        hospital: "Bệnh viện Da liễu Trung ương",
        avatar: "/public/doctors/dr-pham-hong-giang.jpg",
    },
    {
        name: "Dr. Võ Thị Minh Huệ",
        specialty: "Thần kinh",
        experience: 18,
        hospital: "Bệnh viện Đại học Y Dược",
        avatar: "/public/doctors/dr-vo-thi-minh-hue.jpg",
    },
];

const DEFAULT_PASSWORD = "user@123";
const BCRYPT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
}

function removeDiacritics(str: string): string {
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[đĐ]/g, "d")
        .toLowerCase();
}

function generateDoctorEmail(name: string): string {
    const cleanName = removeDiacritics(name)
        .replace("dr. ", "")
        .replace(/\s+/g, ".");
    return `${cleanName}@medbooking.com`;
}

async function seedAdminUser(): Promise<string> {
    console.log("🔐 Seeding admin user...");

    const hashedPassword = await hashPassword(SEED_CONFIG.adminPassword);

    const admin = await prisma.user.upsert({
        where: { email: SEED_CONFIG.adminEmail },
        update: {},
        create: {
            email: SEED_CONFIG.adminEmail,
            password: hashedPassword,
            role: Role.ADMIN,
        },
    });

    console.log(`✅ Admin user created: ${SEED_CONFIG.adminEmail}`);
    return admin.id;
}

async function seedDoctors(): Promise<string[]> {
    console.log(`👨‍⚕️  Seeding ${SEED_CONFIG.doctorCount} doctors...`);

    const doctorIds: string[] = [];

    for (let i = 0; i < SEED_CONFIG.doctorCount; i++) {
        const doctorData = DOCTOR_DATA[i];
        const email = generateDoctorEmail(doctorData.name);
        const hashedPassword = await hashPassword(SEED_CONFIG.adminPassword);

        // Create Doctor record
        const doctor = await prisma.doctor.upsert({
            where: { id: `doctor_${i}` },
            update: doctorData,
            create: {
                id: `doctor_${i}`,
                ...doctorData,
            },
        });

        // Create User account for doctor and link it
        await prisma.user.upsert({
            where: { email },
            update: {
                role: Role.DOCTOR,
                doctorId: doctor.id,
            },
            create: {
                email,
                password: hashedPassword,
                role: Role.DOCTOR,
                doctorId: doctor.id,
            },
        });

        doctorIds.push(doctor.id);
        console.log(`  ✅ Doctor created: ${doctorData.name} (${email})`);
    }

    return doctorIds;
}

async function seedDoctorSchedules(doctorIds: string[]): Promise<void> {
    console.log("📅 Seeding doctor schedules...");

    // Schedule: Monday to Friday, 8 AM to 5 PM
    const scheduleConfig = [
        { dayOfWeek: 1, startTime: "08:00", endTime: "17:00" }, // Monday
        { dayOfWeek: 2, startTime: "08:00", endTime: "17:00" }, // Tuesday
        { dayOfWeek: 3, startTime: "08:00", endTime: "17:00" }, // Wednesday
        { dayOfWeek: 4, startTime: "08:00", endTime: "17:00" }, // Thursday
        { dayOfWeek: 5, startTime: "08:00", endTime: "17:00" }, // Friday
    ];

    for (const doctorId of doctorIds) {
        for (let i = 0; i < scheduleConfig.length; i++) {
            const config = scheduleConfig[i];

            await prisma.doctorSchedule.upsert({
                where: {
                    id: `schedule_${doctorId}_${config.dayOfWeek}`,
                },
                update: config,
                create: {
                    id: `schedule_${doctorId}_${config.dayOfWeek}`,
                    doctorId,
                    ...config,
                    isAvailable: true,
                },
            });
        }

        console.log(`  ✅ Schedules created for doctor ${doctorId}`);
    }
}

async function seedPatients(): Promise<string[]> {
    console.log(`👥 Seeding ${SEED_CONFIG.patientCount} patients...`);

    const patientIds: string[] = [];
    const hashedPassword = await hashPassword(DEFAULT_PASSWORD);

    for (let i = 1; i <= SEED_CONFIG.patientCount; i++) {
        const email = `patient.${i}@medbooking.com`;

        const user = await prisma.user.upsert({
            where: { email },
            update: {},
            create: {
                email,
                password: hashedPassword,
                role: Role.USER,
            },
        });

        patientIds.push(user.id);
        console.log(`  ✅ Patient created: ${email}`);
    }

    return patientIds;
}

async function seedAppointments(
    patientIds: string[],
    doctorIds: string[]
): Promise<void> {
    console.log("📋 Seeding appointments...");

    const statuses: AppointmentStatus[] = [
        AppointmentStatus.PENDING,
        AppointmentStatus.CONFIRMED,
        AppointmentStatus.COMPLETED,
        AppointmentStatus.CANCELLED,
    ];

    let appointmentIndex = 0;

    for (const doctorId of doctorIds) {
        for (let i = 0; i < SEED_CONFIG.appointmentsPerDoctor; i++) {
            const patientId = patientIds[appointmentIndex % patientIds.length];
            const status = statuses[i % statuses.length];

            // Generate appointment date (next 30 days)
            const appointmentDate = new Date();
            appointmentDate.setDate(appointmentDate.getDate() + i + 1);
            appointmentDate.setHours(10 + i, 0, 0, 0);

            await prisma.appointment.create({
                data: {
                    userId: patientId,
                    doctorId,
                    appointmentDate,
                    status,
                    notes: `Appointment for doctor checkup - ${status}`,
                },
            });

            console.log(
                `  ✅ Appointment created: ${patientId} with doctor ${doctorId} - ${status}`
            );
            appointmentIndex++;
        }
    }
}

async function main(): Promise<void> {
    try {
        console.log("\n🌱 Starting database seed...\n");

        // Clear existing data (optional - comment out if you want to preserve data)
        console.log("🗑️  Clearing existing data...");
        await prisma.appointment.deleteMany({});
        await prisma.doctorSchedule.deleteMany({});
        await prisma.doctor.deleteMany({});
        await prisma.user.deleteMany({});
        await prisma.oTP.deleteMany({});
        console.log("✅ Data cleared\n");

        // Seed users and data
        await seedAdminUser();
        console.log("");

        const doctorIds = await seedDoctors();
        console.log("");

        const patientIds = await seedPatients();
        console.log("");

        await seedDoctorSchedules(doctorIds);
        console.log("");

        await seedAppointments(patientIds, doctorIds);
        console.log("");

        console.log("✨ Database seed completed successfully!\n");
        console.log("📊 Summary:");
        console.log(`  - 1 Admin user (${SEED_CONFIG.adminEmail})`);
        console.log(
            `  - ${SEED_CONFIG.doctorCount} Doctor accounts with profiles`
        );
        console.log(`  - ${SEED_CONFIG.patientCount} Patient accounts`);
        console.log(
            `  - ${SEED_CONFIG.doctorCount * 5} Doctor schedules (Mon-Fri)`
        );
        console.log(
            `  - ${SEED_CONFIG.doctorCount * SEED_CONFIG.appointmentsPerDoctor} Appointments`
        );
        console.log("\n🔐 Default credentials:");
        console.log(`  Admin: ${SEED_CONFIG.adminEmail} / ${SEED_CONFIG.adminPassword}`);
        console.log(`  Doctors: doctor.<name>@medbooking.com / ${SEED_CONFIG.adminPassword}`);
        console.log(`  Patients: patient.X@medbooking.com / ${DEFAULT_PASSWORD}`);
        console.log("\n");
    } catch (error) {
        console.error("❌ Error during seed:", error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main();
