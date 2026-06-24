"use client";

import React, { useEffect, useState } from "react";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { appointmentService } from "@/services/appointment.service";
import { Appointment, AppointmentStatus } from "@/types/appointment";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";
import { CalendarRange, Stethoscope, Clock, ShieldAlert, Award, FileText, ArrowRight, CalendarDays, CheckCircle2, Video, Package } from "lucide-react";
import Link from "next/link";
import Button from "@/components/common/Button";
import BookingProgress from "@/components/ui/BookingProgress";
import PrescriptionModal from "@/components/ui/PrescriptionModal";
import SubmitReviewModal from "@/components/ui/SubmitReviewModal";
import CancelAppointmentModal from "@/components/appointments/CancelAppointmentModal";
import ErrorModal from "@/components/common/ErrorModal";
import { Star } from "lucide-react";
import toast from "react-hot-toast";

function MyAppointmentsContent() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPrescriptionApptId, setSelectedPrescriptionApptId] = useState<string | null>(null);
  const [reviewTargetAppt, setReviewTargetAppt] = useState<{ id: string; doctorName: string; specialtyName: string } | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [showCancelError, setShowCancelError] = useState(false);
  
  // Tab State
  const [activeTab, setActiveTab] = useState<AppointmentStatus | "ALL">("ALL");

  const fetchAppointments = async () => {
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
  };

  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);

  const handleCancelAppointment = async (reason: string) => {
    if (!cancelTargetId) return;
    try {
      setCancelingId(cancelTargetId);
      await appointmentService.cancelAppointment(cancelTargetId, reason);
      toast.success("Huỷ lịch hẹn thành công!");
      fetchAppointments();
      setCancelTargetId(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || "Đã xảy ra lỗi khi huỷ lịch hẹn");
    } finally {
      setCancelingId(null);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Filter based on selected Tab
  useEffect(() => {
    if (activeTab === "ALL") {
      setFilteredAppointments(appointments);
    } else if (activeTab === "CANCELLED") {
      setFilteredAppointments(appointments.filter((app) => app.status === "CANCELLED" || app.status === "EXPIRED"));
    } else {
      setFilteredAppointments(appointments.filter((app) => app.status === activeTab));
    }
  }, [activeTab, appointments]);

  // Map status names in Vietnamese
  const getStatusLabel = (status: AppointmentStatus) => {
    const labels = {
      PENDING_PAYMENT: "Chờ thanh toán",
      PENDING: "Chờ duyệt",
      CONFIRMED: "Đã xác nhận",
      COMPLETED: "Đã khám xong",
      CANCELLED: "Đã hủy",
      EXPIRED: "Quá hạn",
    };
    return labels[status] || status;
  };

  // Map status color classes
  const getStatusStyles = (status: AppointmentStatus) => {
    const styles = {
      PENDING_PAYMENT: "bg-amber-50 text-amber-800 border-amber-100",
      PENDING: "bg-indigo-50 text-indigo-800 border-indigo-100",
      CONFIRMED: "bg-blue-50 text-blue-850 border-blue-150",
      COMPLETED: "bg-emerald-50 text-emerald-800 border-emerald-100",
      CANCELLED: "bg-red-50 text-red-800 border-red-100",
      EXPIRED: "bg-slate-100 text-slate-600 border-slate-200",
    };
    return styles[status] || "bg-slate-50 text-slate-700 border-slate-100";
  };

  const tabs: { label: string; value: AppointmentStatus | "ALL" }[] = [
    { label: "Tất cả", value: "ALL" },
    { label: "Chờ thanh toán", value: "PENDING_PAYMENT" },
    { label: "Chờ duyệt", value: "PENDING" },
    { label: "Đã xác nhận", value: "CONFIRMED" },
    { label: "Đã khám xong", value: "COMPLETED" },
    { label: "Đã hủy/Quá hạn", value: "CANCELLED" },
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

            const diffMs = appointmentDate.getTime() - new Date().getTime();
            const diffHours = diffMs / (1000 * 60 * 60);
            const canCancel = diffHours > 0;

            return (
              <div
                key={app.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md hover:border-teal-50 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
              >
                {/* Doctor details */}
                <div className="space-y-4 flex-grow">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center shrink-0">
                      {app.medicalPackage ? <Package className="h-6 w-6" /> : <Stethoscope className="h-6 w-6" />}
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-900 text-base">{app.medicalPackage?.name || app.doctor?.name || "Bác sĩ Chuyên gia"}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-teal-700 bg-teal-50 rounded-lg px-2 py-0.5 w-max font-semibold">
                        <span>{app.medicalPackage ? "Gói khám" : (app.doctor?.specialty?.name || "Đang cập nhật")}</span>
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

                    {(app.doctor?.hospital || app.medicalPackage?.hospital) && (
                      <div className="flex items-center gap-2 sm:col-span-2 md:col-span-1">
                        <Award className="h-4 w-4 text-slate-400 shrink-0" />
                        <span className="truncate">Địa điểm: <strong>{app.doctor?.hospital || app.medicalPackage?.hospital}</strong></span>
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

                  {/* Payment details row */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-slate-500">
                      Chi phí khám: <strong className="text-slate-800">{(app.amount || app.medicalPackage?.price || app.doctor?.price || 2000).toLocaleString("vi-VN")} VND</strong>
                    </span>
                    <div className="flex items-center gap-1.5 font-medium">
                      <span className="text-slate-500">Thanh toán:</span>
                      {app.status === "CONFIRMED" || app.status === "COMPLETED" ? (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 font-semibold text-[10px]">
                          Đã thanh toán
                        </span>
                      ) : app.status === "PENDING" ? (
                        <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 font-semibold text-[10px]">
                          Chờ duyệt
                        </span>
                      ) : app.status === "PENDING_PAYMENT" ? (
                        <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 font-semibold text-[10px]">
                          Chờ thanh toán
                        </span>
                      ) : app.status === "EXPIRED" ? (
                        <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-semibold text-[10px]">
                          Quá hạn
                        </span>
                      ) : (
                        <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-100 font-semibold text-[10px]">
                          Đã hủy
                        </span>
                      )}
                    </div>
                  </div>
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
                  
                  {app.status === "PENDING_PAYMENT" && (
                    <div className="flex flex-col gap-1.5 w-full">
                      <Link href={`/payment/${app.id}`} className="w-full">
                        <Button
                          variant="teal"
                          className="rounded-xl text-[10px] font-bold px-3 py-1.5 flex items-center justify-center gap-1 w-full text-white bg-teal-600 hover:bg-teal-700"
                        >
                          Thanh toán ngay
                        </Button>
                      </Link>
                      {canCancel && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (diffHours < 24) {
                              setShowCancelError(true);
                            } else {
                              setCancelTargetId(app.id);
                            }
                          }}
                          disabled={cancelingId === app.id}
                          className="rounded-xl text-[10px] font-bold px-3 py-1.5 w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                        >
                          {cancelingId === app.id ? "Đang huỷ..." : "Huỷ lịch hẹn"}
                        </Button>
                      )}
                      <p className="text-[9px] text-slate-500 text-center italic leading-tight">Chuyển khoản VietQR trong 30 phút</p>
                    </div>
                  )}

                  {app.status === "PENDING" && (
                    <div className="flex flex-col gap-1.5 w-full">
                      <div className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg px-2.5 py-2 font-medium justify-center w-full text-center leading-normal">
                        Đã nhận biên lai thanh toán. Vui lòng chờ xác nhận.
                      </div>
                      {canCancel && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (diffHours < 24) {
                              setShowCancelError(true);
                            } else {
                              setCancelTargetId(app.id);
                            }
                          }}
                          disabled={cancelingId === app.id}
                          className="rounded-xl text-[10px] font-bold px-3 py-1.5 w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                        >
                          {cancelingId === app.id ? "Đang huỷ..." : "Huỷ lịch hẹn"}
                        </Button>
                      )}
                    </div>
                  )}
                  {app.status === "CONFIRMED" && (
                    <div className="flex flex-col gap-2 items-stretch w-full sm:w-auto md:items-end">
                      <Link href={`/video-call?appointmentId=${app.id}`}>
                        <Button variant="teal" className="rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 w-full px-4 py-2 shadow-md shadow-teal-500/10 hover:scale-[1.02] transition-all">
                          <Video className="h-4 w-4" /> Vào phòng khám
                        </Button>
                      </Link>
                      {canCancel && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (diffHours < 24) {
                              setShowCancelError(true);
                            } else {
                              setCancelTargetId(app.id);
                            }
                          }}
                          disabled={cancelingId === app.id}
                          className="rounded-xl text-[10px] font-bold px-3 py-1.5 w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                        >
                          {cancelingId === app.id ? "Đang huỷ..." : "Huỷ lịch hẹn"}
                        </Button>
                      )}
                      <div className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1.5 justify-center text-center font-medium leading-normal w-full">
                        Lịch hẹn của bạn đã được xác nhận.
                      </div>
                    </div>
                  )}
                  {app.status === "CANCELLED" && (
                    <div className="text-[10px] text-red-700 bg-red-50 border border-red-100 rounded-lg px-2.5 py-1.5 justify-center text-center font-medium leading-normal w-full">
                      Thanh toán không hợp lệ. Lịch hẹn đã bị hủy.
                    </div>
                  )}
                  {app.status === "EXPIRED" && (
                    <div className="text-[10px] text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 justify-center text-center font-medium leading-normal w-full italic">
                      Lịch hẹn đã quá hạn thanh toán.
                    </div>
                  )}
                  {app.status === "COMPLETED" && (
                    <div className="flex flex-col gap-2 items-stretch w-full sm:w-auto md:items-end">
                      <Button 
                        variant="teal" 
                        onClick={() => setSelectedPrescriptionApptId(app.id)}
                        className="rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 w-full px-4 py-2 shadow-md shadow-teal-500/10 hover:scale-[1.02] transition-all"
                      >
                        <FileText className="h-4 w-4" /> Xem Đơn Thuốc
                      </Button>

                      {app.review ? (
                        <div className="flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-xl px-3.5 py-1.5 text-xs font-bold justify-center">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-450 shrink-0" />
                          <span>Đã đánh giá: {app.review.rating}/5★</span>
                        </div>
                      ) : (
                        <Button 
                          variant="outline"
                          onClick={() => setReviewTargetAppt({
                            id: app.id,
                            doctorName: app.medicalPackage?.name || app.doctor?.name || "Bác sĩ Chuyên gia",
                            specialtyName: app.medicalPackage ? "Gói khám" : (app.doctor?.specialty?.name || "Đang cập nhật")
                          })}
                          className="rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 w-full px-4 py-2 hover:scale-[1.02] transition-all border-teal-500 text-teal-650 hover:bg-teal-50/20"
                        >
                          Đánh Giá Bác Sĩ
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedPrescriptionApptId && (
        <PrescriptionModal 
          appointmentId={selectedPrescriptionApptId} 
          onClose={() => setSelectedPrescriptionApptId(null)} 
        />
      )}

      {reviewTargetAppt && (
        <SubmitReviewModal
          appointmentId={reviewTargetAppt.id}
          doctorName={reviewTargetAppt.doctorName}
          specialtyName={reviewTargetAppt.specialtyName}
          onClose={() => setReviewTargetAppt(null)}
          onSuccess={fetchAppointments}
        />
      )}

      {cancelTargetId && (
        <CancelAppointmentModal
          onClose={() => setCancelTargetId(null)}
          onConfirm={handleCancelAppointment}
          loading={cancelingId === cancelTargetId}
        />
      )}

      <ErrorModal
        isOpen={showCancelError}
        onClose={() => setShowCancelError(false)}
        title="Không thể huỷ lịch hẹn"
        message="Theo quy định của phòng khám, bạn chỉ được phép huỷ lịch hẹn trước 24 tiếng so với giờ khám. Vui lòng liên hệ trực tiếp phòng khám nếu cần hỗ trợ khẩn cấp."
      />
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
