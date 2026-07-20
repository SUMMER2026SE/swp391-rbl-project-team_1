"use client";

import React, { useEffect, useState, useCallback } from "react";
import { appointmentService } from "@/services/appointment.service";
import { Appointment } from "@/types/appointment";
import { CalendarDays, Clock, MapPin, XCircle } from "lucide-react";
import Button from "@/components/common/Button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";

type Filter = "ALL" | "UPCOMING" | "PAST";

export default function AppointmentsTab() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await appointmentService.getMyAppointments();
      setAppointments(res.appointments || []);
      setError("");
    } catch (err: any) {
      setError(err.message || "Lỗi tải lịch hẹn");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const now = new Date().getTime();

  const filteredAppointments = appointments.filter(a => {
    const apptTime = new Date(a.appointmentDate).getTime();
    const isUpcoming = apptTime >= now && !["CANCELLED", "COMPLETED", "EXPIRED"].includes(a.status);
    if (filter === "UPCOMING") return isUpcoming;
    if (filter === "PAST") return !isUpcoming;
    return true;
  }).sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime());

  const handleCancelConfirm = async () => {
    if (!cancelConfirmId) return;
    setCancelingId(cancelConfirmId);
    try {
      await appointmentService.cancelAppointment(cancelConfirmId, cancelReason || "Người bệnh yêu cầu huỷ");
      await fetchAppointments();
      setCancelConfirmId(null);
      setCancelReason("");
    } catch (err: any) {
      alert("Lỗi khi hủy lịch: " + (err.message || "Không thể hủy lịch này."));
    } finally {
      setCancelingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING_PAYMENT": return <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">CHỜ THANH TOÁN</span>;
      case "PENDING": return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">CHỜ XÁC NHẬN</span>;
      case "CONFIRMED": return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">ĐÃ XÁC NHẬN</span>;
      case "COMPLETED": return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">ĐÃ KHÁM</span>;
      case "CANCELLED": return <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold">ĐÃ HỦY</span>;
      case "EXPIRED": return <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">HẾT HẠN</span>;
      default: return <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  if (loading) return <div className="flex justify-center p-12"><LoadingSpinner className="text-teal-600 w-8 h-8" /></div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 animate-in fade-in duration-500">
      {/* Cancel Confirm Modal */}
      {cancelConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Xác nhận hủy lịch hẹn</h3>
            <p className="text-sm text-slate-500 mb-4">Hủy trong vòng 24h sẽ không được hoàn tiền cọc. Vui lòng nhập lý do hủy.</p>
            <textarea
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 resize-none mb-4 min-h-[80px]"
              placeholder="Lý do hủy (không bắt buộc)..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => { setCancelConfirmId(null); setCancelReason(""); }}
              >
                Quay lại
              </Button>
              <Button
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white border-none"
                isLoading={cancelingId === cancelConfirmId}
                onClick={handleCancelConfirm}
              >
                Xác nhận hủy
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-teal-600" />
          Lịch Hẹn Của Tôi
          <span className="text-sm font-normal text-slate-500">({filteredAppointments.length})</span>
        </h3>
        
        <div className="flex gap-2">
          {(["ALL", "UPCOMING", "PAST"] as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === f ? "bg-teal-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {f === "ALL" ? "Tất cả" : f === "UPCOMING" ? "Sắp tới" : "Đã qua"}
            </button>
          ))}
        </div>
      </div>

      {error && <Alert type="error" message={error} className="mb-6" />}

      {filteredAppointments.length === 0 ? (
        <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-slate-100">
          <CalendarDays className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="font-medium">Không có lịch hẹn nào phù hợp.</p>
          <p className="text-sm mt-1">Hãy đặt lịch khám để theo dõi sức khỏe nhé.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map(appt => (
            <div key={appt.id} className="border border-slate-200 rounded-xl p-5 hover:border-teal-200 hover:shadow-sm transition-all flex flex-col md:flex-row gap-5">
              {/* Date Block */}
              <div className="w-20 shrink-0 flex flex-col items-center justify-center bg-teal-50 text-teal-700 rounded-xl p-2 border border-teal-100 text-center">
                <span className="text-xs uppercase font-bold">{new Date(appt.appointmentDate).toLocaleDateString('vi-VN', { weekday: 'short' })}</span>
                <span className="text-2xl font-black leading-none mt-1">{new Date(appt.appointmentDate).getDate()}</span>
                <span className="text-xs font-medium">Thg {new Date(appt.appointmentDate).getMonth() + 1}</span>
              </div>

              {/* Info */}
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h4 className="text-base font-bold text-slate-800">
                      Khám {appt.doctor?.specialty?.name || (appt.medicalPackage ? "Gói khám" : "Đa khoa")}
                    </h4>
                    <p className="text-teal-600 font-medium text-sm">
                      {appt.doctor ? `Bác sĩ ${appt.doctor.name}` : (appt.medicalPackage ? (appt.medicalPackage as any).name : "N/A")}
                    </p>
                  </div>
                  <div>{getStatusBadge(appt.status)}</div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {new Date(appt.appointmentDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    Phòng khám MedBooking
                  </span>

                </div>

                {appt.cancellationReason && (
                  <p className="text-xs text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100">
                    Lý do hủy: {appt.cancellationReason}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="shrink-0 flex flex-col justify-center gap-2 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-5">
                {["PENDING", "CONFIRMED"].includes(appt.status) && (
                  <button
                    onClick={() => setCancelConfirmId(appt.id)}
                    className="flex items-center justify-center gap-1.5 text-rose-600 border border-rose-200 hover:bg-rose-50 px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap"
                  >
                    <XCircle className="w-4 h-4" /> Hủy lịch
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
