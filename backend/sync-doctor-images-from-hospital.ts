import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Mapping of doctor names (as stored in the database) to their real photo URLs
 * from the Da Nang Hospital official website (bvdn.danang.gov.vn).
 * 
 * Data extracted from HTML content of each department page.
 * URL backslashes from hospital website are converted to forward slashes.
 */

interface DoctorImageMapping {
    namePatterns: string[];
    imageUrl: string;
    department: string;
}

const DOCTOR_IMAGE_MAPPINGS: DoctorImageMapping[] = [
    // ========================================
    // KHOA NGOẠI THẦN KINH (Neurosurgery)
    // Source: /chi-tiet/khoa-ngoai-than-kinh-14246
    // ========================================
    {
        namePatterns: ["Trà Tấn Hoành", "Tra Tan Hoanh"],
        imageUrl: "https://bvdn.danang.gov.vn/resources/1/u_phongctxh/MOI2/bs ho%C3%A0nh639144497364998250.jpg",
        department: "Ngoại thần kinh",
    },
    {
        namePatterns: ["Lê Quang Chí Cường", "Le Quang Chi Cuong"],
        imageUrl: "https://bvdn.danang.gov.vn/resources/1/u_phongctxh/MOI2/bs c%C6%B0%E1%BB%9Dng639144497432208239.jpg",
        department: "Ngoại thần kinh",
    },
    {
        namePatterns: ["Lê Hữu Trì", "Le Huu Tri"],
        imageUrl: "https://bvdn.danang.gov.vn/resources/1/u_phongctxh/MOI2/2676151132976090001639144497506330793.jpg",
        department: "Ngoại thần kinh",
    },

    // ========================================
    // KHOA NGOẠI CHẤN THƯƠNG CHỈNH HÌNH (Orthopedic)
    // Source: /chi-tiet/khoa-ngoai-chan-thuong-chinh-hinh-14247
    // ========================================
    {
        namePatterns: ["Lê Văn Mười", "Le Van Muoi"],
        imageUrl: "https://bvdn.danang.gov.vn/resources/1/KHOAPHONG/NGOAI%20CHAN%20THUONG/image003639008913468166647.jpg",
        department: "Chỉnh hình - Chấn thương",
    },
    {
        namePatterns: ["Ngô Hạnh", "Ngo Hanh"],
        imageUrl: "https://bvdn.danang.gov.vn/resources/1/KHOAPHONG/NGOAI%20CHAN%20THUONG/ngct02639008913411387820.jpg",
        department: "Chỉnh hình - Cơ xương khớp",
    },
    {
        namePatterns: ["Phạm Vĩnh Huy", "Pham Vinh Huy"],
        imageUrl: "https://bvdn.danang.gov.vn/resources/1/KHOAPHONG/NGOAI%20CHAN%20THUONG/ngct03639008913371954236.png",
        department: "Chỉnh hình",
    },

    // ========================================
    // KHOA NGOẠI LỒNG NGỰC (Thoracic Surgery)
    // Source: /chi-tiet/khoa-ngoai-long-nguc-14248
    // ========================================
    {
        namePatterns: ["Thân Trọng Vũ", "Than Trong Vu"],
        imageUrl: "https://bvdn.danang.gov.vn/resources/1/pongban/NGOAILN1639143655474145613.JPG",
        department: "Ngoại lồng ngực",
    },
    {
        namePatterns: ["Phan Phước An Bình", "Phan Phuoc An Binh"],
        imageUrl: "https://bvdn.danang.gov.vn/resources/1/KHOAPHONG/NGOAI%20LONG%20NGUC/NGOAILN2639143655788533301.JPG",
        department: "Ngoại lồng ngực",
    },
    {
        namePatterns: ["Lê Kim Phượng", "Le Kim Phuong"],
        imageUrl: "https://bvdn.danang.gov.vn/resources/1/KHOAPHONG/NGOAI%20LONG%20NGUC/NGOAILN4639143656156334726.JPG",
        department: "Ngoại lồng ngực",
    },
    {
        namePatterns: ["Nguyễn Ngọc Tuấn", "Nguyen Ngoc Tuan"],
        imageUrl: "https://bvdn.danang.gov.vn/resources/1/KHOAPHONG/NGOAI%20LONG%20NGUC/4ad7943b68846313347eb1c8b0881456639107420025685036.jpg",
        department: "Ngoại lồng ngực",
    },
    {
        namePatterns: ["Lê Kim Trọng", "Le Kim Trong"],
        imageUrl: "https://bvdn.danang.gov.vn/resources/1/KHOAPHONG/NGOAI%20LONG%20NGUC/NGOAILN5639143657423599435.jpg",
        department: "Ngoại lồng ngực",
    },

    // ========================================
    // KHOA TIM MẠCH CAN THIỆP (Cardiovascular Intervention)
    // Source: /chi-tiet/khoa-tim-mach-can-thiep-14249
    // ========================================
    {
        namePatterns: ["Nguyễn Minh Hải", "Nguyen Minh Hai"],
        imageUrl: "https://bvdn.danang.gov.vn/resources/1/KHOAPHONG/TMCT/tmct1639142893479771986.jpg",
        department: "Tim mạch can thiệp",
    },
    {
        namePatterns: ["Nguyễn Bá triệu", "Nguyen Ba Trieu", "Nguyễn Bá Triệu"],
        imageUrl: "https://bvdn.danang.gov.vn/resources/1/KHOAPHONG/TMCT/tmct2639142893446737781.jpg",
        department: "Tim mạch can thiệp",
    },

    // ========================================
    // KHOA NGOẠI TIÊU HÓA (GI Surgery)
    // Source: /chi-tiet/khoa-ngoai-tieu-hoa--gan-mat-tuy-14250
    // ========================================
    {
        namePatterns: ["NGUYỄN HOÀNG", "Nguyễn Hoàng", "Nguyen Hoang"],
        imageUrl: "https://bvdn.danang.gov.vn/resources/1/KHOAPHONG/NGOAI%20TIEU%20HOA/NGTH1639112799105191602.jpg",
        department: "Ngoại tiêu hóa",
    },
    {
        namePatterns: ["LÊ TỰ DŨNG", "Lê Tự Dũng", "Le Tu Dung"],
        imageUrl: "https://bvdn.danang.gov.vn/resources/1/KHOAPHONG/NGOAI%20TIEU%20HOA/NGTH2639112799079340600.jpg",
        department: "Ngoại tiêu hóa",
    },
    {
        namePatterns: ["Võ Văn Tường", "Vo Van Tuong"],
        imageUrl: "https://bvdn.danang.gov.vn/resources/1/KHOAPHONG/NGOAI%20TIEU%20HOA/NGTH3639112799054863536.jpg",
        department: "Ngoại tiêu hóa",
    },

    // ========================================
    // KHOA NGOẠI TIẾT NIỆU (Urology)
    // Source: /chi-tiet/khoa-ngoai-tiet-nieu-14251
    // ========================================
    {
        namePatterns: ["Bùi Chín", "Bui Chin"],
        imageUrl: "https://bvdn.danang.gov.vn/resources/1/KHOAPHONG/NGOAI%20TIET%20NIEU/NGTN1639112764448086413.jpg",
        department: "Tiết niệu",
    },
    {
        namePatterns: ["Võ Trịnh Phú", "Vo Trinh Phu"],
        imageUrl: "https://bvdn.danang.gov.vn/resources/1/KHOAPHONG/NGOAI%20TIET%20NIEU/NGTN2639112764379961834.png",
        department: "Tiết niệu",
    },
    {
        namePatterns: ["Cao Văn Trí", "Cao Van Tri"],
        imageUrl: "https://bvdn.danang.gov.vn/resources/1/KHOAPHONG/NGOAI%20TIET%20NIEU/NGTN3639112764321070699.JPG",
        department: "Tiết niệu",
    },

    // ========================================
    // KHOA NỘI TIM MẠCH (Cardiology)
    // Source: /chi-tiet/khoa-noi-tim-mach-14252
    // ========================================
    {
        namePatterns: ["HUỲNH ĐÌNH LAI", "Huỳnh Đình Lai", "Huynh Dinh Lai"],
        imageUrl: "https://bvdn.danang.gov.vn/resources/1/KHOAPHONG/NOI%20TIM%20MACH/NTM1639112781020909645.jpg",
        department: "Tim mạch",
    },
    {
        namePatterns: ["Hồ Văn Phước", "Ho Van Phuoc"],
        imageUrl: "https://bvdn.danang.gov.vn/resources/1/KHOAPHONG/NOI%20TIM%20MACH/NTM2639112780641088899.jpg",
        department: "Tim mạch",
    },
    {
        namePatterns: ["PHẠM VĂN HÙNG", "Phạm Văn Hùng", "Pham Van Hung"],
        imageUrl: "https://bvdn.danang.gov.vn/resources/1/KHOAPHONG/NOI%20TIM%20MACH/NTM3639112780614657819.jpg",
        department: "Tim mạch",
    },
    {
        namePatterns: ["Nguyễn Quốc Việt", "Nguyen Quoc Viet"],
        imageUrl: "https://bvdn.danang.gov.vn/resources/1/KHOAPHONG/NOI%20TIM%20MACH/NTM4639112780587999417.jpg",
        department: "Tim mạch",
    },

    // ========================================
    // KHOA NỘI TIÊU HÓA - GAN MẬT (Gastroenterology)
    // Source: /chi-tiet/khoa-noi-tieu-hoa-gan-mat-14253
    // ========================================
    {
        namePatterns: ["Nguyễn Văn Xứng", "Nguyen Van Xung"],
        imageUrl: "https://bvdn.danang.gov.vn/resources/1/KHOAPHONG/NOI%20TIEU%20HOA/nth1639112871668813553.jpg",
        department: "Tiêu hóa - Gan - Mật",
    },
    {
        namePatterns: ["Nguyễn Thị Thuận", "Nguyen Thi Thuan"],
        imageUrl: "https://bvdn.danang.gov.vn/resources/1/KHOAPHONG/NOI%20TIEU%20HOA/nth2639112871640209180.jpg",
        department: "Tiêu hóa - Gan - Mật",
    },

    // ========================================
    // KHOA NỘI HÔ HẤP (Respiratory Medicine)
    // Source: /chi-tiet/khoa-noi-ho-hap--mien-dich-di-ung-14254
    // ========================================
    {
        namePatterns: ["Nguyễn Hứa Quang", "Nguyen Hua Quang"],
        imageUrl: "https://bvdn.danang.gov.vn/resources/1/KHOAPHONG/%20NOI%20HO%20HAP/NHH1639127083651689522.jpg",
        department: "Hô hấp",
    },
    {
        namePatterns: ["Nguyễn Bá Hùng", "Nguyen Ba Hung"],
        imageUrl: "https://bvdn.danang.gov.vn/resources/1/KHOAPHONG/%20NOI%20HO%20HAP/NHH2639127083628337062.jpg",
        department: "Hô hấp",
    },

    // ========================================
    // KHOA NỘI THẬN - NỘI TIẾT (Nephrology & Endocrinology)
    // ========================================
    {
        namePatterns: ["Đặng Anh Đào", "Dang Anh Dao"],
        imageUrl: "https://bvdn.danang.gov.vn/resources/1/KHOAPHONG/%20NOI%20HO%20HAP/NHH3639127083601780459.jpg",
        department: "Thận - Nội tiết",
    },
    {
        namePatterns: ["Thái Bá Sỹ", "Thai Ba Sy"],
        imageUrl: "https://bvdn.danang.gov.vn/resources/1/KHOAPHONG/%20NOI%20HO%20HAP/NHH4639127083576110146.jpg",
        department: "Thận - Nội tiết",
    },

    // ========================================
    // KHOA NỘI THẦN KINH (Neurology)
    // ========================================
    {
        namePatterns: ["Lê Hoàng Trường", "Le Hoang Truong"],
        imageUrl: "https://bvdn.danang.gov.vn/resources/1/KHOAPHONG/NOI%20TIM%20MACH/NTM5639112780561095590.jpg",
        department: "Thần kinh",
    },

    // ========================================
    // KHOA HỒI SỨC TÍCH CỰC (ICU)
    // ========================================
    {
        namePatterns: ["Hà Sơn Bình", "Ha Son Binh"],
        imageUrl: "https://bvdn.danang.gov.vn/resources/1/KHOAPHONG/NOI%20TIM%20MACH/NTM6639112780532123609.JPG",
        department: "Hồi sức tích cực",
    },
    {
        namePatterns: ["Võ Duy Trinh", "Vo Duy Trinh"],
        imageUrl: "https://bvdn.danang.gov.vn/resources/1/KHOAPHONG/NOI%20TIM%20MACH/NTM7639112780507014448.JPG",
        department: "Hồi sức tích cực",
    },

    // ========================================
    // KHOA GÂY MÊ HỒI SỨC (Anesthesiology)
    // ========================================
    {
        namePatterns: ["Huỳnh Đức Phát", "Huynh Duc Phat"],
        imageUrl: "https://bvdn.danang.gov.vn/resources/1/KHOAPHONG/NOI%20TIM%20MACH/NTM8639112780479216340.JPG",
        department: "Gây mê hồi sức",
    },
    {
        namePatterns: ["Hà Phước Hoàng", "Ha Phuoc Hoang"],
        imageUrl: "https://bvdn.danang.gov.vn/resources/1/KHOAPHONG/NOI%20TIM%20MACH/NTM9639112780452317059.jpg",
        department: "Gây mê hồi sức",
    },
    // ========================================
    // KHOA TAI MŨI HỌNG (ENT)
    // Source: /chi-tiet/khoa-tai-mui-hong-14283
    // ========================================
    {
        namePatterns: ["Trương Ngọc Hùng", "Truong Ngoc Hung"],
        imageUrl: "https://bvdn.danang.gov.vn/resources/1/KHOAPHONG/TMH/TMH1639127047459508885.png",
        department: "Tai mũi họng",
    },
    {
        namePatterns: ["Nguyễn Thêm", "Nguyen Them"],
        imageUrl: "https://bvdn.danang.gov.vn/resources/1/KHOAPHONG/TMH/TMH2639127047432742454.png",
        department: "Tai mũi họng",
    },

    // ========================================
    // KHOA NGOẠI TỔNG HỢP (General Surgery)
    // Source: /chi-tiet/khoa-ngoai-tong-hop-14286
    // ========================================
    {
        namePatterns: ["Hoàng Dương Vương", "Hoang Duong Vuong"],
        imageUrl: "https://bvdn.danang.gov.vn/resources/1/KHOAPHONG/NGOAI TONG HOP/ngth2639107430017463182.png",
        department: "Ngoại tổng hợp",
    },

    // ========================================
    // KHOA KHÁM BỆNH (General Outpatient)
    // Source: /chi-tiet/khoa-kham-benh-14297
    // ========================================
    {
        namePatterns: ["Nguyễn Trường Minh", "Nguyen Truong Minh"],
        imageUrl: "https://bvdn.danang.gov.vn/resources/1/KHOAPHONG/KHOA KHAM BENH/KHOAKB1639143676996032141.png",
        department: "Khám bệnh",
    },
    {
        namePatterns: ["Nguyễn Đức Phúc", "Nguyen Duc Phuc"],
        imageUrl: "https://bvdn.danang.gov.vn/resources/1/KHOAPHONG/KHOA KHAM BENH/KHOAKB2639143677254592372.png",
        department: "Khám bệnh",
    },

    // ========================================
    // KHOA UNG BƯỚU (Oncology)
    // Source: /chi-tiet/khoa-ung-buou-14282
    // ========================================
    {
        namePatterns: ["Lê Quốc Tuấn", "Le Quoc Tuan"],
        imageUrl: "https://bvdn.danang.gov.vn/resources/1/KHOAPHONG/UNG BUOU/ub1639140868523443640.jpg",
        department: "Ung bướu",
    },
    {
        namePatterns: ["Phan Văn Lượng", "Phan Van Luong"],
        imageUrl: "https://bvdn.danang.gov.vn/resources/1/KHOAPHONG/UNG BUOU/ub2639140868498049550.jpg",
        department: "Ung bướu",
    },
    {
        namePatterns: ["Đàm Minh Sơn", "Dam Minh Son"],
        imageUrl: "https://bvdn.danang.gov.vn/resources/1/KHOAPHONG/UNG BUOU/ub4639140868448278073.jpg",
        department: "Ung bướu",
    },

    // ========================================
    // BAN GIÁM ĐỐC / KHOA NGOẠI BỎNG (Board of Directors / Burn Surgery)
    // Source: /chi-tiet/khoa-ngoai-bong-tao-hinh-14285
    // ========================================
    {
        namePatterns: ["Phạm Trần Xuân Anh", "Pham Tran Xuan Anh"],
        imageUrl: "https://bvdn.danang.gov.vn/resources/1/KHOAPHONG/NGOAI BONG/NGB1639107434612494139.jpg",
        department: "Gây mê hồi sức",
    },

    // ========================================
    // KHOA Y HỌC NHIỆT ĐỚI (Tropical Medicine)
    // Source: /chi-tiet/khoa-y-hoc-nhiet-doi-14288
    // ========================================
    {
        namePatterns: ["Nguyễn Hoàng Sơn", "Nguyen Hoang Son"],
        imageUrl: "https://bvdn.danang.gov.vn/resources/1/KHOAPHONG/Y HOC NHIET DOI/YHND1639112735988844548.jpg",
        department: "Y học nhiệt đới",
    },
];

/**
 * Remove Vietnamese diacritics/accents for flexible name matching.
 */
function removeVietnameseAccents(str: string): string {
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase()
        .trim();
}

/**
 * Check if a doctor name from DB matches any of the patterns.
 */
function matchesDoctorName(dbName: string, patterns: string[]): boolean {
    const normalizedDbName = removeVietnameseAccents(dbName);
    return patterns.some(pattern => {
        const normalizedPattern = removeVietnameseAccents(pattern);
        return normalizedDbName.includes(normalizedPattern);
    });
}

async function syncDoctorImages() {
    try {
        console.log("🏥 Starting to sync doctor images from Da Nang Hospital website...\n");
        console.log("📋 Image mapping contains", DOCTOR_IMAGE_MAPPINGS.length, "doctor entries\n");

        // Fetch all doctors from database
        const allDoctors = await prisma.doctor.findMany({
            select: {
                id: true,
                name: true,
                specialty: true,
                avatar: true,
            },
        });

        console.log(`📋 Found ${allDoctors.length} doctors in database\n`);
        console.log("=".repeat(60));

        let updatedCount = 0;
        let skippedCount = 0;
        const unmatchedDoctors: Array<{ name: string; specialty: string }> = [];

        for (const doctor of allDoctors) {
            const mapping = DOCTOR_IMAGE_MAPPINGS.find(m =>
                matchesDoctorName(doctor.name, m.namePatterns)
            );

            if (mapping) {
                const imageUrl = mapping.imageUrl;

                // Skip if already has a real (non-placeholder) image
                if (doctor.avatar && !doctor.avatar.includes("pravatar.cc") && !doctor.avatar.includes("placeholder") && doctor.avatar.includes("bvdn.danang.gov.vn")) {
                    console.log(`⏭️  Already updated: ${doctor.name}`);
                    skippedCount++;
                } else {
                    await prisma.doctor.update({
                        where: { id: doctor.id },
                        data: { avatar: imageUrl },
                    });
                    console.log(`✅ Updated: ${doctor.name}`);
                    console.log(`   📷 ${imageUrl}`);
                    updatedCount++;
                }
            } else {
                unmatchedDoctors.push({ name: doctor.name, specialty: doctor.specialty });
            }
        }

        console.log("\n" + "=".repeat(60));
        console.log(`\n✨ Sync completed!`);
        console.log(`   ✅ Updated: ${updatedCount} doctors with real photos`);
        console.log(`   ⏭️  Already updated: ${skippedCount} doctors`);
        console.log(`   ❌ No match: ${unmatchedDoctors.length} doctors\n`);

        if (unmatchedDoctors.length > 0) {
            console.log("📋 Doctors without matching images:");
            unmatchedDoctors.forEach(d => {
                console.log(`   - ${d.name} (${d.specialty})`);
            });
            console.log("\n💡 These doctors may not have individual portrait photos on the hospital website,");
            console.log("   or their names differ from the database entries.");
        }

    } catch (error) {
        console.error("❌ Error syncing doctor images:", error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

syncDoctorImages();
