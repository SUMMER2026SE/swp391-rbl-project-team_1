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
    adminPassword: "123456",
    doctorCount: 18, // 6 specialties * 3 doctors each = 18 doctors
    patientCount: 15,
    appointmentsPerDoctor: 2,
};

interface SpecialtyData {
    id: string;
    name: string;
    slug: string;
    icon: string;
}

const SPECIALTY_DATA: SpecialtyData[] = [
    { id: "spec_tim_mach", name: "Tim Mạch", slug: "tim-mach", icon: "❤️" },
    { id: "spec_da_lieu", name: "Da Liễu", slug: "da-lieu", icon: "✨" },
    { id: "spec_nhi_khoa", name: "Nhi Khoa", slug: "nhi-khoa", icon: "🧸" },
    { id: "spec_noi_tong_quat", name: "Nội Tổng Quát", slug: "noi-tong-quat", icon: "🩺" },
    { id: "spec_than_kinh", name: "Thần Kinh", slug: "than-kinh", icon: "🧠" },
    { id: "spec_chinh_hinh", name: "Chỉnh Hình", slug: "chinh-hinh", icon: "🦴" },
];

interface DoctorData {
    id: string;
    name: string;
    specialtyId: string;
    experience: number;
    hospital: string;
    avatar: string;
}

const DOCTOR_DATA: DoctorData[] = [
    // Tim Mạch
    {
        id: "doctor_0",
        name: "Dr. Nguyễn Văn An",
        specialtyId: "spec_tim_mach",
        experience: 15,
        hospital: "Bệnh viện Chợ Rẫy",
        avatar: "/public/doctors/dr-nguyen-van-an.jpg",
    },
    {
        id: "doctor_1",
        name: "Dr. Phạm Khắc Anh",
        specialtyId: "spec_tim_mach",
        experience: 18,
        hospital: "Bệnh viện Bạch Mai",
        avatar: "/public/doctors/doctor_1.jpg",
    },
    {
        id: "doctor_2",
        name: "Dr. Lê Thị Cúc",
        specialtyId: "spec_tim_mach",
        experience: 10,
        hospital: "Bệnh viện Tim Hà Nội",
        avatar: "/public/doctors/doctor_2.jpg",
    },
    // Da Liễu
    {
        id: "doctor_3",
        name: "Dr. Phạm Hồng Giang",
        specialtyId: "spec_da_lieu",
        experience: 8,
        hospital: "Bệnh viện Da liễu Trung ương",
        avatar: "/public/doctors/dr-pham-hong-giang.jpg",
    },
    {
        id: "doctor_4",
        name: "Dr. Nguyễn Thị Vân",
        specialtyId: "spec_da_lieu",
        experience: 11,
        hospital: "Bệnh viện Da liễu TP.HCM",
        avatar: "/public/doctors/doctor_4.jpg",
    },
    {
        id: "doctor_5",
        name: "Dr. Trần Ngọc Long",
        specialtyId: "spec_da_lieu",
        experience: 14,
        hospital: "Bệnh viện Da liễu Đà Nẵng",
        avatar: "/public/doctors/doctor_5.jpg",
    },
    // Nhi Khoa
    {
        id: "doctor_6",
        name: "Dr. Trần Thị Bảo",
        specialtyId: "spec_nhi_khoa",
        experience: 12,
        hospital: "Bệnh viện Nhi đồng 1",
        avatar: "/public/doctors/dr-tran-thi-bao.jpg",
    },
    {
        id: "doctor_7",
        name: "Dr. Ngô Văn Dũng",
        specialtyId: "spec_nhi_khoa",
        experience: 9,
        hospital: "Bệnh viện Nhi Trung ương",
        avatar: "/public/doctors/doctor_7.jpg",
    },
    {
        id: "doctor_8",
        name: "Dr. Hoàng Kim Liên",
        specialtyId: "spec_nhi_khoa",
        experience: 16,
        hospital: "Bệnh viện Phụ sản - Nhi Đà Nẵng",
        avatar: "/public/doctors/doctor_8.jpg",
    },
    // Nội Tổng Quát
    {
        id: "doctor_9",
        name: "Dr. Nguyễn Văn Cường",
        specialtyId: "spec_noi_tong_quat",
        experience: 9,
        hospital: "Bệnh viện Trung ương Quân đội 108",
        avatar: "/public/doctors/doctor_9.jpg",
    },
    {
        id: "doctor_10",
        name: "Dr. Đỗ Tuấn Hải",
        specialtyId: "spec_noi_tong_quat",
        experience: 22,
        hospital: "Bệnh viện Bạch Mai",
        avatar: "/public/doctors/doctor_10.jpg",
    },
    {
        id: "doctor_11",
        name: "Dr. Vũ Thị Mai",
        specialtyId: "spec_noi_tong_quat",
        experience: 7,
        hospital: "Bệnh viện Đại học Y Hà Nội",
        avatar: "/public/doctors/doctor_11.jpg",
    },
    // Thần Kinh
    {
        id: "doctor_12",
        name: "Dr. Võ Thị Minh Huệ",
        specialtyId: "spec_than_kinh",
        experience: 18,
        hospital: "Bệnh viện Đại học Y Dược TP.HCM",
        avatar: "/public/doctors/dr-vo-thi-minh-hue.jpg",
    },
    {
        id: "doctor_13",
        name: "Dr. Trương Quang Anh",
        specialtyId: "spec_than_kinh",
        experience: 15,
        hospital: "Bệnh viện Chợ Rẫy",
        avatar: "/public/doctors/doctor_13.jpg",
    },
    {
        id: "doctor_14",
        name: "Dr. Phan Thanh Bình",
        specialtyId: "spec_than_kinh",
        experience: 20,
        hospital: "Bệnh viện Bạch Mai",
        avatar: "/public/doctors/doctor_14.jpg",
    },
    // Chỉnh Hình
    {
        id: "doctor_15",
        name: "Dr. Lê Minh Châu",
        specialtyId: "spec_chinh_hinh",
        experience: 10,
        hospital: "Bệnh viện Chấn thương Chỉnh hình",
        avatar: "/public/doctors/dr-le-minh-chau.jpg",
    },
    {
        id: "doctor_16",
        name: "Dr. Đặng Văn Nam",
        specialtyId: "spec_chinh_hinh",
        experience: 13,
        hospital: "Bệnh viện Việt Đức",
        avatar: "/public/doctors/doctor_16.jpg",
    },
    {
        id: "doctor_17",
        name: "Dr. Hoàng Quốc Việt",
        specialtyId: "spec_chinh_hinh",
        experience: 17,
        hospital: "Bệnh viện Chấn thương Chỉnh hình Trung ương",
        avatar: "/public/doctors/doctor_17.jpg",
    },
];

const DEFAULT_PASSWORD = "123456";
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

    console.log(`   ✅ Admin user created: ${SEED_CONFIG.adminEmail}`);
    return admin.id;
}

async function seedSpecialties(): Promise<void> {
    console.log("🩺 Seeding specialties...");
    for (const spec of SPECIALTY_DATA) {
        await prisma.specialty.upsert({
            where: { id: spec.id },
            update: {
                name: spec.name,
                slug: spec.slug,
                icon: spec.icon,
            },
            create: spec,
        });
        console.log(`   ✅ Specialty created: ${spec.name} (${spec.slug})`);
    }
}

async function seedDoctors(): Promise<string[]> {
    console.log(`👨‍⚕️ Seeding ${SEED_CONFIG.doctorCount} doctors...`);
    const doctorIds: string[] = [];

    for (let i = 0; i < SEED_CONFIG.doctorCount; i++) {
        const doctorData = DOCTOR_DATA[i];
        const email = generateDoctorEmail(doctorData.name);
        const hashedPassword = await hashPassword(SEED_CONFIG.adminPassword);

        // Upsert Doctor record
        const doctor = await prisma.doctor.upsert({
            where: { id: doctorData.id },
            update: {
                name: doctorData.name,
                experience: doctorData.experience,
                hospital: doctorData.hospital,
                avatar: doctorData.avatar,
                specialtyId: doctorData.specialtyId,
            },
            create: doctorData,
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
        console.log(`   ✅ Doctor created: ${doctorData.name} (${email})`);
    }

    return doctorIds;
}

async function seedDoctorSchedules(doctorIds: string[]): Promise<void> {
    console.log("📅 Seeding doctor schedules...");
    const scheduleConfig = [
        { dayOfWeek: 1, startTime: "08:00", endTime: "17:00" }, // Monday
        { dayOfWeek: 2, startTime: "08:00", endTime: "17:00" }, // Tuesday
        { dayOfWeek: 3, startTime: "08:00", endTime: "17:00" }, // Wednesday
        { dayOfWeek: 4, startTime: "08:00", endTime: "17:00" }, // Thursday
        { dayOfWeek: 5, startTime: "08:00", endTime: "17:00" }, // Friday
    ];

    for (const doctorId of doctorIds) {
        for (const config of scheduleConfig) {
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
        console.log(`   ✅ Schedules created for doctor ${doctorId}`);
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
        console.log(`   ✅ Patient created: ${email}`);
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
                `   ✅ Appointment created: ${patientId} with doctor ${doctorId} - ${status}`
            );
            appointmentIndex++;
        }
    }
}

async function main(): Promise<void> {
    try {
        console.log("\n🌱 Starting database seed...\n");

        console.log("🗑️ Clearing existing data...");
        await prisma.appointment.deleteMany({});
        await prisma.doctorSchedule.deleteMany({});
        await prisma.doctor.deleteMany({});
        await prisma.specialty.deleteMany({});
        await prisma.user.deleteMany({});
        await prisma.oTP.deleteMany({});
        console.log("✅ Data cleared\n");

        await seedAdminUser();
        console.log("");

        await seedSpecialties();
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
        console.log(`  - 6 Specialties created`);
        console.log(`  - ${SEED_CONFIG.doctorCount} Doctor accounts with profiles`);
        console.log(`  - ${SEED_CONFIG.patientCount} Patient accounts`);
        console.log(`  - ${SEED_CONFIG.doctorCount * 5} Doctor schedules (Mon-Fri)`);
        console.log(`  - ${SEED_CONFIG.doctorCount * SEED_CONFIG.appointmentsPerDoctor} Appointments`);
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
