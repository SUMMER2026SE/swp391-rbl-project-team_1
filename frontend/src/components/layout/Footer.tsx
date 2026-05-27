import Link from "next/link";
import { Calendar, Phone, Mail, MapPin, Heart } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-400 mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4 col-span-1 md:col-span-1.5">
            <Link href="/" className="flex items-center gap-2 text-white font-bold text-xl tracking-tight">
              <div className="p-2 bg-teal-600 rounded-xl text-white">
                <Calendar className="h-5 w-5" />
              </div>
              <span>MedBooking</span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              Giải pháp đặt lịch khám bệnh trực tuyến thông minh, nhanh chóng, kết nối người bệnh và đội ngũ chuyên gia bác sĩ hàng đầu tại Việt Nam.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-slate-200 tracking-wider uppercase mb-4">Liên kết nhanh</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link href="/doctors" className="hover:text-white transition-colors">
                  Danh sách bác sĩ
                </Link>
              </li>
              <li>
                <Link href="/my-appointments" className="hover:text-white transition-colors">
                  Lịch hẹn của tôi
                </Link>
              </li>
            </ul>
          </div>

          {/* Specialties */}
          <div>
            <h3 className="text-sm font-semibold text-slate-200 tracking-wider uppercase mb-4">Chuyên Khoa</h3>
            <ul className="space-y-2.5 text-sm">
              <li className="hover:text-white transition-colors cursor-pointer">Nhi Khoa</li>
              <li className="hover:text-white transition-colors cursor-pointer">Tim Mạch</li>
              <li className="hover:text-white transition-colors cursor-pointer">Da Liễu</li>
              <li className="hover:text-white transition-colors cursor-pointer">Nội Tổng Quát</li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-3.5">
            <h3 className="text-sm font-semibold text-slate-200 tracking-wider uppercase mb-4">Liên hệ</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-teal-500 shrink-0" />
                <span>0368604762 (Tư vấn 24/7)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-teal-500 shrink-0" />
                <span>Bondz1607@gmail.com</span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-teal-500 shrink-0 mt-0.5" />
                <span>Trường Đại Học FPT Đà Nẵng</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {currentYear} MedBooking. Bảo lưu mọi quyền.</p>
          <p className="flex items-center gap-1">
            Được phát triển với <Heart className="h-3 w-3 text-red-500 fill-red-500" /> bởi đội ngũ Nhóm 1 Class SE20A07.
          </p>
        </div>
      </div>
    </footer>
  );
}
