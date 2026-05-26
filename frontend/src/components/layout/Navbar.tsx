"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Menu, X, Calendar, LogOut, User as UserIcon, ShieldAlert } from "lucide-react";
import Button from "../common/Button";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const navLinks = [
    { name: "Trang Chủ", href: "/" },
    { name: "Danh Sách Bác Sĩ", href: "/doctors" },
  ];

  if (isAuthenticated && user?.role === "USER") {
    navLinks.push({ name: "Lịch Hẹn Của Tôi", href: "/my-appointments" });
  }

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 text-teal-600 font-bold text-xl tracking-tight">
              <div className="p-2 bg-teal-50 rounded-xl text-teal-600">
                <Calendar className="h-6 w-6" />
              </div>
              <span>MedBooking</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "text-teal-600 font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 text-slate-700 text-sm">
                  <UserIcon className="h-4 w-4 text-teal-600" />
                  <span className="font-medium max-w-[120px] truncate">{user.email}</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-teal-100 text-teal-800">
                    {user.role}
                  </span>
                </div>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="!px-3.5 !py-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="outline" className="!px-4 !py-2">
                    Đăng Nhập
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="teal" className="!px-4 !py-2">
                    Đăng Ký
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger menu */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-500 hover:text-slate-700 focus:outline-none p-2 rounded-lg hover:bg-slate-50"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 pt-2 pb-4 space-y-2 shadow-inner">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className={`block px-3 py-2.5 rounded-xl text-base font-medium transition-colors ${
                isActive(link.href)
                  ? "bg-teal-50 text-teal-600 font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {link.name}
            </Link>
          ))}

          <div className="pt-4 border-t border-slate-100">
            {isAuthenticated && user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 text-slate-700">
                  <UserIcon className="h-5 w-5 text-teal-600" />
                  <span className="font-medium text-sm">{user.email}</span>
                  <span className="ml-auto text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-teal-100 text-teal-800">
                    {user.role}
                  </span>
                </div>
                <Button
                  variant="danger"
                  onClick={() => {
                    setIsOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <LogOut className="h-4 w-4" /> Đăng Xuất
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link href="/login" onClick={() => setIsOpen(false)} className="w-full">
                  <Button variant="outline" className="w-full">
                    Đăng Nhập
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setIsOpen(false)} className="w-full">
                  <Button variant="teal" className="w-full">
                    Đăng Ký
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
