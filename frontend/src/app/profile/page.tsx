"use client";

import React, { useState, useEffect } from "react";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { User as UserIcon, FileText, CalendarDays, Ticket, Star, ShieldCheck, LogOut } from "lucide-react";
import PersonalInfoTab from "@/components/profile/PersonalInfoTab";
import MedicalRecordsTab from "@/components/profile/MedicalRecordsTab";
import AppointmentsTab from "@/components/profile/AppointmentsTab";
import VouchersTab from "@/components/profile/VouchersTab";
import ReviewsTab from "@/components/profile/ReviewsTab";
import SecurityTab from "@/components/profile/SecurityTab";
import SupportTab from "@/components/profile/SupportTab";
import { useRouter } from "next/navigation";

type TabId = "info" | "medical-records" | "appointments" | "vouchers" | "reviews" | "security" | "support";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "info", label: "Thông tin cá nhân", icon: <UserIcon className="w-4 h-4" /> },
  { id: "medical-records", label: "Hồ sơ bệnh án", icon: <FileText className="w-4 h-4" /> },
  { id: "appointments", label: "Lịch hẹn", icon: <CalendarDays className="w-4 h-4" /> },
  { id: "vouchers", label: "Voucher", icon: <Ticket className="w-4 h-4" /> },
  { id: "reviews", label: "Đánh giá của tôi", icon: <Star className="w-4 h-4" /> },
  { id: "support", label: "Trung tâm hỗ trợ", icon: <FileText className="w-4 h-4" /> },
  { id: "security", label: "Bảo mật", icon: <ShieldCheck className="w-4 h-4" /> },
];

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}

function ProfileContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("info");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const hash = window.location.hash.replace("#", "") as TabId;
    if (TABS.some(t => t.id === hash)) {
      setActiveTab(hash);
    }
  }, []);

  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
    window.history.pushState(null, "", `#${tabId}`);
  };

  if (!isMounted) return null;

  const currentAvatarUrl = user?.avatar ? (user.avatar.startsWith("http") ? user.avatar : (user.avatar.startsWith("/public/") ? `http://localhost:5000${user.avatar}` : user.avatar)) : null;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Header Banner */}
      <div className="bg-teal-900 h-32 md:h-48 w-full object-cover relative">
        <div className="absolute inset-0 bg-[url('/pattern-dots.svg')] opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-teal-950/80 to-transparent"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 md:-mt-24 relative z-10">
        {/* User Summary Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/40 p-6 md:p-8 flex flex-col md:flex-row items-center md:items-end gap-6 mb-8 border border-slate-100">
          <div className="relative group">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-lg overflow-hidden bg-slate-100 shrink-0">
              {currentAvatarUrl ? (
                <img src={currentAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-teal-50 text-teal-600 text-5xl font-bold">
                  {user?.fullName?.charAt(0) || "U"}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800">{user?.fullName || "Chưa cập nhật tên"}</h1>
              <span className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center w-fit mx-auto md:mx-0">
                {user?.role === "DOCTOR" ? "Bác sĩ" : user?.role === "ADMIN" ? "Quản trị viên" : "Bệnh nhân"}
              </span>
            </div>
            <div className="text-slate-500 flex flex-col sm:flex-row items-center gap-2 sm:gap-6 text-sm">
              <p>{user?.email}</p>
              <span className="hidden sm:inline text-slate-300">•</span>
              <p>Tham gia: {new Date(user?.createdAt || Date.now()).toLocaleDateString("vi-VN")}</p>
            </div>
          </div>
          
          <button 
            onClick={() => { logout(); router.push('/login'); }}
            className="flex items-center gap-2 text-sm font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-4 py-2.5 rounded-xl transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" /> Đăng xuất
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
          <div className="flex overflow-x-auto hide-scrollbar">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold whitespace-nowrap transition-all border-b-2 ${
                  activeTab === tab.id
                    ? "border-teal-600 text-teal-700 bg-teal-50/30"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === "info" && <PersonalInfoTab />}
          {activeTab === "medical-records" && <MedicalRecordsTab />}
          {activeTab === "appointments" && <AppointmentsTab />}
          {activeTab === "vouchers" && <VouchersTab />}
          {activeTab === "reviews" && <ReviewsTab />}
          {activeTab === "support" && <SupportTab />}
          {activeTab === "security" && <SecurityTab />}
        </div>
      </div>
    </div>
  );
}
