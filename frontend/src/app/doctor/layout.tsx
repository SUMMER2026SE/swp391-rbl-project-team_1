"use client";

import React, { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import DoctorRoute from "@/components/common/DoctorRoute";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  CalendarDays,
  Clock,
  Users,
  Video,
  MessageCircle,
  UserCircle,
  LogOut,
  Menu,
  Activity,
  ArrowLeft
} from "lucide-react";
import toast from "react-hot-toast";

export default function DoctorLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const menuItems = [
    { name: "Tổng quan", href: "/doctor/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { name: "Hồ sơ cá nhân", href: "/doctor/profile", icon: <UserCircle className="h-5 w-5" /> },
    { name: "Lịch trực", href: "/doctor/schedules", icon: <Clock className="h-5 w-5" /> },
    { name: "Lịch khám", href: "/doctor/appointments", icon: <CalendarDays className="h-5 w-5" /> },
    { name: "Bệnh nhân", href: "/doctor/patients", icon: <Users className="h-5 w-5" /> },
    { name: "Khám trực tuyến", href: "/doctor/video-call", icon: <Video className="h-5 w-5" /> },
    { name: "Tin nhắn", href: "/doctor/chat", icon: <MessageCircle className="h-5 w-5" /> },
  ];

  const handleLogout = () => {
    logout();
    toast.success("Đã đăng xuất thành công");
    window.location.href = "/";
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <DoctorRoute>
      <div className="min-h-screen flex bg-slate-50 text-slate-900 font-sans">
        {/* Sidebar (Desktop) */}
        <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col shrink-0 shadow-sm z-10">
          <div className="h-16 px-6 border-b border-slate-100 flex items-center gap-2 text-teal-600 font-bold text-lg tracking-wider uppercase">
            <Activity className="h-6 w-6" />
            <span>MedDoctor</span>
          </div>

          <div className="p-6 pb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center font-bold text-xl uppercase overflow-hidden ring-2 ring-teal-500/20">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.fullName || "Doctor"} className="w-full h-full object-cover" />
                ) : (
                  user?.fullName?.charAt(0) || "D"
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <h3 className="font-semibold text-slate-800 truncate" title={user?.fullName || "Bác sĩ"}>
                  Dr. {user?.fullName?.split(" ").pop() || "Doctor"}
                </h3>
                <span className="text-xs font-medium text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                  Bác sĩ
                </span>
              </div>
            </div>
          </div>

          <nav className="flex-grow p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive(item.href)
                    ? "bg-teal-500 text-white shadow-md shadow-teal-500/20"
                    : "text-slate-600 hover:bg-slate-50 hover:text-teal-600"
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-100 space-y-2">
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Về trang chủ</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center w-full gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-grow flex flex-col min-w-0">
          {/* Header */}
          <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between shrink-0 shadow-sm sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <button
                className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="text-xl font-bold text-slate-800 hidden sm:block">Doctor Portal</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800">{user?.fullName}</p>
                <p className="text-xs text-slate-500">{new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
          </header>

          {/* Mobile Menu Dropdown */}
          {isMobileMenuOpen && (
            <div className="md:hidden bg-white border-b border-slate-200 shadow-lg absolute top-16 left-0 right-0 z-30 max-h-[calc(100vh-4rem)] overflow-y-auto">
              <nav className="p-4 space-y-1">
                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                      isActive(item.href)
                        ? "bg-teal-50 text-teal-600"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </Link>
                ))}
                <div className="my-2 border-t border-slate-100" />
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Đăng xuất</span>
                </button>
              </nav>
            </div>
          )}

          {/* Main View */}
          <main className="flex-grow p-4 sm:p-8 overflow-y-auto">
            <div className="max-w-6xl mx-auto space-y-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </DoctorRoute>
  );
}
