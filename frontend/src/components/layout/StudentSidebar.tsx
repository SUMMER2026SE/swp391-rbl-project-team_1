'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  KanbanSquare,
  Compass,
  BookOpen,
  Award,
  Trophy,
  Timer,
  User,
  LogOut,
  ChevronRight
} from 'lucide-react';

interface SidebarItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}

function SidebarItem({ href, icon, label, active }: SidebarItemProps) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group ${
        active
          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`transition-transform duration-300 group-hover:scale-110`}>
          {icon}
        </div>
        <span className="font-medium text-sm">{label}</span>
      </div>
      {!active && (
        <ChevronRight className="w-4 h-4 opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" />
      )}
    </Link>
  );
}

export function StudentSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const menuItems = [
    {
      href: '/student/dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      label: 'Tổng quan'
    },
    {
      href: '/student/workspace',
      icon: <KanbanSquare className="w-5 h-5" />,
      label: 'Bảng học tập'
    },
    {
      href: '/student/roadmap',
      icon: <Compass className="w-5 h-5" />,
      label: 'Lộ trình cá nhân'
    },
    {
      href: '/student/pomodoro',
      icon: <Timer className="w-5 h-5" />,
      label: 'Focus Pomodoro'
    },
    {
      href: '/student/community',
      icon: <BookOpen className="w-5 h-5" />,
      label: 'Thư viện chung'
    },
    {
      href: '/student/achievements',
      icon: <Award className="w-5 h-5" />,
      label: 'Thành tích'
    },
    {
      href: '/student/achievements/leaderboard',
      icon: <Trophy className="w-5 h-5" />,
      label: 'Bảng xếp hạng'
    }
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-900 h-screen sticky top-0 flex flex-col justify-between p-4 z-40">
      <div className="flex flex-col gap-8">
        {/* Brand Logo */}
        <Link href="/student/dashboard" className="flex items-center gap-3 px-3 py-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
            <span className="text-white font-bold text-lg">E</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-base tracking-wide leading-none">EduPath</h1>
            <span className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider">Adaptive AI</span>
          </div>
        </Link>

        {/* Menu Items */}
        <nav className="flex flex-col gap-1.5">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              active={pathname === item.href}
            />
          ))}
        </nav>
      </div>

      {/* User Actions */}
      <div className="flex flex-col gap-4 border-t border-slate-900 pt-4">
        {user && (
          <div className="flex items-center gap-3 px-3 py-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-inner uppercase">
              {user.fullName.substring(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-200 text-sm font-semibold truncate leading-none mb-1">
                {user.fullName}
              </p>
              <p className="text-slate-500 text-xs truncate leading-none">
                {user.email}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-950/20 transition-all duration-300 w-full text-left font-medium text-sm group"
        >
          <LogOut className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}

export default StudentSidebar;
