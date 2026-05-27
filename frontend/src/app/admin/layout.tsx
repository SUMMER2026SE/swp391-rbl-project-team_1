"use client";

import React, { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AdminRoute from "@/components/common/AdminRoute";
import {
  LayoutDashboard,
  Users,
  CalendarRange,
  ArrowLeft,
  Activity,
  ShieldCheck,
  Stethoscope,
  BookOpen,
  Building2,
  FileText,
  MessageSquare,
  BarChart3,
} from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();

  const menuItems = [
    {
      name: "Tổng quan Dashboard",
      href: "/admin",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      name: "Quản lý Thành viên",
      href: "/admin/users",
      icon: <Users className="h-5 w-5" />,
    },
    {
      name: "Quản lý Lịch hẹn",
      href: "/admin/appointments",
      icon: <CalendarRange className="h-5 w-5" />,
    },
    {
      name: "Kiểm duyệt Bác sĩ",
      href: "/admin/doctors",
      icon: <Stethoscope className="h-5 w-5" />,
    },
    {
      name: "Quản lý Chuyên khoa",
      href: "/admin/specialties",
      icon: <BookOpen className="h-5 w-5" />,
    },
    {
      name: "Quản lý Phòng khám",
      href: "/admin/clinics",
      icon: <Building2 className="h-5 w-5" />,
    },
    {
      name: "Quản lý Bài viết",
      href: "/admin/articles",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      name: "Phản hồi & Khiếu nại",
      href: "/admin/complaints",
      icon: <MessageSquare className="h-5 w-5" />,
    },
    {
      name: "Thống kê & Báo cáo",
      href: "/admin/statistics",
      icon: <BarChart3 className="h-5 w-5" />,
    },
  ];

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <AdminRoute>
      <div className="min-h-screen flex bg-slate-900 text-slate-100 font-sans">
        {/* Sidebar */}
        <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0 hidden md:flex">
          {/* Brand header */}
          <div className="h-16 px-6 border-b border-slate-800 flex items-center gap-2 text-teal-400 font-bold text-lg tracking-wider uppercase">
            <Activity className="h-5 w-5 shrink-0" />
            <span>MedAdmin Zone</span>
          </div>

          {/* Navigation Links */}
          <nav className="flex-grow p-4 space-y-1.5 pt-6 overflow-y-auto">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive(item.href)
                    ? "bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* Back to Client Home */}
          <div className="p-4 border-t border-slate-800">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Quay lại trang chủ</span>
            </Link>
          </div>
        </aside>

        {/* Right side container */}
        <div className="flex-grow flex flex-col min-w-0">
          {/* Top Bar Header */}
          <header className="h-16 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-6 sm:px-8 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-200">Admin Control Panel</span>
              <span className="text-[10px] tracking-wider uppercase font-black px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                Live Server
              </span>
            </div>
            
            {/* Mobile Header Nav Trigger */}
            <div className="md:hidden flex gap-4 overflow-x-auto">
              <Link href="/admin" className="text-slate-400 hover:text-teal-400">
                <LayoutDashboard className="h-5 w-5" />
              </Link>
              <Link href="/admin/users" className="text-slate-400 hover:text-teal-400">
                <Users className="h-5 w-5" />
              </Link>
              <Link href="/admin/appointments" className="text-slate-400 hover:text-teal-400">
                <CalendarRange className="h-5 w-5" />
              </Link>
              <Link href="/admin/doctors" className="text-slate-400 hover:text-teal-400">
                <Stethoscope className="h-5 w-5" />
              </Link>
              <Link href="/admin/specialties" className="text-slate-400 hover:text-teal-400">
                <BookOpen className="h-5 w-5" />
              </Link>
              <Link href="/admin/clinics" className="text-slate-400 hover:text-teal-400">
                <Building2 className="h-5 w-5" />
              </Link>
              <Link href="/admin/articles" className="text-slate-400 hover:text-teal-400">
                <FileText className="h-5 w-5" />
              </Link>
              <Link href="/admin/complaints" className="text-slate-400 hover:text-teal-400">
                <MessageSquare className="h-5 w-5" />
              </Link>
              <Link href="/admin/statistics" className="text-slate-400 hover:text-teal-400">
                <BarChart3 className="h-5 w-5" />
              </Link>
              <Link href="/" className="text-slate-400 hover:text-teal-400">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-2 text-xs font-medium text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
              <ShieldCheck className="h-4 w-4 text-teal-400 shrink-0" />
              <span>Quyền hạn: <strong>ADMINISTRATOR</strong></span>
            </div>
          </header>

          {/* Main Area */}
          <main className="flex-grow overflow-y-auto p-6 sm:p-8 bg-slate-900">
            {children}
          </main>
        </div>
      </div>
    </AdminRoute>
  );
}
