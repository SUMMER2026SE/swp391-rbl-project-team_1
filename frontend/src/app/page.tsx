'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Compass, ShieldAlert, Award, Brain, 
  ArrowRight, Sparkles, LayoutDashboard, 
  GraduationCap, ShieldCheck, CheckCircle2 
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      
      {/* Decorative Glow Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute top-[30%] right-[20%] w-[400px] h-[400px] rounded-full bg-pink-600/5 blur-[100px] pointer-events-none" />

      {/* Header / Navbar */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between z-15 relative">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-white font-extrabold text-xl">E</span>
          </div>
          <div>
            <h1 className="text-white font-extrabold text-lg tracking-wider leading-none">EduPath</h1>
            <span className="text-[10px] text-blue-450 font-bold uppercase tracking-widest block mt-0.5">Adaptive AI</span>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/login">
            <button className="text-slate-400 hover:text-slate-200 text-sm font-semibold transition-all">
              Đăng nhập
            </button>
          </Link>
          <Link href="/register">
            <button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow-md shadow-blue-500/10 transition-all">
              Đăng ký ngay
            </button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto w-full px-6 py-16 flex-1 flex flex-col items-center justify-center text-center space-y-12 z-15 relative">
        
        {/* Badge and Headings */}
        <div className="space-y-6 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-950/45 text-indigo-400 border border-indigo-900/40 select-none animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Hệ thống Đào tạo Tự thích ứng & Cảnh báo Sớm AI</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.15]">
            Nâng tầm hiệu năng học thuật tại{' '}
            <span className="bg-gradient-to-r from-orange-400 via-indigo-400 to-pink-400 bg-clip-text text-transparent block md:inline">
              FPT University
            </span>
          </h1>

          <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Hệ thống EduPath kết hợp mô hình xác suất học máy BKT, lịch trình ưu tiên Scheduler và Logistic Regression dự báo rủi ro trượt môn học để kiến tạo lộ trình tự học tối ưu nhất.
          </p>
        </div>

        {/* Action Roles Entry Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl pt-4">
          
          {/* Student Entrance */}
          <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-3xl flex flex-col justify-between items-start text-left hover:border-blue-500/40 transition-all duration-350 group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-950/40 text-blue-500 flex items-center justify-center border border-blue-900/30">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-slate-200 font-extrabold text-base group-hover:text-blue-400 transition-colors">
                  Phân hệ Sinh viên
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Lập kế hoạch với bảng Kanban, luyện tập trắc nghiệm BKT, cải thiện rủi ro học thuật, đếm giờ Pomodoro và đua top bảng xếp hạng.
                </p>
              </div>
            </div>
            <Link href="/login?role=student" className="w-full pt-6 mt-6 border-t border-slate-900">
              <button className="w-full bg-slate-950 hover:bg-blue-600 hover:text-white transition-all text-xs font-bold py-2.5 rounded-xl border border-slate-850 flex items-center justify-center gap-1.5 group-hover:border-blue-500/20">
                <span>Vào học ngay</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </Link>
          </div>

          {/* Mentor Entrance */}
          <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-3xl flex flex-col justify-between items-start text-left hover:border-emerald-500/40 transition-all duration-350 group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-950/40 text-emerald-500 flex items-center justify-center border border-emerald-900/30">
                <Brain className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-slate-200 font-extrabold text-base group-hover:text-emerald-400 transition-colors">
                  Phân hệ Giảng viên (Mentor)
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Nhận cảnh báo đỏ tức thời qua Socket, kiểm soát biến động rủi ro, quản lý ngân hàng tài liệu và biên soạn câu hỏi tự động qua AI.
                </p>
              </div>
            </div>
            <Link href="/login?role=mentor" className="w-full pt-6 mt-6 border-t border-slate-900">
              <button className="w-full bg-slate-950 hover:bg-emerald-600 hover:text-white transition-all text-xs font-bold py-2.5 rounded-xl border border-slate-850 flex items-center justify-center gap-1.5 group-hover:border-emerald-500/20">
                <span>Giám sát học viên</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </Link>
          </div>

          {/* Admin Entrance */}
          <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-3xl flex flex-col justify-between items-start text-left hover:border-purple-500/40 transition-all duration-350 group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-950/40 text-purple-500 flex items-center justify-center border border-purple-900/30">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-slate-200 font-extrabold text-base group-hover:text-purple-400 transition-colors">
                  Ban Đào tạo (Admin)
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Quản trị tài khoản người dùng, cấu hình cây kỹ năng toàn trường, phân vai tài khoản hệ thống và giám sát máy chủ.
                </p>
              </div>
            </div>
            <Link href="/login?role=admin" className="w-full pt-6 mt-6 border-t border-slate-900">
              <button className="w-full bg-slate-950 hover:bg-purple-600 hover:text-white transition-all text-xs font-bold py-2.5 rounded-xl border border-slate-850 flex items-center justify-center gap-1.5 group-hover:border-purple-500/20">
                <span>Quản trị hệ thống</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </Link>
          </div>

        </div>

        {/* Feature breakdown Section */}
        <div className="w-full max-w-4xl space-y-6 pt-12 text-left">
          <h2 className="text-lg font-bold text-slate-200 border-b border-slate-900 pb-3">
            Nền tảng Thuật toán cốt lõi
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <span className="text-xs font-bold text-indigo-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Bayesian Knowledge Tracing</span>
              </span>
              <p className="text-slate-400 text-xs leading-relaxed">
                Đánh giá mức độ làm chủ kiến thức tức thì của sinh viên sau mỗi lượt giải bài, tự thích ứng câu hỏi trắc nghiệm dựa trên P(Guess) và P(Slip).
              </p>
            </div>
            
            <div className="space-y-2">
              <span className="text-xs font-bold text-indigo-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Scheduler Ưu tiên</span>
              </span>
              <p className="text-slate-400 text-xs leading-relaxed">
                Tự động sắp đặt lịch trình bài học dựa trên khoảng cách năng lực, độ khó học liệu và thời hạn nộp bài để tối đa hóa điểm số.
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-indigo-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Dự báo rủi ro AI</span>
              </span>
              <p className="text-slate-400 text-xs leading-relaxed">
                Mô hình hồi quy Logistic định lượng mức độ trượt môn học dựa trên tần suất Pomodoro, tỷ lệ nộp bài và điểm số để gửi cảnh báo đỏ kịp thời.
              </p>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-600 z-15 relative">
        <p>© 2026 EduPath Adaptive Learning System. Phát triển cho Capstone Project - FPT University.</p>
      </footer>
      
    </div>
  );
}
