"use client";

import React, { useEffect, useState, useCallback } from "react";
import { adminService } from "@/services/admin.service";
import {
  AdminStatistics,
  AppointmentsByStatus,
  AppointmentsBySpecialty,
  AppointmentsByMonth,
} from "@/types/admin";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";
import {
  Users,
  Stethoscope,
  CalendarRange,
  Download,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";


const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  CONFIRMED: "#3b82f6",
  COMPLETED: "#10b981",
  CANCELLED: "#ef4444",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  COMPLETED: "Đã hoàn thành",
  CANCELLED: "Đã hủy",
};

const CHART_COLORS = ["#14b8a6", "#6366f1", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];

function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AdminStatisticsPage() {
  const [statistics, setStatistics] = useState<AdminStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStatistics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminService.getStatistics();
      setStatistics(res.data);
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Không thể tải dữ liệu thống kê.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  const handleExportAppointments = () => {
    if (!statistics) return;
    const headers = ["Trạng thái", "Số lượng"];
    const statusData = Array.isArray(statistics.appointmentsByStatus) ? statistics.appointmentsByStatus : [];
    const rows = statusData.map((s) => [
      STATUS_LABELS[s.status] || s.status,
      String(s.count),
    ]);
    downloadCSV("appointments_by_status.csv", headers, rows);
  };

  const handleExportBySpecialty = () => {
    if (!statistics) return;
    const headers = ["Chuyên khoa", "Số lịch hẹn"];
    const specialtyData = Array.isArray(statistics.appointmentsBySpecialty) ? statistics.appointmentsBySpecialty : [];
    const rows = specialtyData.map((s) => [s.specialty, String(s.count)]);
    downloadCSV("appointments_by_specialty.csv", headers, rows);
  };

  const handleExportByMonth = () => {
    if (!statistics) return;
    const headers = ["Tháng", "Số lịch hẹn"];
    const monthData = Array.isArray(statistics.appointmentsByMonth) ? statistics.appointmentsByMonth : [];
    const rows = monthData.map((m) => [m.month, String(m.count)]);
    downloadCSV("appointments_by_month.csv", headers, rows);
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <LoadingSpinner className="mx-auto h-12 w-12 text-teal-400" />
          <p className="mt-4 text-sm text-slate-400">Đang tải dữ liệu thống kê...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-white">Thống kê & Báo cáo</h1>
        </div>
        <Alert type="error" message={error} className="bg-red-950/40 border-red-900/50 text-red-300" />
      </div>
    );
  }

  if (!statistics) return null;

  const safeAppointmentsByStatus = Array.isArray(statistics.appointmentsByStatus) ? statistics.appointmentsByStatus : [];
  const safeAppointmentsBySpecialty = Array.isArray(statistics.appointmentsBySpecialty) ? statistics.appointmentsBySpecialty : [];
  const safeAppointmentsByMonth = Array.isArray(statistics.appointmentsByMonth) ? statistics.appointmentsByMonth : [];

  const pieData = safeAppointmentsByStatus.map((s: AppointmentsByStatus) => ({
    name: STATUS_LABELS[s.status] || s.status,
    value: s.count,
    color: STATUS_COLORS[s.status] || "#64748b",
  }));

  const barData = safeAppointmentsBySpecialty.map((s: AppointmentsBySpecialty) => ({
    name: s.specialty.length > 12 ? `${s.specialty.substring(0, 12)}...` : s.specialty,
    fullName: s.specialty,
    count: s.count,
  }));

  const lineData = safeAppointmentsByMonth.map((m: AppointmentsByMonth) => ({
    name: m.month,
    count: m.count,
  }));

  const summaryCards = [
    {
      title: "Tổng Thành viên",
      value: statistics.totalUsers || 0,
      icon: <Users className="h-6 w-6 text-teal-400" />,
      color: "border-teal-500/20 bg-teal-500/5",
    },
    {
      title: "Tổng Bác sĩ",
      value: statistics.totalDoctors || 0,
      icon: <Stethoscope className="h-6 w-6 text-indigo-400" />,
      color: "border-indigo-500/20 bg-indigo-500/5",
    },
    {
      title: "Tổng Lịch hẹn",
      value: statistics.totalAppointments || 0,
      icon: <CalendarRange className="h-6 w-6 text-blue-400" />,
      color: "border-blue-500/20 bg-blue-500/5",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-white">Thống kê & Báo cáo</h1>
        <p className="text-sm text-slate-400">
          Phân tích dữ liệu hoạt động hệ thống y tế với các biểu đồ trực quan.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {summaryCards.map((card) => (
          <div key={card.title} className={`border rounded-2xl p-5 space-y-4 shadow-sm ${card.color}`}>
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{card.title}</span>
              {card.icon}
            </div>
            <p className="text-3xl font-black text-white">{card.value.toLocaleString("vi-VN")}</p>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - Status Distribution */}
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-teal-400" />
              <h3 className="font-bold text-white text-base">Phân bổ theo Trạng thái</h3>
            </div>
            <button
              onClick={handleExportAppointments}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-slate-900 text-slate-400 border border-slate-800 hover:text-teal-400 hover:border-teal-500/20 transition-all"
            >
              <Download className="h-3.5 w-3.5" /> Xuất CSV
            </button>
          </div>

          {pieData.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">Chưa có dữ liệu</div>
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid #1e293b",
                      borderRadius: "12px",
                      fontSize: "12px",
                      color: "#e2e8f0",
                    }}
                    itemStyle={{ color: "#e2e8f0" }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value: string) => (
                      <span style={{ color: "#94a3b8", fontSize: "11px", fontWeight: 600 }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Bar Chart - By Specialty */}
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-400" />
              <h3 className="font-bold text-white text-base">Lịch hẹn theo Chuyên khoa</h3>
            </div>
            <button
              onClick={handleExportBySpecialty}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-slate-900 text-slate-400 border border-slate-800 hover:text-teal-400 hover:border-teal-500/20 transition-all"
            >
              <Download className="h-3.5 w-3.5" /> Xuất CSV
            </button>
          </div>

          {barData.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">Chưa có dữ liệu</div>
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    axisLine={{ stroke: "#1e293b" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    axisLine={{ stroke: "#1e293b" }}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid #1e293b",
                      borderRadius: "12px",
                      fontSize: "12px",
                      color: "#e2e8f0",
                    }}
                    labelFormatter={(_label, payload) => {
                      if (payload && payload.length > 0) {
                        const item = payload[0]?.payload as { fullName?: string };
                        return item?.fullName || String(_label);
                      }
                      return String(_label);
                    }}
                    formatter={(value) => [`${value} lịch hẹn`, "Số lượng"]}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={50}>
                    {barData.map((_entry, index) => (
                      <Cell key={`bar-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Line Chart - Monthly (Full Width) */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            <h3 className="font-bold text-white text-base">Lịch hẹn theo Tháng (6 tháng gần nhất)</h3>
          </div>
          <button
            onClick={handleExportByMonth}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-slate-900 text-slate-400 border border-slate-800 hover:text-teal-400 hover:border-teal-500/20 transition-all"
          >
            <Download className="h-3.5 w-3.5" /> Xuất CSV
          </button>
        </div>

        {lineData.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">Chưa có dữ liệu</div>
        ) : (
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={{ stroke: "#1e293b" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={{ stroke: "#1e293b" }}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #1e293b",
                    borderRadius: "12px",
                    fontSize: "12px",
                    color: "#e2e8f0",
                  }}
                  formatter={(value) => [`${value} lịch hẹn`, "Số lượng"]}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#14b8a6"
                  strokeWidth={3}
                  dot={{ fill: "#14b8a6", r: 5, strokeWidth: 2, stroke: "#0f172a" }}
                  activeDot={{ r: 7, stroke: "#14b8a6", strokeWidth: 2, fill: "#0f172a" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
