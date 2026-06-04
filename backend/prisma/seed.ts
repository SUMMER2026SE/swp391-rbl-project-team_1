import bcrypt from "bcrypt";
import { PrismaClient, Role, AppointmentStatus, DoctorStatus } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = "123456";
const BCRYPT_ROUNDS = 10;

async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
}

// 6 core specialties
const SPECIALTY_DATA = [
    { id: "spec_tim_mach", name: "Tim Mạch", slug: "tim-mach", icon: "❤️" },
    { id: "spec_da_lieu", name: "Da Liễu", slug: "da-lieu", icon: "✨" },
    { id: "spec_nhi_khoa", name: "Nhi Khoa", slug: "nhi-khoa", icon: "🧸" },
    { id: "spec_noi_tong_quat", name: "Nội Tổng Quát", slug: "noi-tong-quat", icon: "🩺" },
    { id: "spec_than_kinh", name: "Thần Kinh", slug: "than-kinh", icon: "🧠" },
    { id: "spec_chinh_hinh", name: "Chỉnh Hình", slug: "chinh-hinh", icon: "🦴" },
];

// 2 main clinics/hospitals
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

// Mapping for BVHM doctors (39 doctors)
const BVHM_DOCTORS = [
    { file: "buiquocdat", name: "Bùi Quốc Đạt", specialty: "spec_da_lieu", exp: 10 },
    { file: "caoanhkhoa", name: "Cao Anh Khoa", specialty: "spec_chinh_hinh", exp: 12 },
    { file: "doanthibaoan", name: "Đoàn Thị Bảo An", specialty: "spec_nhi_khoa", exp: 9 },
    { file: "duongngochiep", name: "Dương Ngọc Hiệp", specialty: "spec_tim_mach", exp: 16 },
    { file: "hahung", name: "Hà Hùng", specialty: "spec_than_kinh", exp: 15 },
    { file: "hoangthaiphien", name: "Hoàng Thái Phiên", specialty: "spec_noi_tong_quat", exp: 18 },
    { file: "hongoctam", name: "Hồ Ngọc Tám", specialty: "spec_tim_mach", exp: 20 },
    { file: "huynhthucbao", name: "Huỳnh Thúc Bảo", specialty: "spec_chinh_hinh", exp: 11 },
    { file: "khucvandap", name: "Khúc Văn Dập", specialty: "spec_noi_tong_quat", exp: 22 },
    { file: "levanlong", name: "Lê Văn Long", specialty: "spec_than_kinh", exp: 14 },
    { file: "luonghongvan", name: "Lương Hồng Vân", specialty: "spec_da_lieu", exp: 8 },
    { file: "nguyencongtien", name: "Nguyễn Công Tiến", specialty: "spec_chinh_hinh", exp: 13 },
    { file: "nguyenducdung", name: "Nguyễn Đức Dũng", specialty: "spec_noi_tong_quat", exp: 19 },
    { file: "nguyenhongnam", name: "Nguyễn Hồng Nam", specialty: "spec_than_kinh", exp: 11 },
    { file: "nguyenphamchinhha", name: "Nguyễn Phạm Chính Hà", specialty: "spec_nhi_khoa", exp: 15 },
    { file: "nguyenquangphuc", name: "Nguyễn Quang Phúc", specialty: "spec_tim_mach", exp: 17 },
    { file: "nguyensonha", name: "Nguyễn Sơn Hà", specialty: "spec_noi_tong_quat", exp: 21 },
    { file: "nguyenthanhphuong", name: "Nguyễn Thanh Phương", specialty: "spec_da_lieu", exp: 12 },
    { file: "nguyenthihongduc", name: "Nguyễn Thị Hồng Đức", specialty: "spec_nhi_khoa", exp: 16 },
    { file: "nguyenvanchuc", name: "Nguyễn Văn Chức", specialty: "spec_noi_tong_quat", exp: 24 },
    { file: "nguyenvietlinhkha", name: "Nguyễn Việt Linh Kha", specialty: "spec_chinh_hinh", exp: 10 },
    { file: "nguyenvietson", name: "Nguyễn Việt Sơn", specialty: "spec_tim_mach", exp: 15 },
    { file: "phamdoankien", name: "Phạm Doãn Kiên", specialty: "spec_than_kinh", exp: 13 },
    { file: "phamduydai", name: "Phạm Duy Đại", specialty: "spec_noi_tong_quat", exp: 17 },
    { file: "phamhuuhuyen", name: "Phạm Hữu Huyền", specialty: "spec_da_lieu", exp: 20 },
    { file: "phamthithanhhuyen", name: "Phạm Thị Thanh Huyền", specialty: "spec_nhi_khoa", exp: 11 },
    { file: "phamtrongkhoi", name: "Phạm Trọng Khôi", specialty: "spec_chinh_hinh", exp: 14 },
    { file: "phankenghia", name: "Phan Kế Nghĩa", specialty: "spec_tim_mach", exp: 15 },
    { file: "phanmai", name: "Phan Mai", specialty: "spec_than_kinh", exp: 9 },
    { file: "phanvanthuan", name: "Phan Văn Thuận", specialty: "spec_noi_tong_quat", exp: 23 },
    { file: "tranquoctrung", name: "Trần Quốc Trung", specialty: "spec_da_lieu", exp: 14 },
    { file: "tranthaison", name: "Trần Thái Sơn", specialty: "spec_chinh_hinh", exp: 15 },
    { file: "tranthiphuongthao", name: "Trần Thị Phương Thảo", specialty: "spec_nhi_khoa", exp: 12 },
    { file: "trinhnhatminh", name: "Trịnh Nhật Minh", specialty: "spec_tim_mach", exp: 10 },
    { file: "truongduchien", name: "Trương Đức Hiền", specialty: "spec_than_kinh", exp: 21 },
    { file: "truongnguyenthoainhan", name: "Trương Nguyễn Thoại Nhân", specialty: "spec_noi_tong_quat", exp: 11 },
    { file: "vantrungngia", name: "Văn Trung Nghĩa", specialty: "spec_chinh_hinh", exp: 16 },
    { file: "vonguyenquituan", name: "Võ Nguyễn Quí Tuấn", specialty: "spec_tim_mach", exp: 18 },
    { file: "vothisinh", name: "Võ Thị Sinh", specialty: "spec_da_lieu", exp: 13 }
];

// Mapping for BVTWDN doctors (96 doctors)
const BVTWDN_DOCTORS = [
    { file: "buichin", name: "Bùi Chín", specialty: "spec_noi_tong_quat", exp: 23 },
    { file: "buithiluu", name: "Bùi Thị Lựu", specialty: "spec_noi_tong_quat", exp: 12 },
    { file: "buivandung", name: "Bùi Văn Dũng", specialty: "spec_chinh_hinh", exp: 15 },
    { file: "caovantri", name: "Cao Văn Trí", specialty: "spec_noi_tong_quat", exp: 17 },
    { file: "damminhson", name: "Đàm Minh Sơn", specialty: "spec_noi_tong_quat", exp: 14 },
    { file: "danganhdao", name: "Đặng Anh Đào", specialty: "spec_noi_tong_quat", exp: 18 },
    { file: "dangconglu", name: "Đặng Công Lữ", specialty: "spec_noi_tong_quat", exp: 20 },
    { file: "dothivan", name: "Đỗ Thị Vân", specialty: "spec_da_lieu", exp: 14 },
    { file: "dovanhung", name: "Đỗ Văn Hùng", specialty: "spec_chinh_hinh", exp: 17 },
    { file: "habinhson", name: "Hà Bình Sơn", specialty: "spec_noi_tong_quat", exp: 16 },
    { file: "haphuochoang", name: "Hà Phước Hoàng", specialty: "spec_noi_tong_quat", exp: 16 },
    { file: "hasonbinh", name: "Hà Sơn Bình", specialty: "spec_noi_tong_quat", exp: 17 },
    { file: "hoangduongvuong", name: "Hoàng Dương Vương", specialty: "spec_noi_tong_quat", exp: 18 },
    { file: "hoanghuuhieu", name: "Hoàng Hữu Hiếu", specialty: "spec_noi_tong_quat", exp: 18 },
    { file: "hoanghuyliem", name: "Hoàng Huy Liêm", specialty: "spec_noi_tong_quat", exp: 13 },
    { file: "hovanphuoc", name: "Hồ Văn Phước", specialty: "spec_tim_mach", exp: 19 },
    { file: "huynhanh", name: "Huỳnh Anh", specialty: "spec_noi_tong_quat", exp: 19 },
    { file: "huynhdinhlai", name: "Huỳnh Đình Lai", specialty: "spec_tim_mach", exp: 24 },
    { file: "huynhducphat", name: "Huỳnh Đức Phát", specialty: "spec_noi_tong_quat", exp: 18 },
    { file: "huynhhuunam", name: "Huỳnh Hữu Nam", specialty: "spec_noi_tong_quat", exp: 11 },
    { file: "huynhvanhieu", name: "Huỳnh Văn Hiếu", specialty: "spec_noi_tong_quat", exp: 12 },
    { file: "leducnhan", name: "Lê Đức Nhân", specialty: "spec_noi_tong_quat", exp: 25 },
    { file: "lehoangtruong", name: "Lê Hoàng Trường", specialty: "spec_than_kinh", exp: 19 },
    { file: "lehuutri", name: "Lê Hữu Trì", specialty: "spec_than_kinh", exp: 15 },
    { file: "lekimphuong", name: "Lê Kim Phượng", specialty: "spec_noi_tong_quat", exp: 13 },
    { file: "lekimtrong", name: "Lê Kim Trọng", specialty: "spec_noi_tong_quat", exp: 11 },
    { file: "lenghiembao", name: "Lê Nghiêm Bảo", specialty: "spec_than_kinh", exp: 15 },
    { file: "lequangchicuong", name: "Lê Quang Chí Cường", specialty: "spec_than_kinh", exp: 16 },
    { file: "lequoctuan", name: "Lê Quốc Tuấn", specialty: "spec_noi_tong_quat", exp: 20 },
    { file: "lethiminhnguyet", name: "Lê Thị Minh Nguyệt", specialty: "spec_nhi_khoa", exp: 17 },
    { file: "letrungthe", name: "Lê Trung Thế", specialty: "spec_noi_tong_quat", exp: 15 },
    { file: "letudung", name: "Lê Tự Dũng", specialty: "spec_noi_tong_quat", exp: 18 },
    { file: "levanmuoi", name: "Lê Văn Mười", specialty: "spec_chinh_hinh", exp: 22 },
    { file: "levanson", name: "Lê Văn Sơn", specialty: "spec_noi_tong_quat", exp: 19 },
    { file: "luuquanglong", name: "Lưu Quang Long", specialty: "spec_noi_tong_quat", exp: 12 },
    { file: "machuu", name: "Mạc Hữu", specialty: "spec_noi_tong_quat", exp: 15 },
    { file: "ngohanh", name: "Ngô Hạnh", specialty: "spec_chinh_hinh", exp: 18 },
    { file: "ngothiminhhieu", name: "Ngô Thị Minh Hiếu", specialty: "spec_than_kinh", exp: 13 },
    { file: "nguyenbahung", name: "Nguyễn Bá Hùng", specialty: "spec_noi_tong_quat", exp: 17 },
    { file: "nguyenbatrieu", name: "Nguyễn Bá Triệu", specialty: "spec_tim_mach", exp: 15 },
    { file: "nguyenconghuan", name: "Nguyễn Công Huân", specialty: "spec_noi_tong_quat", exp: 16 },
    { file: "nguyenduclu", name: "Nguyễn Đức Lư", specialty: "spec_noi_tong_quat", exp: 22 },
    { file: "nguyenducphuc", name: "Nguyễn Đức Phúc", specialty: "spec_noi_tong_quat", exp: 14 },
    { file: "nguyenhoang", name: "Nguyễn Hoàng", specialty: "spec_noi_tong_quat", exp: 21 },
    { file: "nguyenhoangkhanh", name: "Nguyễn Hoàng Khánh", specialty: "spec_noi_tong_quat", exp: 20 },
    { file: "nguyenhoangphuong", name: "Nguyễn Hoàng Phương", specialty: "spec_noi_tong_quat", exp: 18 },
    { file: "nguyenhoangson", name: "Nguyễn Hoàng Sơn", specialty: "spec_noi_tong_quat", exp: 17 },
    { file: "nguyenhuaquang", name: "Nguyễn Hứa Quang", specialty: "spec_noi_tong_quat", exp: 21 },
    { file: "nguyenhuuda", name: "Nguyễn Hữu Đa", specialty: "spec_noi_tong_quat", exp: 12 },
    { file: "nguyenhuulam", name: "Nguyễn Hữu Lâm", specialty: "spec_noi_tong_quat", exp: 22 },
    { file: "nguyenminhhai", name: "Nguyễn Minh Hải", specialty: "spec_tim_mach", exp: 17 },
    { file: "nguyenminhtuan", name: "Nguyễn Minh Tuấn", specialty: "spec_noi_tong_quat", exp: 13 },
    { file: "nguyenngoctuan", name: "Nguyễn Ngọc Tuấn", specialty: "spec_noi_tong_quat", exp: 14 },
    { file: "nguyenquocviet", name: "Nguyễn Quốc Việt", specialty: "spec_tim_mach", exp: 14 },
    { file: "nguyenthanhtrung", name: "Nguyễn Thành Trung", specialty: "spec_noi_tong_quat", exp: 22 },
    { file: "nguyenthem", name: "Nguyễn Thêm", specialty: "spec_noi_tong_quat", exp: 14 },
    { file: "nguyenthihongming", name: "Nguyễn Thị Hồng Minh", specialty: "spec_noi_tong_quat", exp: 16 }, // Typo in filename
    { file: "nguyenthihongminh", name: "Nguyễn Thị Hồng Minh", specialty: "spec_noi_tong_quat", exp: 16 },
    { file: "nguyenthihongphuc", name: "Nguyễn Thị Hồng Phúc", specialty: "spec_nhi_khoa", exp: 16 },
    { file: "nguyenthikimhue", name: "Nguyễn Thị Kim Huệ", specialty: "spec_nhi_khoa", exp: 10 },
    { file: "nguyenthiloananh", name: "Nguyễn Thị Loan Anh", specialty: "spec_da_lieu", exp: 12 },
    { file: "nguyenthiminhdung", name: "Nguyễn Thị Minh Dung", specialty: "spec_nhi_khoa", exp: 18 },
    { file: "nguyenthinga", name: "Nguyễn Thị Nga", specialty: "spec_nhi_khoa", exp: 15 },
    { file: "nguyenthingocanh", name: "Nguyễn Thị Ngọc Ánh", specialty: "spec_nhi_khoa", exp: 20 },
    { file: "nguyenthinhi", name: "Nguyễn Thị Nhi", specialty: "spec_nhi_khoa", exp: 9 },
    { file: "nguyenthithuan", name: "Nguyễn Thị Thuận", specialty: "spec_noi_tong_quat", exp: 15 },
    { file: "nguyenthixuanlinh", name: "Nguyễn Thị Xuân Linh", specialty: "spec_nhi_khoa", exp: 14 },
    { file: "nguyentrongnganha", name: "Nguyễn Trọng Ngân Hà", specialty: "spec_nhi_khoa", exp: 11 },
    { file: "nguyentruongminh", name: "Nguyễn Trường Minh", specialty: "spec_noi_tong_quat", exp: 15 },
    { file: "nguyenvanminh", name: "Nguyễn Văn Minh", specialty: "spec_noi_tong_quat", exp: 15 },
    { file: "nguyenvanxung", name: "Nguyễn Văn Xứng", specialty: "spec_noi_tong_quat", exp: 20 },
    { file: "phamngocham", name: "Phạm Ngọc Hàm", specialty: "spec_noi_tong_quat", exp: 19 },
    { file: "phamtrancanhnguyen", name: "Phạm Trần Cảnh Nguyên", specialty: "spec_noi_tong_quat", exp: 14 },
    { file: "phamtranxuananh", name: "Phạm Trần Xuân Anh", specialty: "spec_noi_tong_quat", exp: 20 },
    { file: "phamvanhung", name: "Phạm Văn Hùng", specialty: "spec_tim_mach", exp: 16 },
    { file: "phamvantu", name: "Phạm Văn Tú", specialty: "spec_noi_tong_quat", exp: 21 },
    { file: "phamvinhhuy", name: "Phạm Vĩnh Huy", specialty: "spec_chinh_hinh", exp: 14 },
    { file: "phanphuocanbinh", name: "Phan Phước An Bình", specialty: "spec_noi_tong_quat", exp: 12 },
    { file: "phantindung", name: "Phan Tín Dụng", specialty: "spec_noi_tong_quat", exp: 14 },
    { file: "phanvanluong", name: "Phan Văn Lượng", specialty: "spec_noi_tong_quat", exp: 15 },
    { file: "phanxuanvu", name: "Phan Xuân Vũ", specialty: "spec_noi_tong_quat", exp: 15 },
    { file: "thaibasy", name: "Thái Bá Sỹ", specialty: "spec_noi_tong_quat", exp: 16 },
    { file: "thantrongvu", name: "Thân Trọng Vũ", specialty: "spec_noi_tong_quat", exp: 19 },
    { file: "tonthatkhoa", name: "Tôn Thất Khoa", specialty: "spec_noi_tong_quat", exp: 23 },
    { file: "tothiphuong", name: "Tô Thị Phương", specialty: "spec_nhi_khoa", exp: 16 },
    { file: "tranthikhanhngoc", name: "Trần Thị Khánh Ngọc", specialty: "spec_noi_tong_quat", exp: 18 },
    { file: "tranthinhunhan", name: "Trần Thị Như Nhàn", specialty: "spec_nhi_khoa", exp: 13 },
    { file: "tranthuydieuthuy", name: "Trần Thụy Diệu Thủy", specialty: "spec_nhi_khoa", exp: 12 },
    { file: "trantrongluc", name: "Trần Trọng Lực", specialty: "spec_noi_tong_quat", exp: 15 },
    { file: "tratanhoanh", name: "Trà Tấn Hoành", specialty: "spec_than_kinh", exp: 20 },
    { file: "truongngochung", name: "Trương Ngọc Hùng", specialty: "spec_noi_tong_quat", exp: 17 },
    { file: "voduytrinh", name: "Võ Duy Trinh", specialty: "spec_noi_tong_quat", exp: 20 },
    { file: "voquangvinh", name: "Võ Quang Vinh", specialty: "spec_noi_tong_quat", exp: 17 },
    { file: "votantai", name: "Võ Tấn Tài", specialty: "spec_noi_tong_quat", exp: 14 },
    { file: "votrinhphu", name: "Võ Trịnh Phú", specialty: "spec_noi_tong_quat", exp: 25 },
    { file: "vovantuong", name: "Võ Văn Tường", specialty: "spec_noi_tong_quat", exp: 16 }
];

const certTemplates: Record<string, { title: string; issuer: string; description: string }[]> = {
  spec_tim_mach: [
    {
      title: "Chứng chỉ Siêu âm Tim và bệnh lý Tim mạch",
      issuer: "Viện Tim TP. Hồ Chí Minh",
      description: "Đào tạo chuyên sâu về siêu âm Doppler tim, chẩn đoán và điều trị các bệnh lý tim bẩm sinh, bệnh lý van tim và suy tim."
    },
    {
      title: "Chứng chỉ Tim mạch học can thiệp",
      issuer: "Bệnh viện Chợ Rẫy",
      description: "Hoàn thành khóa đào tạo kỹ thuật can thiệp động mạch vành qua da, đặt stent và hồi sức tim mạch."
    }
  ],
  spec_da_lieu: [
    {
      title: "Chứng chỉ Ứng dụng Laser và Công nghệ ánh sáng trong Da liễu",
      issuer: "Bệnh viện Da liễu Trung ương",
      description: "Đào tạo về sử dụng laser CO2, Nd:YAG, IPL trong điều trị sắc tố da, sẹo, trẻ hóa da và các bệnh lý mạch máu."
    },
    {
      title: "Chứng chỉ Thủ thuật Da liễu và Căng chỉ thẩm mỹ",
      issuer: "Đại học Y Dược TP. Hồ Chí Minh",
      description: "Kỹ năng chuyên sâu về phẫu thuật da cơ bản, sinh thiết da, tiêm botox/filler và căng chỉ nâng cơ trẻ hóa."
    }
  ],
  spec_nhi_khoa: [
    {
      title: "Chứng chỉ Hồi sức cấp cứu Nhi khoa nâng cao (APLS)",
      issuer: "Bệnh viện Nhi Trung ương",
      description: "Chứng chỉ chuẩn quốc tế về xử trí cấp cứu ngừng tuần hoàn hô hấp, sốc và các tình huống đe dọa tính mạng ở trẻ em."
    },
    {
      title: "Chứng chỉ Dinh dưỡng và Phát triển trẻ em toàn diện",
      issuer: "Viện Dinh dưỡng Quốc gia",
      description: "Đào tạo về tư vấn chế độ ăn uống dinh dưỡng bệnh lý nhi khoa, theo dõi sự tăng trưởng thể chất và trí não ở trẻ."
    }
  ],
  spec_noi_tong_quat: [
    {
      title: "Chứng chỉ Nội soi Tiêu hóa Cơ bản",
      issuer: "Bệnh viện Bạch Mai",
      description: "Chứng nhận thực hành thành thạo nội soi dạ dày - tá tràng, đại trực tràng chẩn đoán và can thiệp sinh thiết."
    },
    {
      title: "Chứng chỉ Quản lý và Điều trị Bệnh lý Mạn tính",
      issuer: "Đại học Y Hà Nội",
      description: "Chuyên đề tối ưu hóa phác đồ điều trị đái tháo đường, tăng huyết áp, COPD và rối loạn lipid máu ở người trưởng thành."
    }
  ],
  spec_than_kinh: [
    {
      title: "Chứng chỉ Điện não đồ và Thần kinh cơ lâm sàng",
      issuer: "Bệnh viện Đại học Y Dược TP.HCM",
      description: "Đào tạo đọc và phân tích kết quả điện não đồ (EEG), điện cơ đồ (EMG) chẩn đoán động kinh và bệnh lý thần kinh ngoại biên."
    },
    {
      title: "Chứng chỉ Đột quỵ và Cấp cứu Thần kinh mạch máu",
      issuer: "Hội Đột quỵ Việt Nam",
      description: "Khóa đào tạo chuyên sâu về chẩn đoán sớm đột quỵ não, chỉ định tiêu sợi huyết (rtPA) và can thiệp mạch não cấp cứu."
    }
  ],
  spec_chinh_hinh: [
    {
      title: "Chứng chỉ Phẫu thuật Nội soi Khớp và Tái tạo dây chằng",
      issuer: "Bệnh viện Chấn thương Chỉnh hình TP.HCM",
      description: "Kỹ thuật nội soi khớp gối, khớp vai tái tạo dây chằng chéo trước/sau và khâu sụn chêm."
    },
    {
      title: "Chứng chỉ Kết hợp xương dưới màn tăng sáng (C-arm)",
      issuer: "Bệnh viện Hữu nghị Việt Đức",
      description: "Kỹ thuật mổ ít xâm lấn đinh nội tủy, nẹp vít sinh học điều trị gãy xương phức tạp."
    }
  ]
};

const defaultTemplates = [
  {
    title: "Chứng chỉ Hành nghề Khám bệnh, Chữa bệnh chuyên khoa",
    issuer: "Bộ Y tế Việt Nam",
    description: "Chứng chỉ hành nghề y khoa hợp pháp phạm vi hoạt động chuyên môn theo quy định pháp luật."
  },
  {
    title: "Chứng chỉ Quản lý Y tế và An toàn Người bệnh",
    issuer: "Sở Y tế Đà Nẵng",
    description: "Đào tạo về kiểm soát nhiễm khuẩn, an toàn sử dụng thuốc và cải tiến chất lượng bệnh viện."
  }
];

async function main() {
    try {
        console.log("\n🌱 Starting clean database seed...\n");

        console.log("🗑️ Clearing existing database tables...");
        await prisma.prescription.deleteMany({});
        await prisma.medicalRecord.deleteMany({});
        await prisma.appointment.deleteMany({});
        await prisma.doctorSchedule.deleteMany({});
        await prisma.doctorCertificate.deleteMany({});
        await prisma.doctor.deleteMany({});
        await prisma.clinic.deleteMany({});
        await prisma.specialty.deleteMany({});
        await prisma.user.deleteMany({});
        await prisma.oTP.deleteMany({});
        console.log("✅ Cleared database\n");

        // 1. Seed Admin User
        console.log("🔐 Seeding Admin User...");
        const adminEmail = "admin@gmail.com";
        const hashedAdminPassword = await hashPassword("123456");
        await prisma.user.create({
            data: {
                email: adminEmail,
                password: hashedAdminPassword,
                role: Role.ADMIN,
                fullName: "Hệ thống quản trị MedBooking",
            }
        });
        console.log("   ✅ Admin created: admin@gmail.com\n");

        // 2. Seed Specialties
        console.log("🩺 Seeding Specialties...");
        for (const spec of SPECIALTY_DATA) {
            await prisma.specialty.create({
                data: spec
            });
            console.log(`   ✅ Specialty created: ${spec.name}`);
        }
        console.log("");

        // 3. Seed Clinics
        console.log("🏥 Seeding Clinics...");
        for (const clinic of CLINIC_DATA) {
            await prisma.clinic.create({
                data: clinic
            });
            console.log(`   ✅ Clinic created: ${clinic.name}`);
        }
        console.log("");

        // 4. Seed Doctors
        console.log("👨‍⚕️ Seeding Doctors...");
        const defaultDoctorPassword = await hashPassword(DEFAULT_PASSWORD);
        const scheduleConfig = [
            { dayOfWeek: 1, startTime: "08:00", endTime: "17:00" }, // Monday
            { dayOfWeek: 2, startTime: "08:00", endTime: "17:00" }, // Tuesday
            { dayOfWeek: 3, startTime: "08:00", endTime: "17:00" }, // Wednesday
            { dayOfWeek: 4, startTime: "08:00", endTime: "17:00" }, // Thursday
            { dayOfWeek: 5, startTime: "08:00", endTime: "17:00" }, // Friday
        ];

        let doctorIndex = 1;
        const doctorIds: string[] = [];

        // Helper to format doctor email
        const formatEmail = (file: string) => `${file}@gmail.com`;

        // A function to seed a doctor list
        const seedDoctorList = async (doctors: typeof BVHM_DOCTORS, clinicId: string, hospitalName: string) => {
            for (const doc of doctors) {
                const docId = `doctor_${doctorIndex}`;
                const email = formatEmail(doc.file);
                const avatarPath = `/doctor/${doc.file}.jpg`;

                // Create Doctor record
                const createdDoctor = await prisma.doctor.create({
                    data: {
                        id: docId,
                        name: doc.name,
                        experience: doc.exp,
                        hospital: hospitalName,
                        avatar: avatarPath,
                        specialtyId: doc.specialty,
                        clinicId: clinicId,
                        status: DoctorStatus.APPROVED,
                        price: 150000 + (doc.exp * 10000), // Dynamic pricing
                        phone: `090${Math.floor(1000000 + Math.random() * 9000000)}`,
                        description: `Bác sĩ chuyên khoa tại ${hospitalName} với ${doc.exp} năm kinh nghiệm thực tế. Tận tâm, chu đáo và hết lòng vì bệnh nhân.`
                    }
                });

                // Create User account for Doctor
                await prisma.user.create({
                    data: {
                        email: email,
                        password: defaultDoctorPassword,
                        role: Role.DOCTOR,
                        fullName: doc.name,
                        doctorId: createdDoctor.id,
                        avatar: avatarPath
                    }
                });

                // Create Doctor Schedules
                for (const config of scheduleConfig) {
                    await prisma.doctorSchedule.create({
                        data: {
                            id: `schedule_${createdDoctor.id}_${config.dayOfWeek}`,
                            doctorId: createdDoctor.id,
                            dayOfWeek: config.dayOfWeek,
                            startTime: config.startTime,
                            endTime: config.endTime,
                            isAvailable: true
                        }
                    });
                }

                // Create Doctor Certificates
                const currentYear = 2026;
                const gradYear = currentYear - doc.exp;
                const cert1Year = Math.max(2000, gradYear + 2);
                const cert2Year = Math.max(2003, currentYear - Math.max(1, Math.floor(doc.exp / 2)));

                const templates = certTemplates[doc.specialty] || defaultTemplates;

                await prisma.doctorCertificate.createMany({
                    data: [
                        {
                            doctorId: createdDoctor.id,
                            title: templates[0].title,
                            issuer: templates[0].issuer,
                            issuedYear: cert1Year,
                            description: templates[0].description
                        },
                        {
                            doctorId: createdDoctor.id,
                            title: templates[1].title,
                            issuer: templates[1].issuer,
                            issuedYear: cert2Year,
                            description: templates[1].description
                        }
                    ]
                });

                doctorIds.push(createdDoctor.id);
                doctorIndex++;
                console.log(`   ✅ Seeded: ${doc.name} (${hospitalName}) - Email: ${email} (with certificates)`);
            }
        };

        // Seed BVHM Doctors (Bệnh viện Hoàn Mỹ Đà Nẵng)
        console.log("--- Seeding Hoan My Doctors ---");
        await seedDoctorList(BVHM_DOCTORS, "clinic_hoan_my", "Bệnh viện Hoàn Mỹ Đà Nẵng");

        // Seed BVTWDN Doctors (Bệnh viện Đà Nẵng)
        console.log("\n--- Seeding Da Nang Doctors ---");
        await seedDoctorList(BVTWDN_DOCTORS, "clinic_da_nang", "Bệnh viện Đà Nẵng");

        // 5. Seed Patients
        console.log("\n👥 Seeding Patient Users...");
        const patientIds: string[] = [];
        const defaultPatientPassword = await hashPassword(DEFAULT_PASSWORD);
        for (let i = 1; i <= 10; i++) {
            const email = `patient.${i}@medbooking.com`;
            const user = await prisma.user.create({
                data: {
                    email: email,
                    password: defaultPatientPassword,
                    role: Role.USER,
                    fullName: `Bệnh Nhân Số ${i}`,
                    gender: i % 2 === 0 ? "Nam" : "Nữ",
                    address: "Đà Nẵng, Việt Nam"
                }
            });
            patientIds.push(user.id);
            console.log(`   ✅ Patient created: ${email}`);
        }

        // 6. Seed Sample Appointments to prevent dashboard/stats crashing
        console.log("\n📅 Seeding Sample Appointments...");
        const statuses = [
            AppointmentStatus.PENDING,
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.COMPLETED,
            AppointmentStatus.CANCELLED,
        ];
        
        // Seed 20 random appointments
        for (let i = 0; i < 20; i++) {
            const docId = doctorIds[Math.floor(Math.random() * doctorIds.length)];
            const patId = patientIds[Math.floor(Math.random() * patientIds.length)];
            const status = statuses[i % statuses.length];

            const appDate = new Date();
            appDate.setDate(appDate.getDate() + (i % 5) - 2); // dates in past, today, future
            appDate.setHours(9 + (i % 4), 0, 0, 0);

            await prisma.appointment.create({
                data: {
                    userId: patId,
                    doctorId: docId,
                    appointmentDate: appDate,
                    status: status,
                    notes: `Khám định kỳ chuyên khoa. Trạng thái: ${status}`
                }
            });
        }
        console.log("   ✅ Seeded 20 sample appointments.");

        console.log("\n✨ Database seed completed successfully!");
        console.log(`📊 Summary:`);
        console.log(`  - 1 Admin user`);
        console.log(`  - 6 Core Specialties created`);
        console.log(`  - 2 Clinics created (Bệnh viện Đà Nẵng, Bệnh viện Hoàn Mỹ Đà Nẵng)`);
        console.log(`  - ${BVHM_DOCTORS.length} Hoan My Doctors`);
        console.log(`  - ${BVTWDN_DOCTORS.length} Da Nang Doctors`);
        console.log(`  - Total Doctors: ${doctorIds.length}`);
        console.log(`  - 10 Patient users`);
        console.log(`  - 20 Sample appointments`);

    } catch (error) {
        console.error("❌ Seeding failed:", error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main();
