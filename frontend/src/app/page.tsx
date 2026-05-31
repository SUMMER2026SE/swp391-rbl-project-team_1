"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Calendar, ShieldCheck, Users, MapPin, ArrowRight, HeartPulse } from "lucide-react";
import Button from "@/components/common/Button";
import { specialtyService } from "@/services/specialty.service";
import { Specialty } from "@/types/doctor";
import BookingSteps from "@/components/ui/BookingSteps";
import Pagination from "@/components/common/Pagination";

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSpecialtyPage, setCurrentSpecialtyPage] = useState(1);
  const SPECIALTIES_PER_PAGE = 8;

  useEffect(() => {
    async function loadSpecialties() {
      try {
        const data = await specialtyService.listSpecialties();
        setSpecialties(data.specialties);
      } catch (error) {
        console.error("Failed to load specialties:", error);
      } finally {
        setLoading(false);
      }
    }
    loadSpecialties();
  }, []);

  const getSpecialtyDescription = (slug: string) => {
    const descriptions: Record<string, string> = {
      "tim-mach": "Chẩn đoán và điều trị các bệnh lý tim mạch, huyết áp",
      "da-lieu": "Khám & điều trị các bệnh về da, tóc, móng và thẩm mỹ da",
      "nhi-khoa": "Chăm sóc sức khỏe toàn diện cho trẻ sơ sinh và trẻ nhỏ",
      "noi-tong-quat": "Khám lâm sàng, phát hiện và tư vấn bệnh lý nội khoa",
      "than-kinh": "Chẩn đoán và điều trị bệnh lý hệ thần kinh và não bộ",
      "chinh-hinh": "Khám và điều trị chấn thương xương khớp, chỉnh hình cơ thể",
    };
    return descriptions[slug] || "Dịch vụ khám và điều trị kỹ thuật cao, chăm sóc sức khỏe toàn diện.";
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/doctors?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/doctors");
    }
  };

  const totalSpecialtyPages = Math.ceil(specialties.length / SPECIALTIES_PER_PAGE);
  const currentSpecialties = specialties.slice(
    (currentSpecialtyPage - 1) * SPECIALTIES_PER_PAGE,
    currentSpecialtyPage * SPECIALTIES_PER_PAGE
  );



  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#042f2c] via-[#021f1e] to-slate-950 text-white py-20 lg:py-32 overflow-hidden border-b border-teal-950/40">
        {/* Neon glowing backdrops */}
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-teal-500/15 rounded-full blur-[120px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Title / Description */}
            <div className="lg:col-span-7 space-y-8">
              <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 rounded-full px-4 py-2 text-teal-300 text-xs font-bold tracking-wide uppercase animate-fade-in shadow-inner">
                <HeartPulse className="h-4 w-4 text-emerald-400 animate-pulse" />
                <span>Nền tảng Y Tế Số Hàng Đầu Việt Nam</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none text-slate-100">
                Chăm Sóc Sức Khỏe <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400 drop-shadow-md">Trọn Vẹn Từ Tâm</span>
              </h1>
              
              <p className="text-base sm:text-lg text-slate-300/90 max-w-xl leading-relaxed font-medium">
                Hệ thống đặt lịch khám trực tuyến giúp bạn kết nối nhanh nhất tới các bác sĩ chuyên khoa giỏi tại các bệnh viện uy tín. Đặt lịch nhanh chóng, không lo chờ đợi.
              </p>

              {/* Search Bar Form */}
              <form onSubmit={handleSearchSubmit} className="max-w-xl animate-fade-in delay-200">
                <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl p-2.5 shadow-2xl flex flex-col sm:flex-row gap-2 border border-slate-800 focus-within:border-teal-500/50 transition-luxury">
                  <div className="flex items-center gap-3 px-3 py-2 flex-grow text-white">
                    <Search className="h-5 w-5 text-teal-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="Tìm tên bác sĩ, chuyên khoa hoặc bệnh viện..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent border-none outline-none w-full text-white placeholder:text-slate-500 text-sm focus:ring-0"
                    />
                  </div>
                  <Button type="submit" variant="teal" className="py-3.5 px-7 rounded-2xl font-bold shrink-0 bg-teal-500 hover:bg-teal-600 text-slate-950 shadow-lg shadow-teal-500/20">
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
            <div className="lg:col-span-5 hidden lg:block mesh-float-slow">
              <div className="relative">
                {/* Visual Card Backdrop effect */}
                <div className="absolute -inset-1.5 bg-gradient-to-r from-teal-500 to-emerald-400 rounded-[32px] blur-md opacity-35" />
                <div className="relative glass-card-dark rounded-[32px] p-8 shadow-2xl space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 bg-teal-500/10 text-teal-400 rounded-2xl flex items-center justify-center border border-teal-500/20">
                        <ShieldCheck className="h-5.5 w-5.5" />
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">Hệ Thống Đạt Chuẩn</p>
                        <p className="text-xs text-slate-400 mt-0.5">An toàn & Bảo mật tuyệt đối</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 flex items-start gap-3 hover:border-teal-500/30 transition-luxury">
                      <div className="p-2 bg-teal-500/10 text-teal-400 rounded-xl text-xs font-bold mt-0.5 border border-teal-500/15">BS</div>
                      <div className="text-sm">
                        <p className="font-semibold text-teal-300">Đội ngũ bác sĩ chọn lọc</p>
                        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">Tất cả các bác sĩ đều có trên 5 năm kinh nghiệm lâm sàng.</p>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 flex items-start gap-3 hover:border-teal-500/30 transition-luxury">
                      <div className="p-2 bg-teal-500/10 text-teal-400 rounded-xl text-xs font-bold mt-0.5 border border-teal-500/15">LT</div>
                      <div className="text-sm">
                        <p className="font-semibold text-teal-300">Lịch trình minh bạch</p>
                        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">Khung giờ hiển thị là thời gian thực tế bác sĩ sẵn sàng làm việc.</p>
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
      <section id="specialties-section" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <h2 className="text-xs uppercase font-extrabold tracking-widest text-teal-600">Danh Mục Chuyên Khoa</h2>
            <p className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Các Chuyên Khoa Mũi Nhọn</p>
            <p className="text-slate-500 text-sm sm:text-base leading-relaxed">
              Chúng tôi cung cấp dịch vụ đặt lịch hẹn đa dạng các chuyên khoa, đảm bảo chuẩn đoán chính xác và điều trị hiệu quả cho bạn và gia đình.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-slate-50 border border-slate-100 rounded-2xl p-6 space-y-4 animate-pulse">
                  <div className="h-10 w-10 bg-slate-200 rounded-xl" />
                  <div className="h-5 bg-slate-200 rounded w-1/2" />
                  <div className="h-3 bg-slate-200 rounded w-1/4" />
                  <div className="space-y-2">
                    <div className="h-3 bg-slate-200 rounded" />
                    <div className="h-3 bg-slate-200 rounded w-5/6" />
                  </div>
                </div>
              ))
            ) : (
              currentSpecialties.map((spec) => (
                <div
                  key={spec.id}
                  onClick={() => router.push(`/doctors?specialty=${spec.slug}`)}
                  className="group relative bg-white border border-slate-100/70 hover:border-teal-100/60 rounded-3xl p-6 transition-luxury hover-up cursor-pointer overflow-hidden shadow-xs"
                >
                  {/* Subtle color highlight in background */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-xl group-hover:bg-teal-500/10 transition-luxury" />
                  
                  <div className="text-4xl mb-4 group-hover:scale-115 transition-transform duration-300 inline-block">
                    {spec.icon || "🩺"}
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1">{spec.name}</h3>
                  <p className="text-xs text-teal-600 font-bold mb-3 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                    {spec._count?.doctors || 0} Bác sĩ
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {getSpecialtyDescription(spec.slug)}
                  </p>
                </div>
              ))
            )}
          </div>

          {!loading && totalSpecialtyPages > 1 && (
            <Pagination
              currentPage={currentSpecialtyPage}
              totalPages={totalSpecialtyPages}
              onPageChange={setCurrentSpecialtyPage}
              scrollTargetId="specialties-section"
            />
          )}
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

          <BookingSteps />
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center bg-gradient-to-br from-slate-900 via-teal-950 to-slate-950 border border-teal-500/10 rounded-3xl p-10 sm:p-16 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-72 h-72 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 space-y-6 max-w-2xl mx-auto text-white">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Sẵn sàng hẹn lịch với Bác sĩ chuyên khoa?</h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Tránh xa thủ tục đăng ký hay xếp hàng mệt mỏi tại bệnh viện. Chỉ với vài thao tác trực tuyến đơn giản, yêu cầu tư vấn của bạn sẽ được gửi trực tiếp tới bác sĩ chuyên gia.
            </p>
            <div className="pt-3">
              <Link href="/doctors">
                <Button variant="teal" className="py-3.5 px-8 text-base rounded-2xl inline-flex items-center gap-2 group shadow-lg shadow-teal-500/20 hover:scale-102 transition-luxury">
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
