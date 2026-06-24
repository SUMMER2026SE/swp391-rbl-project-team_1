import bcrypt from "bcrypt";
import { PrismaClient, Role, AppointmentStatus, DoctorStatus } from "@prisma/client";
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const DEFAULT_PASSWORD = "123456";
const BCRYPT_ROUNDS = 10;

async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
}

const SPECIALTY_DATA = [
    { id: "spec_tim_mach", name: "Tim Mạch", slug: "tim-mach", icon: "❤️" },
    { id: "spec_da_lieu", name: "Da Liễu", slug: "da-lieu", icon: "✨" },
    { id: "spec_nhi_khoa", name: "Nhi Khoa", slug: "nhi-khoa", icon: "🧸" },
    { id: "spec_noi_tong_quat", name: "Nội Tổng Quát", slug: "noi-tong-quat", icon: "🩺" },
    { id: "spec_than_kinh", name: "Thần Kinh", slug: "than-kinh", icon: "🧠" },
    { id: "spec_chinh_hinh", name: "Chỉnh Hình", slug: "chinh-hinh", icon: "🦴" },
    { id: "spec_cap_cuu", name: "Cấp cứu", slug: "cap-cuu", icon: "🚑" },
    { id: "spec_huyet_hoc", name: "Huyết Học", slug: "huyet-hoc", icon: "🩸" },
    { id: "spec_mat", name: "Mắt", slug: "mat", icon: "👁️" },
    { id: "spec_nam_khoa", name: "Nam Khoa", slug: "nam-khoa", icon: "👨" },
    { id: "spec_ngoai_chan_thuong", name: "Ngoại Chấn Thương", slug: "ngoai-chan-thuong", icon: "🩹" },
    { id: "spec_ngoai_than_kinh", name: "Ngoại Thần Kinh", slug: "ngoai-than-kinh", icon: "🧠" },
    { id: "spec_ngoai_tieu_hoa", name: "Ngoại Tiêu Hóa", slug: "ngoai-tieu-hoa", icon: "🍽️" },
    { id: "spec_tai_mui_hong", name: "Tai-Mũi-Họng", slug: "tai-mui-hong", icon: "👂" },
    { id: "spec_san_phu_khoa", name: "Sản-Phụ khoa", slug: "san-phu-khoa", icon: "🤰" }
];

const CLINIC_DATA = [
    {
        id: "clinic_da_nang",
        name: "Bệnh viện Đà Nẵng",
        address: "124 Hải Phòng, Thạch Thang, Hải Châu, Đà Nẵng",
        image: "/clinic/benhviendanang.jpg"
    },
    {
        id: "clinic_hoan_my",
        name: "Bệnh viện Hoàn Mỹ Đà Nẵng",
        address: "291 Nguyễn Văn Linh, Thạc Gián, Thanh Khê, Đà Nẵng",
        image: "/clinic/benhvienhoanmy.jpg"
    }
];

function normalizeSpec(specName: string) {
    if (specName.toLowerCase().includes('tim mạch')) return 'spec_tim_mach';
    if (specName.toLowerCase().includes('da liễu')) return 'spec_da_lieu';
    if (specName.toLowerCase().includes('nhi')) return 'spec_nhi_khoa';
    if (specName.toLowerCase().includes('nội tổng quát')) return 'spec_noi_tong_quat';
    if (specName.toLowerCase().includes('nội tiêu hóa') || specName.toLowerCase().includes('ngoại tiêu hóa')) return 'spec_ngoai_tieu_hoa';
    if (specName.toLowerCase().includes('thần kinh') && !specName.toLowerCase().includes('ngoại')) return 'spec_than_kinh';
    if (specName.toLowerCase().includes('ngoại thần kinh')) return 'spec_ngoai_than_kinh';
    if (specName.toLowerCase().includes('chỉnh hình') && !specName.toLowerCase().includes('ngoại')) return 'spec_chinh_hinh';
    if (specName.toLowerCase().includes('ngoại chấn thương')) return 'spec_ngoai_chan_thuong';
    if (specName.toLowerCase().includes('cấp cứu')) return 'spec_cap_cuu';
    if (specName.toLowerCase().includes('huyết học')) return 'spec_huyet_hoc';
    if (specName.toLowerCase().includes('mắt')) return 'spec_mat';
    if (specName.toLowerCase().includes('nam khoa') || specName.toLowerCase().includes('ngoại tiết niệu')) return 'spec_nam_khoa';
    if (specName.toLowerCase().includes('tai-mũi-hong') || specName.toLowerCase().includes('tai-mũi-họng')) return 'spec_tai_mui_hong';
    if (specName.toLowerCase().includes('sản')) return 'spec_san_phu_khoa';
    return 'spec_noi_tong_quat'; // default
}

async function main() {
    console.log("🌱 Starting fast database seed...");
    
    // Clear DB
    console.log("🗑️ Clearing existing database tables...");
    await prisma.review.deleteMany();
    await prisma.prescription.deleteMany();
    await prisma.medicalRecord.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.complaint.deleteMany();
    await prisma.appointment.deleteMany();
    await prisma.doctorSchedule.deleteMany();
    await prisma.doctorCertificate.deleteMany();
    await prisma.user.deleteMany();
    await prisma.doctor.deleteMany();
    await prisma.clinic.deleteMany();
    await prisma.specialty.deleteMany();
    await prisma.oTP.deleteMany();
    await prisma.medicalPackage.deleteMany();
    await prisma.article.deleteMany();

    // 1. Seed Admin
    const adminPassword = await hashPassword("123456");
    await prisma.user.create({
        data: {
            email: "admin@gmail.com",
            password: adminPassword,
            role: Role.ADMIN,
            fullName: "System Admin"
        }
    });

    // 2. Seed Specialties & Clinics
    await prisma.specialty.createMany({ data: SPECIALTY_DATA });
    await prisma.clinic.createMany({ data: CLINIC_DATA });

    // 3. Read Parsed Doctors
    const doctorsData = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'parsed-doctors.json'), 'utf8'));

    const defaultDoctorPassword = adminPassword;
    
    const dbDoctors = [];
    const dbUsers = [];
    const dbSchedules = [];
    const dbCertificates = [];

    const scheduleConfig = [
        { dayOfWeek: 1, startTime: "08:00", endTime: "17:00" },
        { dayOfWeek: 2, startTime: "08:00", endTime: "17:00" },
        { dayOfWeek: 3, startTime: "08:00", endTime: "17:00" },
        { dayOfWeek: 4, startTime: "08:00", endTime: "17:00" },
        { dayOfWeek: 5, startTime: "08:00", endTime: "17:00" },
    ];

    let doctorIndex = 1;
    for (const doc of doctorsData) {
        const docId = `doctor_${doctorIndex}`;
        const cleanEmail = require('crypto').createHash('md5').update(doc.name).digest('hex').substring(0,8) + "_" + doctorIndex + "@medbooking.com";
        
        let avatarPath = doc.image ? `/AnhBS/${doc.image}` : "/AnhBS/default.jpg";
        let clinicId = doctorIndex % 2 === 0 ? "clinic_hoan_my" : "clinic_da_nang";
        let hospitalName = doctorIndex % 2 === 0 ? "Bệnh viện Hoàn Mỹ Đà Nẵng" : "Bệnh viện Đà Nẵng";

        let specialtyId = normalizeSpec(doc.specialty);
        if (doc.name === "Lê Quang Huy" || doc.name === "Lê Thị Hồng") {
            specialtyId = "spec_than_kinh";
        }

        dbDoctors.push({
            id: docId,
            name: doc.name,
            experience: doc.experience || 10,
            hospital: hospitalName,
            avatar: avatarPath,
            specialtyId: specialtyId,
            clinicId: clinicId,
            status: DoctorStatus.APPROVED,
            price: 150000 + ((doc.experience||10) * 10000),
            phone: `090${Math.floor(1000000 + Math.random() * 9000000)}`,
            description: doc.description || `Bác sĩ chuyên khoa tại ${hospitalName}.`
        });

        dbUsers.push({
            email: cleanEmail,
            password: defaultDoctorPassword,
            role: Role.DOCTOR,
            fullName: doc.name,
            doctorId: docId,
            avatar: avatarPath
        });

        for (const config of scheduleConfig) {
            dbSchedules.push({
                id: `schedule_${docId}_${config.dayOfWeek}`,
                doctorId: docId,
                dayOfWeek: config.dayOfWeek,
                startTime: config.startTime,
                endTime: config.endTime,
                isAvailable: true
            });
        }

        let certYear = 2026 - (doc.experience || 10);
        for (const c of doc.certificates || []) {
            dbCertificates.push({
                doctorId: docId,
                title: c.substring(0, 200),
                issuer: "Bộ Y Tế / Đại học Y",
                issuedYear: certYear,
                description: c
            });
            certYear++;
        }

        doctorIndex++;
    }

    console.log(`👨‍⚕️ Bulk inserting ${dbDoctors.length} doctors...`);
    await prisma.doctor.createMany({ data: dbDoctors });
    console.log(`👤 Bulk inserting users...`);
    await prisma.user.createMany({ data: dbUsers });
    console.log(`📅 Bulk inserting schedules...`);
    await prisma.doctorSchedule.createMany({ data: dbSchedules });
    console.log(`📜 Bulk inserting certificates...`);
    await prisma.doctorCertificate.createMany({ data: dbCertificates });

    console.log(`📦 Bulk inserting packages...`);
    const packageData = [
        {
            name: "Gói khám Thận - Tiết niệu",
            description: "Gói khám Thận - Tiết niệu nhằm phát hiện sớm và chẩn đoán các bệnh lý về thận và đường tiết niệu, giúp bảo vệ sức khỏe toàn diện.",
            price: 1500000,
            hospital: "Bệnh viện Hoàn Mỹ Đà Nẵng",
            estimatedDuration: 60,
            image: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&q=80"
        },
        {
            name: "Gói khám Phổi - Lồng ngực",
            description: "Gói khám Phổi - Lồng ngực nhằm tầm soát, chẩn đoán và theo dõi các bệnh lý liên quan đến hệ hô hấp.",
            price: 1800000,
            hospital: "Bệnh viện Hoàn Mỹ Đà Nẵng",
            estimatedDuration: 90,
            image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80"
        },
        {
            name: "Gói khám Ung thư Vú - Phụ khoa",
            description: "Gói khám Ung thư Vú - Phụ khoa giúp phát hiện sớm các dấu hiệu bất thường, bảo vệ sức khỏe phụ nữ.",
            price: 2500000,
            hospital: "Bệnh viện Hoàn Mỹ Đà Nẵng",
            estimatedDuration: 120,
            image: "https://images.unsplash.com/photo-1581056771107-24ca5f033842?w=400&q=80"
        },
        {
            name: "Gói khám Gan - Mật - Tụy",
            description: "Gói khám Gan - Mật - Tụy giúp chẩn đoán và phát hiện sớm các bệnh lý về tiêu hóa, gan mật.",
            price: 1600000,
            hospital: "Bệnh viện Hoàn Mỹ Đà Nẵng",
            estimatedDuration: 60,
            image: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400&q=80"
        },
        {
            name: "Gói khám Tiền hôn nhân cho Nam/Nữ",
            description: "Tầm soát toàn diện sức khỏe và phát hiện các vấn đề sức khỏe có thể ảnh hưởng đến hạnh phúc gia đình.",
            price: 3500000,
            hospital: "Bệnh viện Hoàn Mỹ Đà Nẵng",
            estimatedDuration: 150,
            image: "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=400&q=80"
        },
        {
            name: "Gói khám Chuyên sâu Nam/Nữ",
            description: "Tầm soát toàn diện sức khỏe và phát hiện các bệnh lý tiềm ẩn. Tầm soát ung thư.",
            price: 4500000,
            hospital: "Bệnh viện Hoàn Mỹ Đà Nẵng",
            estimatedDuration: 180,
            image: "https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?w=400&q=80"
        },
        {
            name: "Gói khám Tổng quát Nam/Nữ",
            description: "Tầm soát toàn diện sức khỏe và phát hiện các bệnh lý tiềm ẩn cơ bản.",
            price: 2200000,
            hospital: "Bệnh viện Hoàn Mỹ Đà Nẵng",
            estimatedDuration: 120,
            image: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400&q=80"
        },
        {
            name: "Gói Tam cá nguyệt 1",
            description: "Gói khám thai trọn gói dành cho 3 tháng đầu thai kỳ.",
            price: 5500000,
            hospital: "Bệnh viện Hoàn Mỹ Đà Nẵng",
            estimatedDuration: 90,
            image: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=400&q=80"
        }
    ];
    await prisma.medicalPackage.createMany({ data: packageData });

    console.log("✅ Seed completed FAST successfully!");
}

main().catch(e => {
    console.error(e);
    process.exit(1);
}).finally(() => {
    prisma.$disconnect();
});
