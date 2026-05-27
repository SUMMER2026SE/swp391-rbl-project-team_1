"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import api from "@/services/api";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";
import { CalendarCheck, Users, Clock, XCircle, TrendingUp } from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  totalAppointmentsToday: number;
  pendingAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  totalPatients: number;
}

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/doctor/dashboard/stats");
        setStats(res.data);
      } catch (err: any) {
        setError("Không thể tải dữ liệu thống kê. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === "DOCTOR") {
      fetchStats();
    }
  }, [user]);

  if (loading) return <div className="flex justify-center p-12"><LoadingSpinner className="w-8 h-8 text-teal-600" /></div>;
  if (error) return <Alert type="error" message={error} />;

  const statCards = [
    { title: "Lịch hẹn hôm nay", value: stats?.totalAppointmentsToday || 0, icon: <CalendarCheck className="w-8 h-8 text-blue-500" />, bg: "bg-blue-50", href: "/doctor/appointments" },
    { title: "Chờ xác nhận", value: stats?.pendingAppointments || 0, icon: <Clock className="w-8 h-8 text-yellow-500" />, bg: "bg-yellow-50", href: "/doctor/appointments" },
    { title: "Tổng bệnh nhân", value: stats?.totalPatients || 0, icon: <Users className="w-8 h-8 text-teal-500" />, bg: "bg-teal-50", href: "/doctor/patients" },
    { title: "Đã hoàn thành", value: stats?.completedAppointments || 0, icon: <TrendingUp className="w-8 h-8 text-green-500" />, bg: "bg-green-50", href: "/doctor/appointments" },
    { title: "Đã hủy", value: stats?.cancelledAppointments || 0, icon: <XCircle className="w-8 h-8 text-red-500" />, bg: "bg-red-50", href: "/doctor/appointments" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Tổng quan</h2>
        <p className="text-slate-500">Theo dõi hoạt động phòng khám của bạn hôm nay.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card, idx) => (
          <Link href={card.href} key={idx} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className={`p-3 rounded-xl ${card.bg}`}>
              {card.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{card.title}</p>
              <h3 className="text-2xl font-bold text-slate-800">{card.value}</h3>
            </div>
          </Link>
        ))}
      </div>

      {/* Placeholders for charts or upcoming appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 min-h-[400px] flex items-center justify-center">
          <div className="text-center text-slate-400">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>Biểu đồ thống kê đang được cập nhật...</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 min-h-[400px]">
          <h3 className="font-bold text-lg text-slate-800 mb-4">Lịch hẹn tiếp theo</h3>
          <div className="space-y-4">
            <p className="text-sm text-slate-500 italic">Tính năng danh sách lịch hẹn nhanh sẽ hiển thị tại đây.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
