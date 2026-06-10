"use client";

import React, { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  GraduationCap,
  User,
  BookOpen,
  BarChart2,
  CheckSquare,
  LogOut,
  Menu,
  X,
  Home,
} from "lucide-react";

const NAV_ITEMS = [
  { name: "Trang Chủ", href: "/", icon: <Home className="w-5 h-5" /> },
  {
    name: "Lộ Trình Học",
    href: "/courses",
    icon: <BookOpen className="w-5 h-5" />,
  },
  {
    name: "Bài Tập",
    href: "/exercises",
    icon: <CheckSquare className="w-5 h-5" />,
  },
  {
    name: "Tiến Độ",
    href: "/progress",
    icon: <BarChart2 className="w-5 h-5" />,
  },
  {
    name: "Hồ Sơ",
    href: "/student/profile",
    icon: <User className="w-5 h-5" />,
  },
];

function StudentSidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const initials = (user?.fullName || user?.email || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full shrink-0">
      {/* Brand */}
      <div className="h-16 px-6 border-b border-slate-800 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-white font-bold text-lg">
          <div className="p-1.5 bg-emerald-500/20 rounded-lg">
            <GraduationCap className="h-5 w-5 text-emerald-400" />
          </div>
          EduPath
        </Link>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-white md:hidden">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-grow p-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              {item.icon}
              <span>{item.name}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="p-4 border-t border-slate-800 space-y-3">
        <div className="flex items-center gap-3 px-2">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.fullName || ""}
              className="w-9 h-9 rounded-full object-cover border-2 border-emerald-500/30"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-200 truncate">
              {user?.fullName || user?.email?.split("@")[0] || "Student"}
            </p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-red-500/20 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}

interface StudentLayoutProps {
  children: ReactNode;
}

export default function StudentLayout({ children }: StudentLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-slate-900 text-slate-100">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-screen sticky top-0">
        <StudentSidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-10 h-full w-64">
            <StudentSidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-grow flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="md:hidden h-14 bg-slate-950 border-b border-slate-800 px-4 flex items-center gap-3 sticky top-0 z-40">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-400 hover:text-white p-1"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-white font-bold">
            <GraduationCap className="w-5 h-5 text-emerald-400" />
            EduPath
          </div>
        </header>

        <main className="flex-grow overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
