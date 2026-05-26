import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface DoctorData {
    name: string;
    specialty: string;
    experience: number;
    hospital: string;
    avatar: string;
}

// Extracted doctor data from Da Nang hospital website
const DANANG_DOCTORS: DoctorData[] = [
    // Ban Giám đốc
    {
        name: "TS BS. Lê Đức Nhân",
        specialty: "Quản lý y tế",
        experience: 25,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "leducnhan.jpg",
    },
    {
        name: "ThS.BS Phạm Trần Xuân Anh",
        specialty: "Gây mê hồi sức",
        experience: 20,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "phamtranxuananh.jpg",
    },
    {
        name: "BS.CK2 Trần Thị Khánh Ngọc",
        specialty: "Nội khoa",
        experience: 18,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "tranthikhanhngoc.jpg",
    },
    {
        name: "Bác sĩ CK2 Nguyễn Thành Trung",
        specialty: "Ngoại khoa",
        experience: 22,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "nguyenthanhtrung.jpg",
    },

    // Khoa ngoại thần kinh (Neurosurgery)
    {
        name: "Bs CK2. Trà Tấn Hoành",
        specialty: "Ngoại thần kinh",
        experience: 20,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "tratanhoanh.jpg",
    },
    {
        name: "Bs.CK1 Lê Nghiêm Bảo",
        specialty: "Ngoại thần kinh",
        experience: 15,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "lenghiembao.jpg",
    },
    {
        name: "Bs.CK2 Lê Quang Chí Cường",
        specialty: "Ngoại thần kinh",
        experience: 16,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "lequangchicuong.jpg",
    },

    // Khoa ngoại chấn thương chỉnh hình (Orthopedic)
    {
        name: "Bs CK2. Lê Văn Mười",
        specialty: "Chỉnh hình - Chấn thương",
        experience: 22,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "levanmuoi.jpg",
    },
    {
        name: "Bs CK2. Ngô Hạnh",
        specialty: "Chỉnh hình - Cơ xương khớp",
        experience: 18,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "ngohanh.jpg",
    },
    {
        name: "ThS.Bs Phạm Vĩnh Huy",
        specialty: "Chỉnh hình",
        experience: 14,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "phamvinhhuy.jpg",
    },

    // Ngoại lồng ngực (Thoracic Surgery)
    {
        name: "Ths Bs. Thân Trọng Vũ",
        specialty: "Ngoại lồng ngực",
        experience: 19,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "thantrongvu.jpg",
    },
    {
        name: "Bs CKI. Phan Phước An Bình",
        specialty: "Ngoại lồng ngực",
        experience: 12,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "phanphuocanbinh.jpg",
    },
    {
        name: "Bs. Lê Kim Phượng",
        specialty: "Ngoại lồng ngực",
        experience: 13,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "lekimphuong.jpg",
    },
    {
        name: "Ths Bs. Nguyễn Ngọc Tuấn",
        specialty: "Ngoại lồng ngực",
        experience: 14,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "nguyenngoctuan.jpg",
    },
    {
        name: "Ths Bs. Lê Kim Trọng",
        specialty: "Ngoại lồng ngực",
        experience: 11,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "lekimtrong.jpg",
    },

    // Khoa phẫu thuật can thiệp Tim Mạch (Cardiovascular Intervention)
    {
        name: "Ths. BS. Nguyễn Minh Hải",
        specialty: "Tim mạch can thiệp",
        experience: 17,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "nguyenminhhai.jpg",
    },
    {
        name: "Ths. BS. Nguyễn Bá triệu",
        specialty: "Tim mạch can thiệp",
        experience: 15,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "nguyenbatrieu.jpg",
    },

    // Ngoại tiêu hóa (Gastrointestinal Surgery)
    {
        name: "BS CKII. NGUYỄN HOÀNG",
        specialty: "Ngoại tiêu hóa",
        experience: 21,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "nguyenhoang.jpg",
    },
    {
        name: "BS CKI Võ Văn Tường",
        specialty: "Ngoại tiêu hóa",
        experience: 16,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "voquantuong.jpg",
    },
    {
        name: "ThS. LÊ TỰ DŨNG",
        specialty: "Ngoại tiêu hóa",
        experience: 18,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "letudung.jpg",
    },

    // Ngoại tiết niệu (Urology)
    {
        name: "Bs CKII Bùi Chín",
        specialty: "Tiết niệu",
        experience: 23,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "buichin.jpg",
    },
    {
        name: "Bs CKII Võ Trịnh Phú",
        specialty: "Tiết niệu",
        experience: 25,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "votrinhphu.jpg",
    },
    {
        name: "Ths Bs Cao Văn Trí",
        specialty: "Tiết niệu",
        experience: 17,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "caovantri.jpg",
    },
    {
        name: "Ths Bs Phạm Trần Cảnh Nguyên",
        specialty: "Tiết niệu",
        experience: 14,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "phamtrancanhnguyen.jpg",
    },
    {
        name: "Ths Bs Nguyễn Minh Tuấn",
        specialty: "Tiết niệu",
        experience: 13,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "nguyenminhtuan.jpg",
    },

    // Nội tim mạch (Cardiology)
    {
        name: "BS CK2 HUỲNH ĐÌNH LAI",
        specialty: "Tim mạch",
        experience: 24,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "nguyenminhhai.jpg",
    },
    {
        name: "Ths. Bs CKII Hồ Văn Phước",
        specialty: "Tim mạch",
        experience: 19,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "hovanphuoc.jpg",
    },
    {
        name: "Thạc sỹ PHẠM VĂN HÙNG",
        specialty: "Tim mạch",
        experience: 16,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "phamvanhung.jpg",
    },
    {
        name: "Bs CK2 Nguyễn Quốc Việt",
        specialty: "Tim mạch",
        experience: 14,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "nguyenquocviet.jpg",
    },

    // Nội tiêu hóa – gan – mật (Gastroenterology & Hepatology)
    {
        name: "Thạc sỹ Bác sĩ CKII Nguyễn Văn Xứng",
        specialty: "Tiêu hóa - Gan - Mật",
        experience: 20,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "nguyenvanxung.jpg",
    },
    {
        name: "Thạc sỹ Bác sĩ Nguyễn Thị Thuận",
        specialty: "Tiêu hóa - Gan - Mật",
        experience: 15,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "nguyenbothi.thuan.jpg",
    },

    // Nội hô hấp (Respiratory Medicine)
    {
        name: "Bs CKII Nguyễn Hứa Quang",
        specialty: "Hô hấp",
        experience: 21,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "nguyenhuaquang.jpg",
    },
    {
        name: "Ths.Bs Nguyễn Bá Hùng",
        specialty: "Hô hấp",
        experience: 17,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "nguyenbahung.jpg",
    },

    // Nội thận – Nội tiết (Nephrology & Endocrinology)
    {
        name: "Ths.Bs. Đặng Anh Đào",
        specialty: "Thận - Nội tiết",
        experience: 18,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "danganhdao.jpg",
    },
    {
        name: "BS. CK II Thái Bá Sỹ",
        specialty: "Thận - Nội tiết",
        experience: 16,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "thaibasy.jpg",
    },
    {
        name: "Bs. CK. I Nguyễn Hữu Đa",
        specialty: "Thận - Nội tiết",
        experience: 12,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "nguyenhuuda.jpg",
    },

    // Nội thần kinh, cơ xương khớp (Neurology & Rheumatology)
    {
        name: "Thạc sỹ Lê Hoàng Trường",
        specialty: "Thần kinh",
        experience: 19,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "lehoangtruong.jpg",
    },
    {
        name: "BSCKI. Ngô Thị Minh Hiếu",
        specialty: "Thần kinh",
        experience: 13,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "ngothiminhhieu.jpg",
    },

    // Hồi sức tích cực – chống độc (ICU & Toxicology)
    {
        name: "BSCK2. Võ Duy Trinh",
        specialty: "Hồi sức tích cực",
        experience: 20,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "voduytrinh.jpg",
    },
    {
        name: "BSCK2. Hà Sơn Bình",
        specialty: "Hồi sức tích cực",
        experience: 17,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "hasonbinh.jpg",
    },

    // Gây mê hồi sức (Anesthesiology)
    {
        name: "Bs. Huỳnh Đức Phát",
        specialty: "Gây mê hồi sức",
        experience: 18,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "huynhducphat.jpg",
    },
    {
        name: "Bs. Hà Phước Hoàng",
        specialty: "Gây mê hồi sức",
        experience: 16,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "haphuochoang.jpg",
    },

    // Ung bướu (Oncology)
    {
        name: "ThS.BS. Lê Quốc Tuấn",
        specialty: "Ung bướu",
        experience: 20,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "lequoctuan.jpg",
    },
    {
        name: "Bác sỹ Phan Văn Lượng",
        specialty: "Ung bướu",
        experience: 15,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "phanvanluong.jpg",
    },
    {
        name: "Bác sỹ Huỳnh Văn Hiếu",
        specialty: "Ung bướu",
        experience: 12,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "huynhvanhieu.jpg",
    },
    {
        name: "Bác sỹ Đàm Minh Sơn",
        specialty: "Ung bướu",
        experience: 14,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "damminhson.jpg",
    },
    {
        name: "Bác sỹ Võ Tấn Tài",
        specialty: "Ung bướu",
        experience: 11,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "votantai.jpg",
    },

    // Tai Mũi Họng (ENT)
    {
        name: "Bs CK2 Huỳnh Anh",
        specialty: "Tai Mũi Họng",
        experience: 19,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "huynhanh.jpg",
    },
    {
        name: "Bs CK2 Trương Ngọc Hùng",
        specialty: "Tai Mũi Họng",
        experience: 17,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "truongngochung.jpg",
    },
    {
        name: "Bs CK2 Nguyễn Thêm",
        specialty: "Tai Mũi Họng",
        experience: 14,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "nguyenthem.jpg",
    },

    // Răng Hàm Mặt (Dental)
    {
        name: "BS CK2. NGUYỄN THỊ HỒNG MINH",
        specialty: "Răng Hàm Mặt",
        experience: 16,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "nguyenthihongminh.jpg",
    },

    // Khoa ngoại bỏng – tạo hình (Burn & Plastic Surgery)
    {
        name: "Bs CK1 Đỗ Văn Hùng",
        specialty: "Bỏng - Tạo hình",
        experience: 17,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "dovanhung.jpg",
    },

    // Ngoại tổng hợp (General Surgery)
    {
        name: "Bs. Thạc Sỹ Hoàng Dương Vương",
        specialty: "Ngoại tổng hợp",
        experience: 18,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "hoangduongvuong.jpg",
    },

    // Nội tổng hợp (General Internal Medicine)
    {
        name: "TS.BS. Nguyễn Đức Lư",
        specialty: "Nội tổng hợp",
        experience: 22,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "nguyenduclu.jpg",
    },
    {
        name: "TS.BS. Đặng Công Lữ",
        specialty: "Nội tổng hợp",
        experience: 20,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "dangconglu.jpg",
    },

    // Y học nhiệt đới (Tropical Medicine)
    {
        name: "Bác sỹ.Ths. CKII. Phạm Ngọc Hàm",
        specialty: "Y học nhiệt đới",
        experience: 19,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "phamngocham.jpg",
    },
    {
        name: "Bác sỹ.Ths. CKII. Nguyễn Hoàng Sơn",
        specialty: "Y học nhiệt đới",
        experience: 17,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "nguyenhoangson.jpg",
    },

    // Y học hạt nhân (Nuclear Medicine)
    {
        name: "BS.CK2 Nguyễn Văn Minh",
        specialty: "Y học hạt nhân",
        experience: 15,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "nguyenvanminh.jpg",
    },

    // Phục hồi chức năng (Rehabilitation)
    {
        name: "ThS. Bs. Nguyễn Công Huân",
        specialty: "Phục hồi chức năng",
        experience: 16,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "nguyenconghuan.jpg",
    },
    {
        name: "Bác sĩ Phó khoa Bs.CK1 Phan Tín Dụng",
        specialty: "Phục hồi chức năng",
        experience: 14,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "phantindung.jpg",
    },
    {
        name: "Bs. Lưu Quang Long",
        specialty: "Phục hồi chức năng",
        experience: 12,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "luuquanglong.jpg",
    },

    // Khoa Y học cổ truyền (Traditional Medicine)
    {
        name: "BS.CKI.Nguyễn Hoàng Phương",
        specialty: "Y học cổ truyền",
        experience: 18,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "nguyenhoangphuong.jpg",
    },

    // Phụ sản (Obstetrics & Gynecology)
    {
        name: "BS CKII Nguyễn Thị Ngọc Ánh",
        specialty: "Phụ sản",
        experience: 20,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "nguyenthingocanh.jpg",
    },
    {
        name: "BSCKI Nguyễn Thị Hồng Phúc",
        specialty: "Phụ sản",
        experience: 16,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "nguyenthihongphuc.jpg",
    },

    // Thận nhân tạo (Dialysis)
    {
        name: "Bs CKII. Võ Quang Vinh",
        specialty: "Thận nhân tạo",
        experience: 18,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "voquangvinh.jpg",
    },
    {
        name: "Bs CKII Mạc Hữu",
        specialty: "Thận nhân tạo",
        experience: 15,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "machuu.jpg",
    },

    // Khoa khám bệnh (General Consultation)
    {
        name: "Thạc sỹ Bác sĩ Nguyễn Trường Minh",
        specialty: "Khám bệnh tổng quát",
        experience: 15,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "nguyentruongminh.jpg",
    },
    {
        name: "Ths. Bs Nguyễn Đức Phúc",
        specialty: "Khám bệnh tổng quát",
        experience: 14,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "nguyenducphuc.jpg",
    },
    {
        name: "Bác sĩ Nguyễn Tiến Hưng",
        specialty: "Khám bệnh tổng quát",
        experience: 12,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "nguyentienhung.jpg",
    },

    // Lão khoa (Geriatrics)
    {
        name: "BS CK2. PHẠM VĂN TÚ",
        specialty: "Lão khoa",
        experience: 21,
        hospital: "Bệnh viện Đa khoa Đà Nẵng",
        avatar: "phamvantu.jpg",
    },
];

async function seedDaNangDoctors() {
    try {
        console.log("🏥 Starting to seed Da Nang Hospital doctors...");

        console.log("🗑️ Clearing existing doctor-related data...");
        await prisma.appointment.deleteMany({});
        await prisma.doctorSchedule.deleteMany({});
        await prisma.user.updateMany({
            data: { doctorId: null }
        });
        await prisma.user.deleteMany({
            where: { role: "DOCTOR" }
        });
        await prisma.doctor.deleteMany({});
        console.log("✅ Cleared existing doctor records.");

        console.log("🌱 Seeding Da Nang doctors...");
        for (const doctor of DANANG_DOCTORS) {
            await prisma.doctor.create({
                data: {
                    name: doctor.name,
                    specialty: doctor.specialty,
                    experience: doctor.experience,
                    hospital: doctor.hospital,
                    avatar: `/DoctorAvatar/${doctor.avatar}`,
                },
            });
            console.log(`✅ Added: ${doctor.name}`);
        }

        const totalDoctors = await prisma.doctor.count();
        console.log(`\n✨ Seeding completed! Total doctors in database: ${totalDoctors}`);
    } catch (error) {
        console.error("❌ Error seeding doctors:", error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

seedDaNangDoctors();
