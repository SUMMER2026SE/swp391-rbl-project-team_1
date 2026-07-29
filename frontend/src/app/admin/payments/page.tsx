"use client";

import React, { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { appointmentService } from "@/services/appointment.service";
import { Appointment } from "@/types/appointment";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import {
    Calendar, User, Stethoscope, Landmark, ExternalLink,
    ShieldCheck, ShieldAlert, CheckCircle2, XCircle, Clock,
    Ban, RefreshCw, CreditCard,
} from "lucide-react";
import toast from "react-hot-toast";

type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "EXPIRED";

interface PaymentRecord extends Appointment {
    payment?: {
        id: string;
        status: PaymentStatus;
        method: "VNPAY" | "MOCK" | "PAYOS";
        amount: number;
        transactionId?: string | null;
        paymentGateway?: string | null;
        payDate?: string | null;
        orderCode?: string | null;
        expiredAt?: string | null;
        createdAt: string;
    } | null;
}

const STATUS_CONFIG: Record<PaymentStatus | string, {
    label: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
    icon: React.ReactNode;
}> = {
    PAID: {
        label: "Đã thanh toán",
        bgClass: "bg-emerald-500/10",
        textClass: "text-emerald-400",
        borderClass: "border-emerald-500/20",
        icon: <CheckCircle2 className="h-3 w-3" />,
    },
    PENDING: {
        label: "Chờ xác nhận",
        bgClass: "bg-amber-500/10",
        textClass: "text-amber-400",
        borderClass: "border-amber-500/20",
        icon: <Clock className="h-3 w-3" />,
    },
    EXPIRED: {
        label: "Hết hạn",
        bgClass: "bg-red-500/10",
        textClass: "text-red-400",
        borderClass: "border-red-500/20",
        icon: <Ban className="h-3 w-3" />,
    },
    FAILED: {
        label: "Thất bại",
        bgClass: "bg-slate-500/10",
        textClass: "text-slate-400",
        borderClass: "border-slate-500/20",
        icon: <XCircle className="h-3 w-3" />,
    },
    REFUNDED: {
        label: "Đã hoàn tiền",
        bgClass: "bg-blue-500/10",
        textClass: "text-blue-400",
        borderClass: "border-blue-500/20",
        icon: <RefreshCw className="h-3 w-3" />,
    },
};

export default function AdminAllPaymentsPage() {
    const [appointments, setAppointments] = useState<PaymentRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>("ALL");

    // Modal state
    const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
    const [rejectingApptId, setRejectingApptId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [processingId, setProcessingId] = useState<string | null>(null);

    const socketRef = useRef<Socket | null>(null);

    const fetchPayments = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await appointmentService.getAllPaymentsForAdmin();
            setAppointments(res.data as PaymentRecord[]);
        } catch (err: any) {
            setError(err.message || "Không thể tải danh sách thanh toán.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, []);

    // Socket.io: Admin room — listen for payment_updated
    useEffect(() => {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL
            ? process.env.NEXT_PUBLIC_API_URL.replace("/api", "")
            : "http://localhost:5000";

        const socket = io(backendUrl, {
            withCredentials: true,
            transports: ["websocket", "polling"],
        });
        socketRef.current = socket;

        socket.on("connect", () => {
            socket.emit("join", "admin");
        });

        socket.on("payment_updated", (data: { appointmentId: string; status: string }) => {
            const statusConfig = STATUS_CONFIG[data.status];
            const label = statusConfig?.label || data.status;
            toast.success(`💳 Giao dịch cập nhật: ${label}`, { duration: 5000 });
            fetchPayments();
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const handleApprove = async (appointmentId: string) => {
        if (!window.confirm("Bạn có chắc chắn muốn DUYỆT giao dịch thanh toán này?")) return;
        try {
            setProcessingId(appointmentId);
            await appointmentService.adminApprovePayment(appointmentId);
            toast.success("Đã phê duyệt thanh toán. Lịch hẹn đã được xác nhận.");
            fetchPayments();
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
            fetchPayments();
        } catch (err: any) {
            toast.error(err.message || "Từ chối thanh toán thất bại.");
        } finally {
            setProcessingId(null);
        }
    };

    const filtered = filterStatus === "ALL"
        ? appointments
        : appointments.filter(a => a.payment?.status === filterStatus || (!a.payment && filterStatus === "NO_PAYMENT"));

    const counts = {
        ALL: appointments.length,
        PAID: appointments.filter(a => a.payment?.status === "PAID").length,
        PENDING: appointments.filter(a => a.payment?.status === "PENDING").length,
        EXPIRED: appointments.filter(a => a.payment?.status === "EXPIRED").length,
        FAILED: appointments.filter(a => a.payment?.status === "FAILED").length,
    };

    return (
        <div className="space-y-6 text-slate-100">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-800 pb-5">
                <div>
                    <h1 className="text-2xl font-bold text-slate-200 tracking-tight">Quản Lý Thanh Toán</h1>
                    <p className="text-xs text-slate-400 mt-1">
                        Toàn bộ giao dịch thanh toán trong hệ thống, cập nhật real-time.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchPayments}
                        className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-teal-400 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-teal-600 transition-colors"
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Làm mới
                    </button>
                    <div className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                        <Landmark className="h-4 w-4 text-teal-400" />
                        <span>Tổng: <strong>{counts.ALL} giao dịch</strong></span>
                    </div>
                </div>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex flex-wrap gap-2">
                {([
                    { key: "ALL", label: "Tất cả", count: counts.ALL },
                    { key: "PAID", label: "Đã thanh toán", count: counts.PAID },
                    { key: "PENDING", label: "Chờ xác nhận", count: counts.PENDING },
                    { key: "EXPIRED", label: "Hết hạn", count: counts.EXPIRED },
                    { key: "FAILED", label: "Thất bại", count: counts.FAILED },
                ] as const).map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setFilterStatus(tab.key)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${filterStatus === tab.key
                            ? "bg-teal-500/15 border-teal-500/30 text-teal-400"
                            : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                            }`}
                    >
                        {tab.label}
                        <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-black ${filterStatus === tab.key ? "bg-teal-500/20 text-teal-300" : "bg-slate-700 text-slate-400"}`}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-950 border border-slate-800 rounded-2xl">
                    <LoadingSpinner className="h-10 w-10 text-teal-500 animate-spin" />
                    <p className="mt-4 text-xs text-slate-400">Đang tải danh sách giao dịch...</p>
                </div>
            ) : error ? (
                <Alert type="error" message={error} />
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 bg-slate-950 border border-slate-800 rounded-2xl p-8">
                    <CreditCard className="h-12 w-12 text-slate-700 mx-auto mb-4" />
                    <p className="text-sm font-bold text-slate-300">Không có giao dịch nào</p>
                    <p className="text-xs text-slate-500 mt-1">Không tìm thấy giao dịch phù hợp với bộ lọc đã chọn.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filtered.map((app) => {
                        const appDate = new Date(app.appointmentDate);
                        const dateStr = appDate.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
                        const timeStr = appDate.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false });
                        const paymentStatus = app.payment?.status || "PENDING";
                        const statusCfg = STATUS_CONFIG[paymentStatus] || STATUS_CONFIG.PENDING;

                        const isPendingWithProof = app.status === "PENDING" && !!app.paymentProof;

                        return (
                            <div
                                key={app.id}
                                className="bg-slate-950 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all"
                            >
                                <div className="flex flex-col lg:flex-row gap-5 justify-between items-stretch">
                                    {/* Info Section */}
                                    <div className="space-y-3 flex-grow min-w-0">
                                        <div className="flex flex-wrap items-center gap-2.5">
                                            {/* Payment Status Badge */}
                                            <span className={`flex items-center gap-1 text-[10px] uppercase font-black px-2 py-0.5 rounded border ${statusCfg.bgClass} ${statusCfg.textClass} ${statusCfg.borderClass}`}>
                                                {statusCfg.icon}
                                                {statusCfg.label}
                                            </span>
                                            {/* Payment method badge */}
                                            {app.payment?.method && (
                                                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded border bg-slate-800 text-slate-400 border-slate-700">
                                                    {app.payment.method}
                                                </span>
                                            )}
                                            <span className="text-[10px] text-slate-500">
                                                Mã: <strong className="text-amber-400">{app.transactionCode || "N/A"}</strong>
                                            </span>
                                            {app.payment?.payDate && (
                                                <span className="text-[10px] text-slate-500">
                                                    Thanh toán lúc: <strong>{new Date(app.payment.payDate).toLocaleString("vi-VN")}</strong>
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div className="space-y-0.5 bg-slate-900 p-3 rounded-xl border border-slate-800">
                                                <p className="text-[9px] uppercase font-bold text-slate-400 flex items-center gap-1">
                                                    <User className="h-3 w-3 text-teal-400" /> Bệnh nhân
                                                </p>
                                                <p className="font-bold text-slate-200 text-xs truncate">{app.user?.fullName || "Chưa cập nhật"}</p>
                                                <p className="text-[10px] text-slate-400 truncate">{app.user?.email}</p>
                                            </div>
                                            <div className="space-y-0.5 bg-slate-900 p-3 rounded-xl border border-slate-800">
                                                <p className="text-[9px] uppercase font-bold text-slate-400 flex items-center gap-1">
                                                    <Stethoscope className="h-3 w-3 text-teal-400" /> Bác sĩ & Lịch
                                                </p>
                                                <p className="font-bold text-slate-200 text-xs truncate">{app.doctor?.name || "—"}</p>
                                                <p className="text-[10px] text-slate-400">{timeStr} ngày {dateStr}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-900">
                                            <span className="text-slate-400">Số tiền giao dịch:</span>
                                            <span className="font-extrabold text-teal-400 text-sm">
                                                {(app.payment?.amount || app.amount || 0).toLocaleString("vi-VN")} VND
                                            </span>
                                        </div>
                                    </div>

                                    {/* Receipt Image */}
                                    <div className="shrink-0 flex flex-col items-center justify-center bg-slate-900 border border-slate-800 rounded-2xl p-3 w-full lg:w-40 text-center">
                                        {app.paymentProof ? (
                                            <div className="space-y-2 w-full flex flex-col items-center">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={app.paymentProof}
                                                    alt="Biên lai"
                                                    onClick={() => setSelectedReceipt(app.paymentProof || null)}
                                                    className="h-24 w-32 object-cover rounded-lg border border-slate-700 cursor-zoom-in hover:scale-105 transition-transform"
                                                />
                                                <button
                                                    onClick={() => setSelectedReceipt(app.paymentProof || null)}
                                                    className="text-[10px] text-teal-400 hover:text-teal-300 font-bold flex items-center gap-0.5 underline cursor-pointer"
                                                >
                                                    Xem cỡ lớn <ExternalLink className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="text-xs text-slate-600 py-6 flex flex-col items-center gap-1">
                                                <Calendar className="h-6 w-6 text-slate-700" />
                                                <span>Không có biên lai</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons — only for PENDING with proof */}
                                    {isPendingWithProof && (
                                        <div className="shrink-0 flex lg:flex-col justify-center gap-2.5 w-full lg:w-36 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-slate-800 lg:pl-5">
                                            <Button
                                                variant="teal"
                                                onClick={() => handleApprove(app.id)}
                                                disabled={processingId !== null}
                                                className="flex-grow lg:flex-none rounded-xl text-xs font-bold py-2.5 flex items-center justify-center gap-1 disabled:opacity-50"
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
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Receipt modal */}
            {selectedReceipt && (
                <div
                    onClick={() => setSelectedReceipt(null)}
                    className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-zoom-out"
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={selectedReceipt} alt="Full Receipt" className="max-h-[90vh] max-w-[95vw] object-contain rounded-2xl shadow-2xl border border-slate-800" />
                </div>
            )}

            {/* Reject modal */}
            {rejectingApptId && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl">
                        <div className="flex items-center gap-2 text-red-400 border-b border-slate-800 pb-3">
                            <ShieldAlert className="h-5 w-5" />
                            <h3 className="font-bold text-slate-200">Từ Chối Thanh Toán</h3>
                        </div>
                        <p className="text-xs text-slate-400">
                            Vui lòng nhập lý do từ chối. Lý do này sẽ được ghi nhận và gửi email cho bệnh nhân.
                        </p>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Ví dụ: Biên lai không khớp mã giao dịch hoặc chưa nhận được tiền..."
                            className="w-full h-24 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-red-500/50 transition-colors resize-none"
                        />
                        <div className="flex gap-3 pt-2">
                            <Button
                                variant="teal"
                                onClick={handleRejectSubmit}
                                disabled={processingId !== null || !rejectReason.trim()}
                                className="flex-grow rounded-xl py-2.5 text-xs font-bold text-slate-950 bg-red-400 hover:bg-red-300"
                            >
                                Xác Nhận Từ Chối
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => { setRejectingApptId(null); setRejectReason(""); }}
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
