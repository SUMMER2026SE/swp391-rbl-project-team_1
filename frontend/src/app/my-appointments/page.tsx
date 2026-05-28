"use client";

import React, { useEffect, useState } from "react";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { appointmentService } from "@/services/appointment.service";
import { Appointment, AppointmentStatus } from "@/types/appointment";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";
import { CalendarRange, Stethoscope, Clock, ShieldAlert, Award, FileText, ArrowRight, CalendarDays, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import Button from "@/components/common/Button";
import BookingProgress from "@/components/ui/BookingProgress";

function MyAppointmentsContent() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Tab State
  const [activeTab, setActiveTab] = useState<AppointmentStatus | "ALL">("ALL");

  useEffect(() => {
    async function fetchAppointments() {
      try {
        setLoading(true);
        setError(null);
        const data = await appointmentService.getMyAppointments();
        
        // Sort appointments by date desc
        const sorted = data.appointments.sort(
          (a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
        );
        setAppointments(sorted);
      } catch (err: unknown) {
        const errorMsg =
          err && typeof err === "object" && "message" in err
            ? String((err as { message: unknown }).message)
            : "Không thể tải danh sách cuộc hẹn của bạn.";
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    }

    fetchAppointments();
  }, []);

  // Filter based on selected Tab
  useEffect(() => {
    if (activeTab === "ALL") {
      setFilteredAppointments(appointments);
    } else {
      filteredAppointments;
      setFilteredAppointments(appointments.filter((app) => app.status === activeTab));
    }
  }, [activeTab, appointments]);

  // Map status names in Vietnamese
  const getStatusLabel = (status: AppointmentStatus) => {
    const labels = {
      PENDING: "Chờ xác nhận",
      CONFIRMED: "Đã xác nhận",
      COMPLETED: "Đã hoàn thành",
      CANCELLED: "Đã hủy",
    };
    return labels[status] || status;
  };

  // Map status color classes
  const getStatusStyles = (status: AppointmentStatus) => {
    const styles = {
      PENDING: "bg-amber-50 text-amber-800 border-amber-100",
      CONFIRMED: "bg-blue-50 text-blue-800 border-blue-100",
      COMPLETED: "bg-emerald-50 text-emerald-800 border-emerald-100",
      CANCELLED: "bg-red-50 text-red-800 border-red-100",
    };
    return styles[status] || "bg-slate-50 text-slate-700 border-slate-100";
  };

  const tabs: { label: string; value: AppointmentStatus | "ALL" }[] = [
    { label: "Tất cả", value: "ALL" },
    { label: "Chờ xác nhận", value: "PENDING" },
    { label: "Đã xác nhận", value: "CONFIRMED" },
    { label: "Đã khám xong", value: "COMPLETED" },
    { label: "Đã hủy", value: "CANCELLED" },
  ];

  return (
    <div className="space-y-6">
      {/* Filters/Tabs Bar */}
      <div className="border-b border-slate-200">
        <div className="flex gap-2 overflow-x-auto pb-px scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
                activeTab === tab.value
                  ? "border-teal-600 text-teal-600"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col py-24 items-center justify-center bg-white rounded-3xl border border-slate-100 shadow-sm">
          <LoadingSpinner className="h-10 w-10 text-teal-600" />
          <p className="mt-4 text-sm text-slate-500 font-medium">Đang tải lịch hẹn của bạn...</p>
        </div>
      ) : error ? (
        <Alert type="error" message={error} />
      ) : filteredAppointments.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
          <CalendarRange className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-base font-bold text-slate-800">Không có lịch hẹn nào</p>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Không tìm thấy thông tin lịch khám trong danh mục &ldquo;{tabs.find((t) => t.value === activeTab)?.label}&rdquo;.
          </p>
          {activeTab === "ALL" && (
            <Link href="/doctors" className="inline-block mt-5">
              <Button variant="teal" className="rounded-xl text-xs font-semibold inline-flex items-center gap-1">
                Đặt lịch hẹn ngay <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredAppointments.map((app) => {
            const appointmentDate = new Date(app.appointmentDate);
            const dateStr = appointmentDate.toLocaleDateString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            });
            const timeStr = appointmentDate.toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            });

            return (
              <div
                key={app.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md hover:border-teal-50 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
              >
                {/* Doctor details */}
                <div className="space-y-4 flex-grow">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center shrink-0">
                      <Stethoscope className="h-6 w-6" />
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-900 text-base">{app.doctor?.name || "Bác sĩ Chuyên gia"}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-teal-700 bg-teal-50 rounded-lg px-2 py-0.5 w-max font-semibold">
                        <span>{app.doctor?.specialty?.name || "Đang cập nhật"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Scheduled timings & hospitals */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-6 pt-2 border-t border-slate-50 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-slate-400 shrink-0" />
                      <span>Ngày khám: <strong>{dateStr}</strong></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                      <span>Giờ hẹn: <strong>{timeStr}</strong></span>
                    </div>

                    {app.doctor?.hospital && (
                      <div className="flex items-center gap-2 sm:col-span-2 md:col-span-1">
                        <Award className="h-4 w-4 text-slate-400 shrink-0" />
                        <span className="truncate">Địa điểm: <strong>{app.doctor.hospital}</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Symptom notes if exists */}
                  {app.notes && (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-xs text-slate-600 flex items-start gap-2">
                      <FileText className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-slate-700 mb-0.5">Triệu chứng & Ghi chú:</p>
                        <p className="italic leading-relaxed">{app.notes}</p>
                      </div>
                    </div>
                  )}
                  {/* Cancellation Reason */}
                  {app.status === "CANCELLED" && app.cancellationReason && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-3.5 text-xs text-red-600 flex items-start gap-2 mt-2">
                      <ShieldAlert className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-red-700 mb-0.5">Lý do huỷ:</p>
                        <p className="italic leading-relaxed">{app.cancellationReason}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right col: status badge & actions */}
                <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end justify-between sm:w-full md:w-auto shrink-0 border-t md:border-t-0 border-slate-100/60 pt-4 md:pt-0 gap-3">
                  <span
                    className={`text-xs font-bold px-3 py-1.5 rounded-full border tracking-wide uppercase ${getStatusStyles(
                      app.status
                    )}`}
                  >
                    {getStatusLabel(app.status)}
                  </span>
                  
                  {app.status === "PENDING" && (
                    <div className="text-[10px] text-amber-600 flex items-center gap-1 bg-amber-50 rounded-lg px-2 py-1">
                      <ShieldAlert className="h-3 w-3 shrink-0" />
                      <span>Hệ thống đang xử lý</span>
                    </div>
                  )}
                  {app.status === "CONFIRMED" && (
                    <div className="text-[10px] text-blue-600 flex items-center gap-1 bg-blue-50 rounded-lg px-2 py-1">
                      <CheckCircle2 className="h-3 w-3 shrink-0" />
                      <span>Vui lòng đến đúng hẹn</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function MyAppointmentsPage() {
  return (
    <ProtectedRoute>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow">
        {/* Header section */}
        <div className="space-y-2 mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Lịch Hẹn Của Tôi</h1>
          <p className="text-sm text-slate-500">
            Xem và quản lý tất cả các cuộc hẹn đặt khám sức khỏe của bạn trên hệ thống MedBooking.
          </p>
        </div>

        <BookingProgress />

        <MyAppointmentsContent />
      </div>
    </ProtectedRoute>
  );
}
