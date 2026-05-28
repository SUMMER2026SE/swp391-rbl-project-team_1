"use client";

import React, { useEffect, useState } from "react";
import { adminService } from "@/services/admin.service";
import { AdminAppointment } from "@/types/admin";
import { AppointmentStatus } from "@/types/appointment";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";
import { Search, CalendarDays, Clock, FileText, Activity, BadgeAlert, CheckSquare } from "lucide-react";
import { removeVietnameseTones } from "@/utils/stringUtils";

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<AdminAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<AppointmentStatus | "ALL">("ALL");

  // Interaction States
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function loadAppointments() {
    try {
      setLoading(true);
      setError(null);
      const res = await adminService.getAppointments();
      
      // Sort by date desc
      const sorted = res.data.sort(
        (a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
      );
      setAppointments(sorted);
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Không thể tải danh sách cuộc hẹn khám.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAppointments();
  }, []);

  // Filter list
  useEffect(() => {
    let result = [...appointments];

    if (searchQuery.trim()) {
      const q = removeVietnameseTones(searchQuery.trim());
      result = result.filter(
        (app) =>
          (app.user?.email && removeVietnameseTones(app.user.email).includes(q)) ||
          (app.doctor?.name && removeVietnameseTones(app.doctor.name).includes(q)) ||
          (app.doctor?.specialty?.name && removeVietnameseTones(app.doctor.specialty.name).includes(q))
      );
    }

    if (selectedStatus !== "ALL") {
      result = result.filter((app) => app.status === selectedStatus);
    }

    setFilteredAppointments(result);
  }, [searchQuery, selectedStatus, appointments]);

  // Handle status update
  const handleUpdateStatus = async (appId: string, newStatus: AppointmentStatus) => {
    setActionMessage(null);
    setUpdatingId(appId);
    try {
      const res = await adminService.updateAppointmentStatus(appId, newStatus);
      
      // Update local state smoothly
      setAppointments((prev) =>
        prev.map((app) => (app.id === appId ? { ...app, status: newStatus } : app))
      );

      setActionMessage({
        type: "success",
        text: res.message,
      });
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Không thể cập nhật trạng thái lịch hẹn.";
      setActionMessage({
        type: "error",
        text: errorMsg,
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadgeStyles = (status: AppointmentStatus) => {
    const styles = {
      PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      CONFIRMED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      COMPLETED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      CANCELLED: "bg-red-500/10 text-red-400 border-red-500/20",
    };
    return styles[status] || "bg-slate-800 text-slate-400 border-slate-700";
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <LoadingSpinner className="h-10 w-10 text-teal-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-white">Quản lý Lịch Hẹn</h1>
        <p className="text-sm text-slate-400">Xem toàn bộ danh sách, lọc theo trạng thái, tìm kiếm người bệnh/bác sĩ và cập nhật tiến độ cuộc hẹn khám.</p>
      </div>

      {error && <Alert type="error" message={error} className="bg-red-950/40 border-red-900/50 text-red-300" />}
      {actionMessage && <Alert type={actionMessage.type} message={actionMessage.text} className="my-2" />}

      {/* Filter and Search Bar */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-8 relative">
            <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
            <input
              type="text"
              placeholder="Tìm theo email người bệnh, tên bác sĩ hoặc chuyên khoa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm animate-fade-in"
            />
          </div>

          <div className="md:col-span-4">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as AppointmentStatus | "ALL")}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm cursor-pointer"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PENDING">Chờ xác nhận (PENDING)</option>
              <option value="CONFIRMED">Đã xác nhận (CONFIRMED)</option>
              <option value="COMPLETED">Đã hoàn thành (COMPLETED)</option>
              <option value="CANCELLED">Đã hủy (CANCELLED)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-20 text-slate-500 text-sm font-medium">Không tìm thấy cuộc hẹn khám nào.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950 text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                  <th className="p-5 font-semibold">Người bệnh (SĐT/Email)</th>
                  <th className="p-5 font-semibold">Bác sĩ & Chuyên khoa</th>
                  <th className="p-5 font-semibold">Thời gian khám</th>
                  <th className="p-5 font-semibold">Triệu chứng / Ghi chú</th>
                  <th className="p-5 font-semibold">Trạng thái (Status)</th>
                  <th className="p-5 font-semibold text-right">Duyệt nhanh</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-900">
                {filteredAppointments.map((app) => {
                  const appDate = new Date(app.appointmentDate);
                  const dateStr = appDate.toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  });
                  const timeStr = appDate.toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  });

                  const isUpdating = updatingId === app.id;

                  return (
                    <tr key={app.id} className="hover:bg-slate-900/40 transition-colors">
                      {/* Patient */}
                      <td className="p-5 font-bold text-slate-200">
                        {app.user?.email || "Khách vãng lai"}
                      </td>

                      {/* Doctor */}
                      <td className="p-5">
                        <div>
                          <p className="font-bold text-slate-200">{app.doctor?.name || "Bác sĩ Chuyên khoa"}</p>
                          <p className="text-[10px] text-teal-400 font-semibold mt-0.5">
                            {app.doctor?.specialty?.name || "Đang cập nhật"}
                          </p>
                        </div>
                      </td>

                      {/* DateTime */}
                      <td className="p-5 text-slate-300">
                        <div className="space-y-1 font-medium">
                          <p className="flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                            <span>{dateStr}</span>
                          </p>
                          <p className="flex items-center gap-1 text-[10px] text-slate-500">
                            <Clock className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                            <span>{timeStr} (24h)</span>
                          </p>
                        </div>
                      </td>

                      {/* Symptoms Note */}
                      <td className="p-5 text-slate-400 max-w-[200px]">
                        {app.notes ? (
                          <div className="flex gap-1 items-start bg-slate-900/40 p-2 rounded-lg border border-slate-800/40 mb-2">
                            <FileText className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                            <p className="italic leading-relaxed truncate hover:text-clip hover:whitespace-normal" title={app.notes}>
                              {app.notes}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-600 italic block mb-2">Không có ghi chú</span>
                        )}
                        {app.cancellationReason && app.status === "CANCELLED" && (
                          <div className="flex gap-1 items-start bg-red-950/40 p-2 rounded-lg border border-red-900/40 text-red-400">
                            <BadgeAlert className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                            <p className="italic leading-relaxed truncate hover:text-clip hover:whitespace-normal" title={app.cancellationReason}>
                              Huỷ: {app.cancellationReason}
                            </p>
                          </div>
                        )}
                      </td>

                      {/* Status badge */}
                      <td className="p-5">
                        {isUpdating ? (
                          <div className="flex items-center gap-1">
                            <LoadingSpinner className="h-4 w-4 text-teal-400" />
                            <span className="text-[10px] text-slate-500">Đang cập nhật...</span>
                          </div>
                        ) : (
                          <span
                            className={`inline-block px-2.5 py-1 rounded-lg border font-bold text-[10px] tracking-wide uppercase ${getStatusBadgeStyles(
                              app.status
                            )}`}
                          >
                            {app.status}
                          </span>
                        )}
                      </td>

                      {/* Action trigger quick selects */}
                      <td className="p-5 text-right">
                        <select
                          value={app.status}
                          disabled={isUpdating}
                          onChange={(e) => handleUpdateStatus(app.id, e.target.value as AppointmentStatus)}
                          className="px-2.5 py-1.5 text-[10px] uppercase font-bold tracking-wider rounded-lg border border-slate-800 bg-slate-900 text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer"
                        >
                          <option value="PENDING">Duyệt: PENDING</option>
                          <option value="CONFIRMED">Duyệt: CONFIRMED</option>
                          <option value="COMPLETED">Duyệt: COMPLETED</option>
                          <option value="CANCELLED">Duyệt: CANCELLED</option>
                        </select>
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
  );
}
