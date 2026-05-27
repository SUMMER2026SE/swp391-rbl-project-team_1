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
                  className="group relative bg-slate-50 hover:bg-teal-50/30 border border-slate-100 hover:border-teal-100 rounded-2xl p-6 transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer"
                >
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-200 inline-block">
                    {spec.icon || "🩺"}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1.5">{spec.name}</h3>
                  <p className="text-xs text-teal-600 font-semibold mb-4">
                    {spec._count?.doctors || 0} bác sĩ
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed mb-2">
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
