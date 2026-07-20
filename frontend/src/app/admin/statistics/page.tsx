"use client";

import React, { useEffect, useState, useCallback } from "react";
import { adminService } from "@/services/admin.service";
import {
  AdminStatistics,
  AppointmentsByStatus,
  AppointmentsBySpecialty,
  TimeSeriesData,
  CancellationStat,
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
  XCircle,
  Banknote,
  Filter,
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
  AreaChart,
  Area,
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

function downloadBlobAsCsv(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export default function AdminStatisticsPage() {
  const [statistics, setStatistics] = useState<AdminStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  const loadStatistics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminService.getStatistics(period);
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
  }, [period]);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  const handleExportFullCSV = async () => {
    setExporting(true);
    try {
      const blob = await adminService.exportStatistics();
      downloadBlobAsCsv(blob, "booking_statistics.csv");
    } catch (err) {
      console.error("Export failed", err);
      alert("Xuất dữ liệu thất bại.");
    } finally {
      setExporting(false);
    }
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

  const safeAppointmentsByStatus = statistics.appointmentsByStatus ? Object.entries(statistics.appointmentsByStatus).map(([status, count]) => ({ status, count })) : [];
  const safeAppointmentsBySpecialty = Array.isArray(statistics.appointmentsBySpecialty) ? statistics.appointmentsBySpecialty : [];
  const safeAppointmentsOverTime = Array.isArray(statistics.appointmentsOverTime) ? statistics.appointmentsOverTime : [];
  const safeRevenueOverTime = Array.isArray(statistics.revenueOverTime) ? statistics.revenueOverTime : [];
  const safeCancellationStats = Array.isArray(statistics.cancellationStats) ? statistics.cancellationStats : [];

  const pieData = safeAppointmentsByStatus.map((s: {status: string, count: number}) => ({
    name: STATUS_LABELS[s.status] || s.status,
    value: s.count,
    color: STATUS_COLORS[s.status] || "#64748b",
  }));

  const barData = safeAppointmentsBySpecialty.map((s: AppointmentsBySpecialty) => ({
    name: s.specialty.length > 12 ? `${s.specialty.substring(0, 12)}...` : s.specialty,
    fullName: s.specialty,
    count: s.count,
  }));

  const lineData = safeAppointmentsOverTime.map((m) => ({
    name: m.period,
    count: m.count || 0,
  }));

  const revenueData = safeRevenueOverTime.map((m) => ({
    name: m.period,
    revenue: m.revenue || 0,
  }));

  const cancellationData = safeCancellationStats.map((c: CancellationStat) => ({
    name: c.reason.length > 15 ? `${c.reason.substring(0, 15)}...` : c.reason,
    fullName: c.reason,
    count: c.count,
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
    {
      title: "Tổng Doanh thu",
      value: `${(statistics.totalRevenue || 0).toLocaleString("vi-VN")}đ`,
      icon: <Banknote className="h-6 w-6 text-emerald-400" />,
      color: "border-emerald-500/20 bg-emerald-500/5",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-white">Thống kê & Báo cáo</h1>
          <p className="text-sm text-slate-400">
            Phân tích dữ liệu hoạt động hệ thống y tế với các biểu đồ trực quan.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-900 border border-slate-700 rounded-xl p-1 shadow-sm">
            {[
              { id: 'week', label: 'Tuần' },
              { id: 'month', label: 'Tháng' },
              { id: 'year', label: 'Năm' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id as any)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  period === p.id
                    ? 'bg-teal-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button
            onClick={handleExportFullCSV}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-sm disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> {exporting ? "Đang xuất..." : "Xuất toàn bộ CSV"}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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

      {/* Area Chart - Revenue (Full Width) */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-yellow-400" />
            <h3 className="font-bold text-white text-base">Biến động Doanh thu</h3>
          </div>
        </div>

        {revenueData.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">Chưa có dữ liệu</div>
        ) : (
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#eab308" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                  </linearGradient>
                </defs>
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
                  tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #1e293b",
                    borderRadius: "12px",
                    fontSize: "12px",
                    color: "#e2e8f0",
                  }}
                  formatter={(value: any) => [`${Number(value).toLocaleString("vi-VN")}đ`, "Doanh thu"]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#eab308"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-400" />
            <h3 className="font-bold text-white text-base">Lý do Hủy Lịch Hẹn</h3>
          </div>
        </div>

        {cancellationData.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">Chưa có dữ liệu</div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cancellationData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={true} vertical={false} />
                <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={{ stroke: "#1e293b" }} tickLine={false} allowDecimals={false} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fill: "#64748b", fontSize: 10 }} axisLine={{ stroke: "#1e293b" }} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", fontSize: "12px", color: "#e2e8f0" }}
                  labelFormatter={(_label, payload) => {
                    if (payload && payload.length > 0) {
                      const item = payload[0]?.payload as { fullName?: string };
                      return item?.fullName || String(_label);
                    }
                    return String(_label);
                  }}
                  formatter={(value) => [`${value} lượt hủy`, "Số lượng"]}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={30}>
                  {cancellationData.map((_entry, index) => (
                    <Cell key={`bar-cancel-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
