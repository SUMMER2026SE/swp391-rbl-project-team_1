"use client";

import React, { useEffect, useState } from "react";
import { adminService } from "@/services/admin.service";
import { AdminUser, AdminAppointment } from "@/types/admin";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";
import { Users, UserCog, CalendarRange, Clock, CheckCircle2, TrendingUp } from "lucide-react";
import Link from "next/link";
import Button from "@/components/common/Button";

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all data in parallel
        const [usersRes, appointmentsRes] = await Promise.all([
          adminService.getUsers(),
          adminService.getAppointments(),
        ]);

        setUsers(usersRes.data);
        setAppointments(appointmentsRes.data);
      } catch (err: unknown) {
        const errorMsg =
          err && typeof err === "object" && "message" in err
            ? String((err as { message: unknown }).message)
            : "Không thể đồng bộ dữ liệu quản trị. Vui lòng kiểm tra kết nối Server.";
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  // Stats Calculations
  const totalUsers = users.length;
  const totalDoctors = users.filter((u) => u.role === "DOCTOR").length;
  const totalAdmins = users.filter((u) => u.role === "ADMIN").length;
  const totalAppointments = appointments.length;
  const pendingAppointments = appointments.filter((a) => a.status === "PENDING").length;
  const confirmedAppointments = appointments.filter((a) => a.status === "CONFIRMED").length;
  const completedAppointments = appointments.filter((a) => a.status === "COMPLETED").length;
  const cancelledAppointments = appointments.filter((a) => a.status === "CANCELLED").length;

  const statsCards = [
    {
      title: "Tổng Thành Viên",
      value: totalUsers,
      sub: `${totalAdmins} Quản trị viên`,
      icon: <Users className="h-6 w-6 text-teal-400" />,
      color: "border-teal-500/20 bg-teal-500/5",
    },
    {
      title: "Bác Sĩ Hệ Thống",
      value: totalDoctors,
      sub: "Đang liên kết tài khoản",
      icon: <UserCog className="h-6 w-6 text-indigo-400" />,
      color: "border-indigo-500/20 bg-indigo-500/5",
    },
    {
      title: "Tổng Lịch Hẹn",
      value: totalAppointments,
      sub: "Tất cả các thời điểm",
      icon: <CalendarRange className="h-6 w-6 text-blue-400" />,
      color: "border-blue-500/20 bg-blue-500/5",
    },
    {
      title: "Chờ Xác Nhận",
      value: pendingAppointments,
      sub: "Yêu cầu cần duyệt gấp",
      icon: <Clock className="h-6 w-6 text-amber-400" />,
      color: "border-amber-500/20 bg-amber-500/5",
    },
    {
      title: "Đã Hoàn Thành",
      value: completedAppointments,
      sub: "Cuộc hẹn đã khám xong",
      icon: <CheckCircle2 className="h-6 w-6 text-emerald-400" />,
      color: "border-emerald-500/20 bg-emerald-500/5",
    },
  ];

  // Visual percentages for the custom CSS bar chart
  const getPercentage = (value: number) => {
    if (totalAppointments === 0) return 0;
    return Math.round((value / totalAppointments) * 100);
  };

  const recentAppointments = appointments.slice(0, 5);

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="text-center">
          <LoadingSpinner className="mx-auto h-12 w-12 text-teal-400" />
          <p className="mt-4 text-sm text-slate-400">Đang khởi tạo số liệu phân tích...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-white">Tổng quan Hoạt động</h1>
        <p className="text-sm text-slate-400">Chào mừng bạn quay lại. Dưới đây là báo cáo trực quan về hệ thống y tế.</p>
      </div>

      {error && <Alert type="error" message={error} className="bg-red-950/40 border-red-900/50 text-red-300" />}

      {/* Stats Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {statsCards.map((card) => (
          <div key={card.title} className={`border rounded-2xl p-5 space-y-4 shadow-sm ${card.color}`}>
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{card.title}</span>
              {card.icon}
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-black text-white">{card.value}</p>
              <p className="text-[10px] text-slate-500 font-medium">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Custom SVG & CSS Bar Chart Breakdown */}
        <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5 text-teal-400" />
            <h3 className="font-bold text-white text-base">Phân tích Lịch hẹn</h3>
          </div>

          <div className="space-y-5">
            {/* Pending Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400">Chờ xác nhận (PENDING)</span>
                <span className="text-amber-400 font-bold">{pendingAppointments} ({getPercentage(pendingAppointments)}%)</span>
              </div>
              <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden">
                <div
                  style={{ width: `${getPercentage(pendingAppointments)}%` }}
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                />
              </div>
            </div>

            {/* Confirmed Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400">Đã xác nhận (CONFIRMED)</span>
                <span className="text-blue-400 font-bold">{confirmedAppointments} ({getPercentage(confirmedAppointments)}%)</span>
              </div>
              <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden">
                <div
                  style={{ width: `${getPercentage(confirmedAppointments)}%` }}
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                />
              </div>
            </div>

            {/* Completed Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400">Đã hoàn thành (COMPLETED)</span>
                <span className="text-emerald-400 font-bold">{completedAppointments} ({getPercentage(completedAppointments)}%)</span>
              </div>
              <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden">
                <div
                  style={{ width: `${getPercentage(completedAppointments)}%` }}
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                />
              </div>
            </div>

            {/* Cancelled Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400">Đã hủy (CANCELLED)</span>
                <span className="text-red-400 font-bold">{cancelledAppointments} ({getPercentage(cancelledAppointments)}%)</span>
              </div>
              <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden">
                <div
                  style={{ width: `${getPercentage(cancelledAppointments)}%` }}
                  className="h-full bg-red-500 rounded-full transition-all duration-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Recent Appointments List Table */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-sm overflow-hidden flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-white text-base">Lịch đặt khám gần đây</h3>
            <Link href="/admin/appointments">
              <span className="text-xs text-teal-400 hover:underline font-semibold cursor-pointer">Xem tất cả</span>
            </Link>
          </div>

          <div className="flex-grow overflow-x-auto">
            {recentAppointments.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs font-medium">Chưa ghi nhận lịch hẹn nào.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                    <th className="pb-3 font-semibold">Người bệnh</th>
                    <th className="pb-3 font-semibold">Bác sĩ</th>
                    <th className="pb-3 font-semibold">Ngày khám</th>
                    <th className="pb-3 font-semibold text-right">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-slate-900">
                  {recentAppointments.map((app) => {
                    const statusColors = {
                      PENDING: "text-amber-400 bg-amber-500/10 border-amber-500/20",
                      CONFIRMED: "text-blue-400 bg-blue-500/10 border-blue-500/20",
                      COMPLETED: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
                      CANCELLED: "text-red-400 bg-red-500/10 border-red-500/20",
                    };

                    const appDate = new Date(app.appointmentDate);

                    return (
                      <tr key={app.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="py-3.5 pr-2 font-medium text-slate-200">{app.user?.email || "Khách"}</td>
                        <td className="py-3.5 pr-2 text-slate-400">{app.doctor?.name || "Bác sĩ"}</td>
                        <td className="py-3.5 pr-2 text-slate-500">
                          {appDate.toLocaleDateString("vi-VN")}
                        </td>
                        <td className="py-3.5 text-right">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                              statusColors[app.status] || "text-slate-400"
                            }`}
                          >
                            {app.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
