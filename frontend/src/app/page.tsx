"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, TrendingUp, AlertTriangle, Users, ArrowRight, GraduationCap } from "lucide-react";
import Button from "@/components/common/Button";
// EduPath: specialty/pagination imports removed — replaced by static feature cards

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // EduPath: no specialties needed — placeholder for future API
    setLoading(false);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/courses?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/courses");
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 text-white py-20 lg:py-32 overflow-hidden">
        {/* Abstract vector blobs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Title / Description */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 bg-blue-700/40 border border-blue-600/30 rounded-full px-3 py-1.5 text-blue-200 text-sm font-medium">
                <GraduationCap className="h-4 w-4 animate-pulse" />
                <span>Học đúng thứ. Học đúng lúc. Học đúng cách.</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
                Học tập thông minh hơn <br />
                <span className="text-blue-400">với EduPath</span>
              </h1>
              <p className="text-lg text-blue-100/80 max-w-xl leading-relaxed">
                Hệ thống tự động phân tích điểm yếu, sắp xếp lộ trình và dự báo rủi ro học tập của bạn theo thời gian thực
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 max-w-xl">
                <Link href="/register">
                  <Button variant="teal" className="py-3 px-7 rounded-xl font-semibold text-base shrink-0 bg-blue-500 hover:bg-blue-400 border-blue-400">
                    Bắt đầu miễn phí
                  </Button>
                </Link>
                <Link href="#features-section">
                  <Button variant="outline" className="py-3 px-7 rounded-xl font-semibold text-base shrink-0 text-white border-white/40 hover:bg-white/10">
                    Xem tính năng
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-4 max-w-lg border-t border-blue-700/40">
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-blue-400">3 AI</p>
                  <p className="text-xs text-blue-200/60 uppercase tracking-wider mt-1">Thuật toán AI</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-blue-400">4</p>
                  <p className="text-xs text-blue-200/60 uppercase tracking-wider mt-1">Vai trò hệ thống</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-blue-400">Real-time</p>
                  <p className="text-xs text-blue-200/60 uppercase tracking-wider mt-1">Cảnh báo tức thì</p>
                </div>
              </div>
            </div>

            {/* Visual Box Graphic */}
            <div className="lg:col-span-5 hidden lg:block">
              <div className="relative">
                {/* Visual Card Backdrop effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-3xl blur opacity-30 animate-tilt" />
                <div className="relative bg-slate-900 border border-blue-500/20 rounded-3xl p-8 shadow-2xl space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-blue-900/60">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center">
                        <TrendingUp className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-white text-sm">Hệ Thống AI Đạt Chuẩn</p>
                        <p className="text-xs text-blue-300/60">BKT · Priority Scheduler · Logistic Regression</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-blue-950/40 rounded-2xl border border-blue-800/30 flex items-start gap-3">
                      <div className="p-2 bg-blue-500/20 text-blue-300 rounded-lg text-xs font-bold mt-0.5">AI</div>
                      <div className="text-sm">
                        <p className="font-medium text-blue-200">Lộ trình cá nhân hóa</p>
                        <p className="text-xs text-blue-100/60 mt-1">AI tự động sắp xếp bài tập theo đúng năng lực và mục tiêu của bạn.</p>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-950/40 rounded-2xl border border-blue-800/30 flex items-start gap-3">
                      <div className="p-2 bg-blue-500/20 text-blue-300 rounded-lg text-xs font-bold mt-0.5">RR</div>
                      <div className="text-sm">
                        <p className="font-medium text-blue-200">Dự báo rủi ro học tập</p>
                        <p className="text-xs text-blue-100/60 mt-1">Phát hiện sớm nguy cơ và cảnh báo kịp thời trước khi quá muộn.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features-section" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <h2 className="text-xs uppercase font-extrabold tracking-widest text-blue-600">Tính Năng Nổi Bật</h2>
            <p className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Công Nghệ AI Phục Vụ Việc Học</p>
            <p className="text-slate-500 text-sm sm:text-base leading-relaxed">
              EduPath ứng dụng 3 thuật toán AI tiên tiến giúp bạn học đúng hướng, học hiệu quả và luôn được hỗ trợ kịp thời.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="group relative bg-slate-50 hover:bg-blue-50/30 border border-slate-100 hover:border-blue-100 rounded-2xl p-6 transition-all duration-300 shadow-sm hover:shadow-md">
              <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Lộ trình cá nhân hóa</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                AI tự động sắp xếp bài tập theo đúng năng lực và mục tiêu của bạn
              </p>
            </div>

            {/* Card 2 */}
            <div className="group relative bg-slate-50 hover:bg-blue-50/30 border border-slate-100 hover:border-blue-100 rounded-2xl p-6 transition-all duration-300 shadow-sm hover:shadow-md">
              <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Dự báo rủi ro học tập</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Hệ thống phát hiện sớm nguy cơ và cảnh báo kịp thời trước khi quá muộn
              </p>
            </div>

            {/* Card 3 */}
            <div className="group relative bg-slate-50 hover:bg-blue-50/30 border border-slate-100 hover:border-blue-100 rounded-2xl p-6 transition-all duration-300 shadow-sm hover:shadow-md">
              <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Giám sát từ Mentor</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Giảng viên theo dõi tiến độ và nhận cảnh báo real-time khi học viên cần hỗ trợ
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <h2 className="text-xs uppercase font-extrabold tracking-widest text-blue-600">EduPath với Số Liệu</h2>
            <p className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Con Số Nói Lên Tất Cả</p>
            <p className="text-slate-500 text-sm">Nền tảng được thiết kế bởi sinh viên FPT — với sứ mệnh phục vụ người học thực sự.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
              <p className="text-4xl font-extrabold text-blue-600 mb-2">3 Thuật Toán</p>
              <p className="text-sm font-semibold text-slate-700 mb-1">AI Nội Lực</p>
              <p className="text-xs text-slate-500">BKT · Priority Scheduler · Logistic Regression</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
              <p className="text-4xl font-extrabold text-blue-600 mb-2">4 Vai Trò</p>
              <p className="text-sm font-semibold text-slate-700 mb-1">Hệ Thống Đa Vai Trò</p>
              <p className="text-xs text-slate-500">Student · Mentor · Admin · Guest</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
              <p className="text-4xl font-extrabold text-blue-600 mb-2">Real-time</p>
              <p className="text-sm font-semibold text-slate-700 mb-1">Cảnh Báo Tức Thì</p>
              <p className="text-xs text-slate-500">Cảnh báo tức thì qua Socket.IO</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center bg-gradient-to-r from-blue-50 to-indigo-50/50 border border-blue-100/40 rounded-3xl p-10 sm:p-16 shadow-inner relative overflow-hidden">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-48 h-48 bg-blue-400/10 rounded-full blur-xl pointer-events-none" />
          <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">Sẵn sàng học đúng cách chưa?</h2>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
              Tham gia EduPath và để AI lo phần còn lại
            </p>
            <div className="pt-2">
              <Link href="/register">
                <Button variant="teal" className="py-3 px-8 text-base rounded-xl inline-flex items-center gap-2 group bg-blue-600 hover:bg-blue-500 border-blue-500">
                  Đăng ký ngay — Miễn phí <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
