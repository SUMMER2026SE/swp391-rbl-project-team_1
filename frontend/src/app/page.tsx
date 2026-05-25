"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Calendar, ShieldCheck, Users, MapPin, ArrowRight, HeartPulse } from "lucide-react";
import Button from "@/components/common/Button";

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/doctors?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/doctors");
    }
  };

  const specialties = [
    { name: "Nhi Khoa", description: "Chăm sóc sức khỏe toàn diện cho trẻ sơ sinh và trẻ nhỏ", count: "12 bác sĩ", icon: "🧸" },
    { name: "Tim Mạch", description: "Chẩn đoán và điều trị các bệnh lý tim mạch, huyết áp", count: "8 bác sĩ", icon: "❤️" },
    { name: "Da Liễu", description: "Khám & điều trị các bệnh về da, tóc, móng và thẩm mỹ da", count: "15 bác sĩ", icon: "✨" },
    { name: "Nội Tổng Quát", description: "Khám lâm sàng, phát hiện và tư vấn bệnh lý nội khoa", count: "20 bác sĩ", icon: "🩺" },
  ];

  const steps = [
    {
      step: "01",
      title: "Tìm Kiếm Bác Sĩ",
      description: "Dễ dàng tìm kiếm bác sĩ theo tên chuyên môn hoặc bệnh viện phù hợp.",
    },
    {
      step: "02",
      title: "Chọn Khung Giờ",
      description: "Xem lịch làm việc chi tiết và chọn giờ hẹn trống trực tiếp trên hệ thống.",
    },
    {
      step: "03",
      title: "Xác Nhận & Đặt Lịch",
      description: "Nhập thông tin triệu chứng và hoàn thành lịch đặt chỉ trong vài giây.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 text-white py-20 lg:py-32 overflow-hidden">
        {/* Abstract vector blobs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Title / Description */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 bg-teal-700/40 border border-teal-600/30 rounded-full px-3 py-1.5 text-teal-200 text-sm font-medium">
                <HeartPulse className="h-4 w-4 animate-pulse" />
                <span>Nền tảng Y Tế Số Hàng Đầu Việt Nam</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
                Chăm Sóc Sức Khỏe <br />
                <span className="text-teal-400">Trọn Vẹn Từ Tâm</span>
              </h1>
              <p className="text-lg text-teal-100/80 max-w-xl leading-relaxed">
                Hệ thống đặt lịch khám trực tuyến giúp bạn kết nối nhanh nhất tới các bác sĩ chuyên khoa giỏi tại các bệnh viện uy tín. Đặt lịch nhanh chóng, không lo chờ đợi.
              </p>

              {/* Search Bar Form */}
              <form onSubmit={handleSearchSubmit} className="max-w-xl">
                <div className="bg-white rounded-2xl p-2 shadow-2xl flex flex-col sm:flex-row gap-2 border border-white/10">
                  <div className="flex items-center gap-2.5 px-3 py-2 flex-grow text-slate-800">
                    <Search className="h-5 w-5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="Tìm tên bác sĩ, chuyên khoa hoặc bệnh viện..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent border-none outline-none w-full text-slate-900 placeholder:text-slate-400 text-sm"
                    />
                  </div>
                  <Button type="submit" variant="teal" className="py-3 px-6 rounded-xl font-medium shrink-0">
                    Tìm Kiếm Bác Sĩ
                  </Button>
                </div>
              </form>

              {/* Badges/Stats */}
              <div className="grid grid-cols-3 gap-6 pt-4 max-w-lg border-t border-teal-700/40">
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-teal-400">99%</p>
                  <p className="text-xs text-teal-200/60 uppercase tracking-wider mt-1">Bệnh nhân hài lòng</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-teal-400">100+</p>
                  <p className="text-xs text-teal-200/60 uppercase tracking-wider mt-1">Bác sĩ chuyên khoa</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-teal-400">24/7</p>
                  <p className="text-xs text-teal-200/60 uppercase tracking-wider mt-1">Tư vấn hỗ trợ</p>
                </div>
              </div>
            </div>

            {/* Visual Box Graphic */}
            <div className="lg:col-span-5 hidden lg:block">
              <div className="relative">
                {/* Visual Card Backdrop effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-3xl blur opacity-30 animate-tilt" />
                <div className="relative bg-slate-900 border border-teal-500/20 rounded-3xl p-8 shadow-2xl space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-teal-900/60">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-teal-500/10 text-teal-400 rounded-xl flex items-center justify-center">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-white text-sm">Hệ Thống Đạt Chuẩn</p>
                        <p className="text-xs text-teal-300/60">An toàn & Bảo mật tuyệt đối</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-teal-950/40 rounded-2xl border border-teal-800/30 flex items-start gap-3">
                      <div className="p-2 bg-teal-500/20 text-teal-300 rounded-lg text-xs font-bold mt-0.5">BS</div>
                      <div className="text-sm">
                        <p className="font-medium text-teal-200">Đội ngũ bác sĩ chọn lọc</p>
                        <p className="text-xs text-teal-100/60 mt-1">Tất cả các bác sĩ đều có trên 5 năm kinh nghiệm lâm sàng.</p>
                      </div>
                    </div>

                    <div className="p-4 bg-teal-950/40 rounded-2xl border border-teal-800/30 flex items-start gap-3">
                      <div className="p-2 bg-teal-500/20 text-teal-300 rounded-lg text-xs font-bold mt-0.5">LT</div>
                      <div className="text-sm">
                        <p className="font-medium text-teal-200">Lịch trình minh bạch</p>
                        <p className="text-xs text-teal-100/60 mt-1">Khung giờ hiển thị là thời gian thực tế bác sĩ sẵn sàng làm việc.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Specialty Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <h2 className="text-xs uppercase font-extrabold tracking-widest text-teal-600">Danh Mục Chuyên Khoa</h2>
            <p className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Các Chuyên Khoa Mũi Nhọn</p>
            <p className="text-slate-500 text-sm sm:text-base leading-relaxed">
              Chúng tôi cung cấp dịch vụ đặt lịch hẹn đa dạng các chuyên khoa, đảm bảo chuẩn đoán chính xác và điều trị hiệu quả cho bạn và gia đình.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {specialties.map((spec) => (
              <div
                key={spec.name}
                className="group relative bg-slate-50 hover:bg-teal-50/30 border border-slate-100 hover:border-teal-100 rounded-2xl p-6 transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer"
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-200 inline-block">{spec.icon}</div>
                <h3 className="text-lg font-bold text-slate-900 mb-1.5">{spec.name}</h3>
                <p className="text-xs text-slate-500 mb-4">{spec.count}</p>
                <p className="text-xs text-slate-600 leading-relaxed mb-2">{spec.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking Steps Section */}
      <section className="py-20 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <h2 className="text-xs uppercase font-extrabold tracking-widest text-teal-600">Quy Trình Khám Bệnh</h2>
            <p className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Lịch Khám Tiện Lợi Với 3 Bước</p>
            <p className="text-slate-500 text-sm">Quy trình đặt lịch được thiết kế tối giản giúp tiết kiệm tối đa thời gian của người bệnh.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((st) => (
              <div key={st.step} className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm relative overflow-hidden group">
                <span className="absolute top-4 right-6 text-6xl font-black text-slate-50 group-hover:text-teal-50/50 transition-colors duration-300 pointer-events-none select-none z-0">
                  {st.step}
                </span>
                <div className="relative z-10 space-y-3">
                  <h3 className="text-lg font-bold text-slate-900">{st.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{st.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center bg-gradient-to-r from-teal-50 to-emerald-50/50 border border-teal-100/40 rounded-3xl p-10 sm:p-16 shadow-inner relative overflow-hidden">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-48 h-48 bg-teal-400/10 rounded-full blur-xl pointer-events-none" />
          <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">Sẵn sàng để hẹn lịch với bác sĩ chuyên gia?</h2>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
              Tránh thủ tục xếp hàng mệt mỏi tại bệnh viện. Chỉ với vài cú click chuột, lịch đặt khám của bạn sẽ được chuyển ngay đến bác sĩ chuyên khoa.
            </p>
            <div className="pt-2">
              <Link href="/doctors">
                <Button variant="teal" className="py-3 px-8 text-base rounded-xl inline-flex items-center gap-2 group">
                  Xem Danh Sách Bác Sĩ <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
