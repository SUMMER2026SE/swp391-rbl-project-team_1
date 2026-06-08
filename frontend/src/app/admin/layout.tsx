"use client";

import React, { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AdminRoute from "@/components/common/AdminRoute";
import { useAuth } from "@/hooks/useAuth";
import {
  BarChart2,
  UserCheck,
  Hospital,
  FileText,
  AlertCircle,
  Tag,
  Users,
  LogOut,
  Activity,
  ArrowLeft,
  LayoutDashboard,
  CalendarRange,
  Stethoscope,
  BookOpen,
  Building2,
  MessageSquare,
  BarChart3,
  ShieldCheck,
} from "lucide-react";

function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const menuItems = [
    { name: "Thống kê", href: "/admin/statistics", icon: <BarChart2 className="w-5 h-5" /> },
    { name: "Bác sĩ", href: "/admin/doctors", icon: <UserCheck className="w-5 h-5" /> },
    { name: "Cơ sở y tế", href: "/admin/clinics", icon: <Hospital className="w-5 h-5" /> },
    { name: "Bài viết", href: "/admin/articles", icon: <FileText className="w-5 h-5" /> },
    { name: "Khiếu nại", href: "/admin/complaints", icon: <AlertCircle className="w-5 h-5" /> },
    { name: "Chuyên khoa", href: "/admin/specialties", icon: <Tag className="w-5 h-5" /> },
    { name: "Người dùng", href: "/admin/users", icon: <Users className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0 hidden md:flex h-full shadow-sm">
      {/* Brand header */}
      <div className="h-16 px-6 border-b border-gray-100 flex items-center gap-2 text-teal-600 font-bold text-lg tracking-wider uppercase">
        <Activity className="h-5 w-5 shrink-0" />
        <span>MedAdmin</span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname ? pathname.startsWith(item.href) : false;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all ${
                isActive
                  ? "bg-teal-600 text-white rounded-lg shadow-md"
                  : "text-gray-600 hover:bg-teal-50 hover:text-teal-700 rounded-lg"
              }`}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User profile and logout */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center font-bold">
            {user?.email?.charAt(0).toUpperCase() || "A"}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-semibold text-gray-800 truncate">{user?.email || "Admin User"}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role || "Admin"}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg border border-red-100 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AdminRoute>
      {/* Kept existing dark background for main container to preserve "giữ nguyên code cũ" feeling for the rest, 
          but added the required light sidebar logic in AdminSidebar */}
      <div className="min-h-screen flex bg-slate-900 text-slate-100 font-sans">
        
        {/* Render the new sidebar */}
        <AdminSidebar />

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
              <Link href="/admin/statistics" className="text-slate-400 hover:text-teal-400">
                <BarChart3 className="h-5 w-5" />
              </Link>
              <Link href="/admin/doctors" className="text-slate-400 hover:text-teal-400">
                <Stethoscope className="h-5 w-5" />
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
              <Link href="/admin/specialties" className="text-slate-400 hover:text-teal-400">
                <BookOpen className="h-5 w-5" />
              </Link>
              <Link href="/admin/users" className="text-slate-400 hover:text-teal-400">
                <Users className="h-5 w-5" />
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
