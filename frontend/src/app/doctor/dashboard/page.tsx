"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import api from "@/services/api";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";
import { CalendarCheck, Users, Clock, XCircle, TrendingUp } from "lucide-react";
import Link from "next/link";

interface DoctorAppointment {
  id: string;
  appointmentDate: string;
  status: string;
  user?: { email: string; name?: string };
}

interface DashboardStats {
  totalAppointmentsToday: number;
  pendingAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  totalPatients: number;
  recentAppointments?: DoctorAppointment[];
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

    if (user?.role === "MENTOR") {
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

  const totalAppointments = (stats?.pendingAppointments || 0) + (stats?.completedAppointments || 0) + (stats?.cancelledAppointments || 0);
  const getPercentage = (value: number) => {
    if (totalAppointments === 0) return 0;
    return Math.round((value / totalAppointments) * 100);
  };

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
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5 text-teal-500" />
            <h3 className="font-bold text-slate-800 text-base">Phân tích Lịch hẹn</h3>
          </div>

          <div className="space-y-6 mt-4">
            {/* Pending Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-slate-600">Chờ xác nhận</span>
                <span className="text-yellow-600 font-bold">{stats?.pendingAppointments || 0} ({getPercentage(stats?.pendingAppointments || 0)}%)</span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  style={{ width: `${getPercentage(stats?.pendingAppointments || 0)}%` }}
                  className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                />
              </div>
            </div>

            {/* Completed Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-slate-600">Đã hoàn thành</span>
                <span className="text-green-600 font-bold">{stats?.completedAppointments || 0} ({getPercentage(stats?.completedAppointments || 0)}%)</span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  style={{ width: `${getPercentage(stats?.completedAppointments || 0)}%` }}
                  className="h-full bg-green-500 rounded-full transition-all duration-500"
                />
              </div>
            </div>

            {/* Cancelled Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-slate-600">Đã hủy</span>
                <span className="text-red-600 font-bold">{stats?.cancelledAppointments || 0} ({getPercentage(stats?.cancelledAppointments || 0)}%)</span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  style={{ width: `${getPercentage(stats?.cancelledAppointments || 0)}%` }}
                  className="h-full bg-red-500 rounded-full transition-all duration-500"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 text-base">Lịch hẹn tiếp theo</h3>
            <Link href="/doctor/appointments">
              <span className="text-xs text-teal-600 hover:underline font-semibold cursor-pointer">Xem tất cả</span>
            </Link>
          </div>
          <div className="space-y-4 flex-grow overflow-y-auto">
            {!stats?.recentAppointments || stats.recentAppointments.length === 0 ? (
              <p className="text-sm text-slate-500 italic text-center py-8">Chưa có lịch hẹn nào sắp tới.</p>
            ) : (
              stats.recentAppointments.map((app) => (
                <div key={app.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-slate-800 text-sm">{app.user?.name || app.user?.email || "Bệnh nhân"}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                      app.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                      app.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' :
                      app.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {app.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(app.appointmentDate).toLocaleString('vi-VN')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
