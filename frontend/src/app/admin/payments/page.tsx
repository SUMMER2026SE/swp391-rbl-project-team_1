"use client";

import React, { useEffect, useState } from "react";
import { appointmentService } from "@/services/appointment.service";
import { Appointment } from "@/types/appointment";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import { Calendar, User, Stethoscope, Landmark, ExternalLink, ShieldCheck, ShieldAlert, Star } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminPendingPaymentsPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal state for viewing receipt full-size
    const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);

    // Rejection state
    const [rejectingApptId, setRejectingApptId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchPendingPayments = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await appointmentService.getPendingPaymentsForAdmin();
            setAppointments(res.data);
        } catch (err: any) {
            setError(err.message || "Không thể tải danh sách thanh toán chờ duyệt.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingPayments();
    }, []);

    const handleApprove = async (appointmentId: string) => {
        if (!window.confirm("Bạn có chắc chắn muốn DUYỆT giao dịch thanh toán này?")) return;

        try {
            setProcessingId(appointmentId);
            await appointmentService.adminApprovePayment(appointmentId);
            toast.success("Đã phê duyệt thanh toán. Lịch hẹn đã được xác nhận.");
            fetchPendingPayments();
        } catch (err: any) {
            toast.error(err.message || "Phê duyệt thất bại.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleRejectSubmit = async () => {
        if (!rejectingApptId) return;
        if (!rejectReason.trim()) {
            toast.error("Vui lòng nhập lý do từ chối.");
            return;
        }

        try {
            setProcessingId(rejectingApptId);
            await appointmentService.adminRejectPayment(rejectingApptId, rejectReason.trim());
            toast.success("Đã từ chối thanh toán. Lịch hẹn đã bị hủy.");
            setRejectingApptId(null);
            setRejectReason("");
            fetchPendingPayments();
        } catch (err: any) {
            toast.error(err.message || "Từ chối thanh toán thất bại.");
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="space-y-6 text-slate-100">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-800 pb-5">
                <div>
                    <h1 className="text-2xl font-bold text-slate-200 tracking-tight">Duyệt Thanh Toán Chuyển Khoản</h1>
                    <p className="text-xs text-slate-400 mt-1">
                        Đối chiếu biên lai chuyển khoản ngân hàng của bệnh nhân và phê duyệt lịch hẹn khám.
                    </p>
                </div>
                <div className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 w-max">
                    <Landmark className="h-4 w-4 text-teal-400" />
                    <span>Hàng chờ: <strong>{appointments.length} giao dịch</strong></span>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-950 border border-slate-850 rounded-2xl">
                    <LoadingSpinner className="h-10 w-10 text-teal-500 animate-spin" />
                    <p className="mt-4 text-xs text-slate-400">Đang tải danh sách chờ duyệt...</p>
                </div>
            ) : error ? (
                <Alert type="error" message={error} />
            ) : appointments.length === 0 ? (
                <div className="text-center py-20 bg-slate-950 border border-slate-850 rounded-2xl p-8">
                    <ShieldCheck className="h-12 w-12 text-slate-700 mx-auto mb-4" />
                    <p className="text-sm font-bold text-slate-300">Không có thanh toán nào cần duyệt</p>
                    <p className="text-xs text-slate-500 mt-1">Hệ thống hiện không có biên lai giao dịch nào đang chờ xác nhận.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {appointments.map((app) => {
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
                        const uploadTime = app.paymentAt ? new Date(app.paymentAt).toLocaleString("vi-VN") : "N/A";

                        return (
                            <div
                                key={app.id}
                                className="bg-slate-950 border border-slate-850 rounded-2xl p-5 hover:border-slate-800 transition-all flex flex-col lg:flex-row gap-6 justify-between items-stretch"
                            >
                                {/* Info Section */}
                                <div className="space-y-4 flex-grow min-w-0">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20">
                                            Mã GD: {app.transactionCode || "N/A"}
                                        </span>
                                        <span className="text-[10px] text-slate-400">Tải lên lúc: <strong>{uploadTime}</strong></span>
                                    </div>

                                    {/* Patient & Doctor Detail grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Patient */}
                                        <div className="space-y-1 bg-slate-900/60 p-3 rounded-xl border border-slate-850">
                                            <p className="text-[9px] uppercase font-bold text-slate-400 flex items-center gap-1">
                                                <User className="h-3 w-3 text-teal-400" /> Bệnh nhân
                                            </p>
                                            <p className="font-bold text-slate-200 text-xs truncate">{app.user?.fullName || "Chưa cập nhật"}</p>
                                            <p className="text-[10px] text-slate-400 truncate">{app.user?.email}</p>
                                        </div>

                                        {/* Doctor */}
                                        <div className="space-y-1 bg-slate-900/60 p-3 rounded-xl border border-slate-850">
                                            <p className="text-[9px] uppercase font-bold text-slate-400 flex items-center gap-1">
                                                <Stethoscope className="h-3 w-3 text-teal-400" /> Bác sĩ & Lịch
                                            </p>
                                            <p className="font-bold text-slate-200 text-xs truncate">{app.doctor?.name}</p>
                                            <p className="text-[10px] text-slate-450 truncate">
                                                {timeStr} ngày {dateStr}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Symptoms notes */}
                                    {app.notes && (
                                        <div className="text-[11px] bg-slate-900 p-2.5 rounded-lg border border-slate-850 text-slate-400 italic">
                                            &ldquo;{app.notes}&rdquo;
                                        </div>
                                    )}

                                    {/* Price billing */}
                                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-900">
                                        <span className="text-slate-400">Số tiền cần đối soát:</span>
                                        <span className="font-extrabold text-teal-400 text-sm">
                                            {(app.amount || 2000).toLocaleString("vi-VN")} VND
                                        </span>
                                    </div>
                                </div>

                                {/* Receipt image preview */}
                                <div className="shrink-0 flex flex-col items-center justify-center bg-slate-900 border border-slate-850 rounded-2xl p-3 w-full lg:w-44 text-center">
                                    {app.paymentProof ? (
                                        <div className="space-y-2 w-full flex flex-col items-center">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={app.paymentProof}
                                                alt="Receipt preview"
                                                onClick={() => setSelectedReceipt(app.paymentProof || null)}
                                                className="h-24 w-32 object-cover rounded-lg border border-slate-800 cursor-zoom-in hover:scale-105 transition-transform"
                                            />
                                            <button
                                                onClick={() => setSelectedReceipt(app.paymentProof || null)}
                                                className="text-[10px] text-teal-400 hover:text-teal-300 font-bold flex items-center gap-0.5 underline cursor-pointer"
                                            >
                                                Xem cỡ lớn <ExternalLink className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-xs text-slate-500 py-6">Không có ảnh biên lai</div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="shrink-0 flex lg:flex-col justify-center gap-2.5 w-full lg:w-36 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-slate-850 lg:pl-5">
                                    <Button
                                        variant="teal"
                                        onClick={() => handleApprove(app.id)}
                                        disabled={processingId !== null}
                                        className="flex-grow lg:flex-none rounded-xl text-xs font-bold py-2.5 flex items-center justify-center gap-1 text-slate-950 bg-teal-400 hover:bg-teal-350 disabled:opacity-50"
                                    >
                                        <ShieldCheck className="h-4 w-4" /> Duyệt
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setRejectingApptId(app.id)}
                                        disabled={processingId !== null}
                                        className="flex-grow lg:flex-none rounded-xl text-xs font-bold py-2.5 flex items-center justify-center gap-1 border-red-500 text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                                    >
                                        <ShieldAlert className="h-4 w-4" /> Từ chối
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal for viewing receipt image full size */}
            {selectedReceipt && (
                <div
                    onClick={() => setSelectedReceipt(null)}
                    className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-zoom-out"
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={selectedReceipt} alt="Full Receipt" className="max-h-[90vh] max-w-[95vw] object-contain rounded-2xl shadow-2xl border border-slate-850" />
                </div>
            )}

            {/* Modal for typing rejection reason */}
            {rejectingApptId && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl">
                        <div className="flex items-center gap-2 text-red-400 border-b border-slate-800 pb-3">
                            <ShieldAlert className="h-5 w-5" />
                            <h3 className="font-bold text-slate-200">Từ Chối Thanh Toán</h3>
                        </div>
                        <p className="text-xs text-slate-400">
                            Vui lòng nhập lý do từ chối thanh toán. Lý do này sẽ được ghi nhận vào lịch và gửi qua email cho bệnh nhân.
                        </p>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Ví dụ: Biên lai không khớp mã giao dịch hoặc chưa nhận được tiền vào tài khoản."
                            className="w-full h-24 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-red-500/50 transition-colors resize-none"
                        />
                        <div className="flex gap-3 pt-2">
                            <Button
                                variant="teal"
                                onClick={handleRejectSubmit}
                                disabled={processingId !== null || !rejectReason.trim()}
                                className="flex-grow rounded-xl py-2.5 text-xs font-bold text-slate-950 bg-red-400 hover:bg-red-350"
                            >
                                Xác Nhận Từ Chối
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setRejectingApptId(null);
                                    setRejectReason("");
                                }}
                                className="flex-grow rounded-xl py-2.5 text-xs font-bold border-slate-700 text-slate-300"
                            >
                                Hủy Bỏ
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
