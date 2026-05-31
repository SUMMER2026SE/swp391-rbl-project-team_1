import Link from "next/link";
import { Calendar, Phone, Mail, MapPin, Heart } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-400 mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Cột 1: Về MedBooking */}
          <div className="space-y-5">
            <Link href="/" className="flex items-center gap-2.5 text-white font-bold text-xl tracking-tight">
              <div className="p-2 bg-teal-600 rounded-xl text-white">
                <Calendar className="h-5 w-5" />
              </div>
              <span>MedBooking</span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              Giải pháp đặt lịch khám bệnh trực tuyến thông minh, nhanh chóng, kết nối người bệnh và đội ngũ chuyên gia bác sĩ hàng đầu tại Việt Nam.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-300">Website:</span>
                <Link href="/" className="hover:text-teal-400 text-teal-500 transition-colors">
                  https://medbooking.vn
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-300">Email:</span>
                <span className="text-slate-400">cskh@medbooking.vn</span>
              </div>
            </div>
          </div>

          {/* Cột 2: Dịch Vụ Y Tế - Phóng tác từ Medpro */}
          <div>
            <h3 className="text-sm font-semibold text-slate-200 tracking-wider uppercase mb-5 relative after:content-[''] after:absolute after:bottom-[-8px] after:left-0 after:w-8 after:h-0.5 after:bg-teal-500">
              Dịch vụ Y tế
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/doctors" className="hover:text-teal-400 transition-colors flex items-center gap-1.5">
                  <span className="text-teal-500">•</span> Đặt khám tại cơ sở
                </Link>
              </li>
              <li>
                <Link href="/doctors" className="hover:text-teal-400 transition-colors flex items-center gap-1.5">
                  <span className="text-teal-500">•</span> Đặt khám theo bác sĩ
                </Link>
              </li>
              <li>
                <Link href="/doctors" className="hover:text-teal-400 transition-colors flex items-center gap-1.5">
                  <span className="text-teal-500">•</span> Gọi video với bác sĩ
                </Link>
              </li>
              <li>
                <Link href="/my-appointments" className="hover:text-teal-400 transition-colors flex items-center gap-1.5">
                  <span className="text-teal-500">•</span> Tư vấn khám bệnh từ xa
                </Link>
              </li>
              <li>
                <span className="text-slate-500 flex items-center gap-1.5 cursor-not-allowed">
                  <span className="text-slate-600">•</span> Trò chuyện trợ lý AI (Medical Agent)
                </span>
              </li>
            </ul>
          </div>

          {/* Cột 3: Hướng Dẫn & Điều Khoản - Tham khảo Medpro & eDoctor */}
          <div>
            <h3 className="text-sm font-semibold text-slate-200 tracking-wider uppercase mb-5 relative after:content-[''] after:absolute after:bottom-[-8px] after:left-0 after:w-8 after:h-0.5 after:bg-teal-500">
              Hướng dẫn & Hỗ trợ
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="#" className="hover:text-teal-400 transition-colors">
                  Quy trình đặt lịch khám
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-teal-400 transition-colors">
                  Chính sách hoàn phí & Hủy lịch
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-teal-400 transition-colors">
                  Câu hỏi thường gặp (FAQs)
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-teal-400 transition-colors">
                  Điều khoản dịch vụ
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-teal-400 transition-colors">
                  Chính sách bảo mật thông tin
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 4: Liên Hệ & Trụ Sở */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 tracking-wider uppercase mb-5 relative after:content-[''] after:absolute after:bottom-[-8px] after:left-0 after:w-8 after:h-0.5 after:bg-teal-500">
              Thông tin liên hệ
            </h3>
            <ul className="space-y-3.5 text-sm">
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-teal-500 shrink-0" />
                <span className="text-slate-300 font-medium">0368604762 <span className="text-xs text-slate-500">(24/7)</span></span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-teal-500 shrink-0" />
                <span className="text-slate-300">Bondz1607@gmail.com</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-teal-500 shrink-0 mt-0.5" />
                <span className="text-slate-300 leading-relaxed">
                  Đại học FPT Đà Nẵng, Khu đô thị FPT City, Ngũ Hành Sơn, Đà Nẵng
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Footer Section */}
        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="space-y-1.5 text-center md:text-left">
            <p className="font-semibold text-slate-400">© {currentYear} MedBooking. Bảo lưu mọi quyền.</p>
            <p>Đại diện pháp luật: Đội ngũ Nhóm 1 Class SE20A07 | Học phần SWP391 FPT University</p>
          </div>
          
          {/* Bộ Công Thương Verified Badge - Như eDoctor */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 bg-red-600/10 text-red-500 px-3 py-1.5 rounded border border-red-500/20 uppercase font-bold text-[9px] tracking-wider select-none shrink-0">
              <span className="bg-red-500 text-slate-900 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0">✓</span>
              Đã đăng ký Bộ Công Thương
            </div>
            <p className="flex items-center gap-1 shrink-0">
              Được làm bằng <Heart className="h-3 w-3 text-red-500 fill-red-500" /> từ Đà Nẵng.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
