"use client";

import React, { useEffect, useState, useCallback } from "react";
import { adminService } from "@/services/admin.service";
import { AdminOverview, AdminChartData, AdminAppointment } from "@/types/admin";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";
import toast from "react-hot-toast";
import {
  Calendar,
  UserCheck,
  Users,
  XCircle,
  MoreVertical
} from "lucide-react";
// @ts-ignore
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

const STATUS_BADGES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  CONFIRMED: "bg-blue-100 text-blue-800 border-blue-200",
  COMPLETED: "bg-teal-100 text-teal-800 border-teal-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  COMPLETED: "Đã hoàn thành",
  CANCELLED: "Đã hủy",
};

export default function AdminStatisticsPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [chartData, setChartData] = useState<AdminChartData[]>([]);
  const [recentAppointments, setRecentAppointments] = useState<AdminAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [overviewRes, chartRes, appointmentsRes] = await Promise.all([
        adminService.getOverview(),
        adminService.getChart(30),
        adminService.getAppointments()
      ]);
      setOverview(overviewRes.data);
      setChartData(chartRes.data);
      // Sort appointments by createdAt desc, take 10
      const sorted = appointmentsRes.data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRecentAppointments(sorted.slice(0, 10));
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Không thể tải dữ liệu thống kê.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <LoadingSpinner className="h-12 w-12 text-teal-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert type="error" message={error} className="bg-red-950/40 border-red-900/50 text-red-300" />
      </div>
    );
  }

  const today = new Date();
  const days = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const formattedDate = `${days[today.getDay()]}, ${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Thống Kê Hệ Thống</h1>
        <p className="text-sm text-slate-400 mt-1">{formattedDate}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-sm flex flex-col">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-500/20 text-teal-400 rounded-lg">
              <Calendar className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-400">Lịch hẹn hôm nay</p>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <h3 className="text-3xl font-bold">{overview?.totalAppointments || 0}</h3>
            <span className="text-xs font-semibold px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-md">+5%</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-sm flex flex-col">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
              <UserCheck className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-400">Bác sĩ đang hoạt động</p>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <h3 className="text-3xl font-bold">{overview?.totalDoctors || 0}</h3>
            <span className="text-xs font-semibold px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-md">+2%</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-sm flex flex-col">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-400">Bệnh nhân</p>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <h3 className="text-3xl font-bold">{overview?.totalUsers || 0}</h3>
            <span className="text-xs font-semibold px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-md">+12%</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-sm flex flex-col">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 text-red-400 rounded-lg">
              <XCircle className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-400">Lịch hủy hôm nay</p>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <h3 className="text-3xl font-bold">{overview?.cancelledToday || 0}</h3>
            <span className="text-xs font-semibold px-2 py-1 bg-red-500/10 text-red-400 rounded-md">-1%</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-sm">
        <h3 className="text-lg font-bold mb-6">Biểu đồ Lịch hẹn (30 ngày)</h3>
        <div className="w-full h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                itemStyle={{ color: '#f8fafc' }}
              />
              <Legend verticalAlign="top" height={36} />
              <Line 
                type="monotone" 
                name="Đặt lịch" 
                dataKey="bookings" 
                stroke="#0B7B6B" 
                strokeWidth={3} 
                dot={{ r: 4, strokeWidth: 2 }} 
                activeDot={{ r: 6 }} 
              />
              <Line 
                type="monotone" 
                name="Đã hủy" 
                dataKey="cancelled" 
                stroke="#ef4444" 
                strokeWidth={3} 
                dot={{ r: 4, strokeWidth: 2 }} 
                activeDot={{ r: 6 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <h3 className="text-lg font-bold">Lịch hẹn gần đây</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/50 text-slate-400 font-medium">
              <tr>
                <th className="px-6 py-4">Bệnh nhân</th>
                <th className="px-6 py-4">Bác sĩ</th>
                <th className="px-6 py-4">Ngày giờ</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {recentAppointments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Không có lịch hẹn nào gần đây.
                  </td>
                </tr>
              ) : (
                recentAppointments.map((appt) => {
                  const date = new Date(appt.appointmentDate);
                  return (
                    <tr key={appt.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-200">
                        {appt.user ? appt.user.email : "N/A"}
                      </td>
                      <td className="px-6 py-4">
                        {appt.doctor ? appt.doctor.name : "N/A"}
                      </td>
                      <td className="px-6 py-4">
                        {date.toLocaleDateString("vi-VN")} {date.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${STATUS_BADGES[appt.status] || "bg-slate-100 text-slate-800"}`}>
                          {STATUS_LABELS[appt.status] || appt.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
