"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Menu, X, Calendar, LogOut, User as UserIcon, ShieldAlert, LayoutDashboard } from "lucide-react";
import Button from "../common/Button";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

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
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl px-3.5 py-1.5 text-slate-700 text-sm transition-all focus:outline-none cursor-pointer"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar.startsWith("http") ? user.avatar : `http://localhost:5000${user.avatar}`}
                      alt={user.fullName || user.email}
                      className="h-6 w-6 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-[10px]">
                      {(user.fullName || user.email).slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className="font-semibold max-w-[120px] truncate">
                    {user.fullName || user.email.split("@")[0]}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-teal-100 text-teal-800">
                    {user.role}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <>
                    {/* Backdrop to close dropdown on click outside */}
                    <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                    <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl z-20 animate-in fade-in slide-in-from-top-2 duration-150">
                      <Link
                        href="/profile"
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <UserIcon className="h-4 w-4 text-teal-600" />
                        <span>Trang cá nhân</span>
                      </Link>
                      {user.role === "USER" && (
                        <Link
                          href="/my-appointments"
                          onClick={() => setShowDropdown(false)}
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Calendar className="h-4 w-4 text-teal-600" />
                          <span>Lịch hẹn của tôi</span>
                        </Link>
                      )}
                      {user.role === "DOCTOR" && (
                        <Link
                          href="/doctor/dashboard"
                          onClick={() => setShowDropdown(false)}
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <LayoutDashboard className="h-4 w-4 text-teal-600" />
                          <span>Bảng điều khiển</span>
                        </Link>
                      )}
                      {user.role === "ADMIN" && (
                        <Link
                          href="/admin"
                          onClick={() => setShowDropdown(false)}
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <LayoutDashboard className="h-4 w-4 text-teal-600" />
                          <span>Bảng điều khiển</span>
                        </Link>
                      )}
                      <hr className="my-1 border-slate-100" />
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </>
                )}
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
              <div className="space-y-2">
                <Link
                  href="/profile"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar.startsWith("http") ? user.avatar : `http://localhost:5000${user.avatar}`}
                      alt={user.fullName || user.email}
                      className="h-6 w-6 rounded-full object-cover"
                    />
                  ) : (
                    <UserIcon className="h-5 w-5 text-teal-600" />
                  )}
                  <span className="font-semibold text-sm">{user.fullName || user.email}</span>
                  <span className="ml-auto text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-teal-100 text-teal-800">
                    {user.role}
                  </span>
                </Link>
                {user.role === "DOCTOR" && (
                  <Link
                    href="/doctor/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <LayoutDashboard className="h-5 w-5 text-teal-600" />
                    <span>Bảng điều khiển Bác sĩ</span>
                  </Link>
                )}
                {user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <LayoutDashboard className="h-5 w-5 text-teal-600" />
                    <span>Bảng điều khiển Quản trị</span>
                  </Link>
                )}
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
