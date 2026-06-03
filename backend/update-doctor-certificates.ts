import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type CertificateEntry = {
    title: string;
    issuer: string;
    issuedYear: number;
    description: string;
    imageUrl?: string;
    fileUrl?: string;
};

type CertificateTemplate = {
    titles: string[];
    issuer: string;
    descriptions: string[];
};

const SPECIALTY_TEMPLATES: Record<string, CertificateTemplate> = {
    "Tim Mạch": {
        titles: [
            "Chứng chỉ Tim mạch can thiệp",
            "Chứng chỉ Siêu âm tim chuyên sâu",
            "Chứng chỉ Điều trị rối loạn nhịp tim",
        ],
        issuer: "Đại học Y Hà Nội",
        descriptions: [
            "Chứng chỉ chuyên sâu về tim mạch, giúp bác sĩ %doctor% điều trị và theo dõi bệnh tim chính xác.",
            "Đào tạo về siêu âm tim và chẩn đoán bệnh lý tim mạch ở người lớn và trẻ em.",
        ],
    },
    "Da Liễu": {
        titles: [
            "Chứng chỉ Laser điều trị da",
            "Chứng chỉ Da liễu thẩm mỹ",
            "Chứng chỉ Điều trị mụn và sẹo da",
        ],
        issuer: "Bệnh viện Da liễu Trung ương",
        descriptions: [
            "Chứng chỉ thẩm mỹ da cho bác sĩ %doctor%, chuyên điều trị mụn, thâm và tổn thương da.",
            "Đào tạo kỹ thuật laser và chăm sóc da sau điều trị chuyên sâu.",
        ],
    },
    "Nhi Khoa": {
        titles: [
            "Chứng chỉ Nhi khoa tổng quát",
            "Chứng chỉ Hồi sức nhi",
            "Chứng chỉ Tiêm chủng trẻ em",
        ],
        issuer: "Hội Nhi khoa Việt Nam",
        descriptions: [
            "Chứng chỉ nhi khoa cho bác sĩ %doctor%, chuyên chăm sóc sức khỏe trẻ em và sơ sinh.",
            "Đào tạo cấp cứu nhi và điều trị các bệnh lý nhi khoa phổ biến.",
        ],
    },
    "Nội Tổng Quát": {
        titles: [
            "Chứng chỉ Nội tổng quát",
            "Chứng chỉ Siêu âm nội khoa",
            "Chứng chỉ Điều trị bệnh nội tiết",
        ],
        issuer: "Bệnh viện Bạch Mai",
        descriptions: [
            "Chứng chỉ nội khoa cho bác sĩ %doctor%, nâng cao khả năng chẩn đoán và điều trị tổng quát.",
            "Đào tạo siêu âm và thăm khám nội khoa toàn diện.",
        ],
    },
    "Thần Kinh": {
        titles: [
            "Chứng chỉ Thần kinh can thiệp",
            "Chứng chỉ Điều trị đột quỵ",
            "Chứng chỉ Thần kinh trẻ em",
        ],
        issuer: "Đại học Y Dược TP.HCM",
        descriptions: [
            "Chứng chỉ thần kinh cho bác sĩ %doctor%, chuyên xử lý đột quỵ và bệnh lý hệ thần kinh.",
            "Đào tạo phục hồi chức năng sau chấn thương não và cột sống.",
        ],
    },
    "Chỉnh Hình": {
        titles: [
            "Chứng chỉ Chỉnh hình khớp",
            "Chứng chỉ Phẫu thuật cột sống",
            "Chứng chỉ Phục hồi chức năng chỉnh hình",
        ],
        issuer: "Bệnh viện Việt Đức",
        descriptions: [
            "Chứng chỉ chỉnh hình cho bác sĩ %doctor%, phục vụ điều trị chấn thương và phẫu thuật khớp.",
            "Đào tạo kỹ thuật phục hồi chức năng sau phẫu thuật chỉnh hình.",
        ],
    },
};

const DEFAULT_TEMPLATE: CertificateTemplate = {
    titles: [
        "Chứng chỉ Y khoa chuyên sâu",
        "Chứng chỉ Chăm sóc người bệnh",
        "Chứng chỉ Điều trị đa khoa",
    ],
    issuer: "Hội Y học Việt Nam",
    descriptions: [
        "Chứng chỉ chuyên môn cho bác sĩ %doctor%, giúp nâng cao tay nghề và hiểu biết chuyên sâu.",
        "Đào tạo cập nhật kỹ thuật điều trị và chăm sóc bệnh nhân hiện đại.",
    ],
};

function hashCode(value: string) {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
        hash = (hash << 5) - hash + value.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

function chooseTemplate(specialtyName?: string) {
    return SPECIALTY_TEMPLATES[specialtyName ?? ""] ?? DEFAULT_TEMPLATE;
}

async function main() {
    console.log("🌱 Updating doctor certificates...");

    const doctors = await prisma.doctor.findMany({
        include: { specialty: true },
    });

    for (const doctor of doctors) {
        const specialtyName = doctor.specialty?.name ?? "Y khoa chung";
        const template = chooseTemplate(doctor.specialty?.name);
        const baseIndex = hashCode(doctor.id) % template.titles.length;

        const certificateEntries: CertificateEntry[] = [
            {
                title: `${template.titles[baseIndex]} - ${doctor.name}`,
                issuer: template.issuer,
                issuedYear: 2012 + (hashCode(doctor.name) % 10),
                description: template.descriptions[0].replace("%doctor%", doctor.name),
            },
            {
                title: `${template.titles[(baseIndex + 1) % template.titles.length]} Nâng cao - ${doctor.name}`,
                issuer: template.issuer,
                issuedYear: 2013 + (hashCode(doctor.id) % 10),
                description: template.descriptions[1].replace("%doctor%", doctor.name),
            },
        ];

        await prisma.doctorCertificate.deleteMany({
            where: { doctorId: doctor.id },
        });

        for (const cert of certificateEntries) {
            await prisma.doctorCertificate.create({
                data: {
                    doctorId: doctor.id,
                    title: cert.title,
                    issuer: cert.issuer,
                    issuedYear: cert.issuedYear,
                    description: cert.description,
                },
            });
        }

        console.log(`   ✅ ${doctor.name} (${specialtyName}) - ${certificateEntries.length} certificates`);
    }

    console.log("✨ Doctor certificates updated.");
}

main()
    .catch((error) => {
        console.error("❌ Failed to update doctor certificates:", error);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
