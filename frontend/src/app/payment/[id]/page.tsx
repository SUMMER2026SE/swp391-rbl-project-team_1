"use client";

import React, { useEffect, useState, use, useRef, Suspense, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Landmark,
    Copy,
    Check,
    Clock,
    AlertCircle,
    CheckCircle2,
    Calendar,
    Stethoscope,
    ChevronRight,
    Package,
    ExternalLink,
    RotateCcw,
    ZoomIn,
    X,
} from "lucide-react";
import { io, Socket } from "socket.io-client";
import { appointmentService } from "@/services/appointment.service";
import { Appointment } from "@/types/appointment";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Button from "@/components/common/Button";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";

interface PayOSPaymentInfo {
    checkoutUrl: string;
    qrCode: string;
    accountNumber: string;
    accountName: string;
    bin: string;
    amount: number;
    description: string;
    orderCode: number;
    expiredAt: string;
}

function PaymentContent({ id }: { id: string }) {
    const router = useRouter();
    const { user } = useAuth();

    const [appointment, setAppointment] = useState<Appointment | null>(null);
    const [payosInfo, setPayosInfo] = useState<PayOSPaymentInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(300);
    const [isExpired, setIsExpired] = useState(false);
    const [successPaid, setSuccessPaid] = useState(false);
    const [payOSError, setPayOSError] = useState(false);
    const [qrModalOpen, setQrModalOpen] = useState(false);

    const socketRef = useRef<Socket | null>(null);
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const resolvedRef = useRef(false);

    const markSuccess = useCallback(() => {
        if (resolvedRef.current) return;
        resolvedRef.current = true;
        setSuccessPaid(true);
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        socketRef.current?.disconnect();
    }, []);

    const markExpired = useCallback(() => {
        if (resolvedRef.current) return;
        resolvedRef.current = true;
        setIsExpired(true);
        setTimeLeft(0);
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        socketRef.current?.disconnect();
    }, []);

    // 1. Load appointment + create PayOS link
    useEffect(() => {
        async function fetchDetails() {
            try {
                const res = await appointmentService.getAppointmentById(id);
                const appt = res.appointment;
                setAppointment(appt);

                // If already paid or confirmed
                if (appt.status === "CONFIRMED" || appt.status === "PENDING") {
                    markSuccess();
                    return;
                }
                if (appt.status === "CANCELLED" || appt.status === "EXPIRED") {
                    markExpired();
                    return;
                }

                // Create PayOS payment link if still PENDING_PAYMENT
                if (appt.status === "PENDING_PAYMENT") {
                    try {
                        const payosData = await appointmentService.createPayOSPaymentUrl(id);
                        setPayosInfo(payosData);

                        // Calculate countdown from server expiredAt
                        const expiredAtMs = new Date(payosData.expiredAt).getTime();
                        const remaining = Math.max(0, Math.floor((expiredAtMs - Date.now()) / 1000));
                        if (remaining <= 0) {
                            markExpired();
                        } else {
                            setTimeLeft(remaining);
                        }
                    } catch (payosErr: any) {
                        console.error("Failed to create PayOS link:", payosErr);
                        setPayOSError(true);
                        // Fall back to appointment-based countdown
                        const createdMs = new Date(appt.createdAt).getTime();
                        const remaining = Math.max(0, 300 - Math.floor((Date.now() - createdMs) / 1000));
                        if (remaining <= 0) markExpired();
                        else setTimeLeft(remaining);
                    }
                }
            } catch (err: any) {
                toast.error(err.message || "Không thể tải thông tin lịch hẹn.");
            } finally {
                setLoading(false);
            }
        }
        fetchDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // 2. Countdown timer
    useEffect(() => {
        if (loading || resolvedRef.current || timeLeft <= 0) return;

        timerIntervalRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    markExpired();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading, timeLeft]);

    // 3. Polling every 3s
    useEffect(() => {
        if (loading || resolvedRef.current || !payosInfo) return;

        pollIntervalRef.current = setInterval(async () => {
            if (resolvedRef.current) {
                clearInterval(pollIntervalRef.current!);
                return;
            }
            try {
                const statusRes = await appointmentService.getPaymentStatus(payosInfo.orderCode);
                if (statusRes.status === "PAID") {
                    markSuccess();
                } else if (statusRes.status === "EXPIRED" || statusRes.status === "FAILED") {
                    markExpired();
                }
            } catch (e) {
                console.error("Polling error:", e);
            }
        }, 3000);

        return () => {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading, payosInfo]);

    // 4. Socket.io listeners
    useEffect(() => {
        if (loading || resolvedRef.current || !user) return;

        const backendUrl = process.env.NEXT_PUBLIC_API_URL
            ? process.env.NEXT_PUBLIC_API_URL.replace("/api", "")
            : "http://localhost:5000";

        const socket = io(backendUrl, {
            withCredentials: true,
            transports: ["websocket", "polling"],
        });
        socketRef.current = socket;

        socket.on("connect", () => {
            socket.emit("join", `user_${user.id}`);
        });

        socket.on("payment_confirmed", (data: { appointmentId: string }) => {
            if (data.appointmentId === id) {
                toast.success("🎉 Thanh toán thành công!");
                markSuccess();
            }
        });

        socket.on("payment_expired", (data: { appointmentId: string }) => {
            if (data.appointmentId === id) {
                toast.error("⏰ Link thanh toán đã hết hạn.");
                markExpired();
            }
        });

        return () => {
            socket.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading, user]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const handleCopy = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        toast.success("Đã sao chép vào bộ nhớ tạm");
        setTimeout(() => setCopiedField(null), 2000);
    };

    const urgencyColor = timeLeft <= 60
        ? "bg-red-50 text-red-700 border-red-200"
        : timeLeft <= 120
            ? "bg-orange-50 text-orange-700 border-orange-200"
            : "bg-amber-50 text-amber-700 border-amber-100";

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <LoadingSpinner className="h-12 w-12 text-teal-600" />
                <p className="mt-4 text-sm text-slate-500 font-medium animate-pulse">Đang tải thông tin thanh toán...</p>
            </div>
        );
    }

    // ─── Expired Screen ───────────────────────────────────────────────────────
    if (isExpired) {
        return (
            <div className="max-w-md mx-auto bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden p-10 text-center space-y-6">
                <div className="flex justify-center">
                    <div className="bg-red-50 p-5 rounded-full border border-red-100 text-red-500 animate-in zoom-in duration-300">
                        <AlertCircle className="h-16 w-16" />
                    </div>
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-slate-900">Giao Dịch Đã Hết Hạn</h1>
                    <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                        Đã quá 5 phút kể từ khi tạo link thanh toán. Khung giờ khám đã được giải phóng cho người khác đặt.
                    </p>
                </div>
                {appointment?.transactionCode && (
                    <p className="text-xs text-slate-400 font-mono">
                        Mã lịch hẹn: <strong>{appointment.transactionCode}</strong>
                    </p>
                )}
                <Button
                    variant="teal"
                    onClick={() => router.push("/doctors")}
                    className="w-full rounded-xl py-3 font-semibold flex items-center justify-center gap-2"
                >
                    <RotateCcw className="h-4 w-4" />
                    Đặt Lịch Lại
                </Button>
                <button
                    onClick={() => router.push("/my-appointments")}
                    className="text-xs text-slate-400 hover:text-slate-600 underline"
                >
                    Xem danh sách lịch hẹn
                </button>
            </div>
        );
    }

    // ─── Success Screen ───────────────────────────────────────────────────────
    if (successPaid) {
        return (
            <div className="max-w-md mx-auto bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden p-10 text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-center">
                    <div className="bg-emerald-50 p-5 rounded-full border border-emerald-100 text-emerald-500">
                        <CheckCircle2 className="h-16 w-16" />
                    </div>
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-slate-900">Thanh Toán Thành Công! 🎉</h1>
                    <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                        Lịch hẹn của bạn đã được xác nhận. Bác sĩ sẽ gặp bạn đúng giờ!
                    </p>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 text-xs text-slate-700 text-left space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-slate-500">Trạng thái</span>
                        <span className="font-bold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Đã xác nhận
                        </span>
                    </div>
                    {appointment?.transactionCode && (
                        <div className="flex items-center justify-between">
                            <span className="text-slate-500">Mã đặt lịch</span>
                            <span className="font-bold font-mono">{appointment.transactionCode}</span>
                        </div>
                    )}
                    {appointment?.appointmentDate && (
                        <div className="flex items-center justify-between">
                            <span className="text-slate-500">Ngày khám</span>
                            <span className="font-bold">
                                {new Date(appointment.appointmentDate).toLocaleString("vi-VN", {
                                    weekday: "short", day: "2-digit", month: "2-digit",
                                    hour: "2-digit", minute: "2-digit"
                                })}
                            </span>
                        </div>
                    )}
                    {(payosInfo?.amount || appointment?.amount) && (
                        <div className="flex items-center justify-between border-t border-slate-200 pt-2">
                            <span className="text-slate-500">Số tiền</span>
                            <span className="font-extrabold text-teal-600">
                                {(payosInfo?.amount || appointment?.amount || 0).toLocaleString("vi-VN")} VND
                            </span>
                        </div>
                    )}
                </div>
                <Button
                    variant="teal"
                    onClick={() => router.push("/my-appointments")}
                    className="w-full rounded-xl py-3 font-semibold"
                >
                    Xem Lịch Hẹn Của Tôi
                </Button>
            </div>
        );
    }

    // ─── QR Transfer + Bank Details (Main Payment Screen) ────────────────────
    const qrUrl = payosInfo
        ? `https://img.vietqr.io/image/${payosInfo.bin}-${payosInfo.accountNumber}-compact2.png?amount=${payosInfo.amount}&addInfo=${encodeURIComponent(payosInfo.description)}&accountName=${encodeURIComponent(payosInfo.accountName)}`
        : "";

    const bankFields = payosInfo
        ? [
            { label: "Ngân hàng", value: payosInfo.bin, field: "bin" },
            { label: "Số tài khoản", value: payosInfo.accountNumber, field: "accountNumber" },
            { label: "Chủ tài khoản", value: payosInfo.accountName, field: "accountName" },
        ]
        : [];

    return (
        <>
        {/* QR Modal Fullscreen */}
        {qrModalOpen && qrUrl && (
            <div
                className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={() => setQrModalOpen(false)}
            >
                <div
                    className="relative bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full flex flex-col items-center gap-4"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={() => setQrModalOpen(false)}
                        className="absolute top-3 right-3 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Quét để thanh toán</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={qrUrl}
                        alt="VietQR Code"
                        className="w-full max-w-[320px] aspect-square object-contain bg-white rounded-2xl border border-slate-100"
                    />
                    {payosInfo && (
                        <div className="w-full bg-teal-50 border border-teal-100 rounded-2xl px-4 py-3 text-center">
                            <p className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">Nội dung chuyển khoản</p>
                            <p className="font-extrabold text-teal-900 text-sm tracking-wider mt-1">{payosInfo.description}</p>
                        </div>
                    )}
                    <p className="text-[10px] text-slate-400 font-semibold">Nhấn ra ngoài để đóng</p>
                </div>
            </div>
        )}

        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: QR + Bank Details */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden flex flex-col p-6 sm:p-8 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2 text-teal-600">
                        <Landmark className="h-5 w-5" />
                        <span className="font-bold text-base text-slate-800">Thanh Toán Qua PayOS</span>
                    </div>
                    <div className={`flex items-center gap-1.5 border rounded-full px-3 py-1.5 text-xs font-bold shrink-0 transition-colors ${urgencyColor}`}>
                        <Clock className="h-4 w-4 animate-pulse" />
                        <span>Hết hạn sau: {formatTime(timeLeft)}</span>
                    </div>
                </div>

                {payOSError && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>Không thể tạo link PayOS. Vui lòng thử lại hoặc liên hệ hỗ trợ.</span>
                    </div>
                )}

                {/* QR Code — Large & Prominent */}
                <div className="flex flex-col items-center gap-3">
                    {qrUrl ? (
                        <>
                            <div
                                className="relative group cursor-pointer"
                                onClick={() => setQrModalOpen(true)}
                                title="Nhấn để phóng to"
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={qrUrl}
                                    alt="VietQR Code"
                                    className="w-full max-w-[280px] sm:max-w-[320px] aspect-square object-contain bg-white rounded-2xl shadow-md border border-slate-200 p-2 transition-transform group-hover:scale-[1.02]"
                                />
                                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/0 group-hover:bg-black/10 transition-all">
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 flex items-center gap-2 shadow-lg">
                                        <ZoomIn className="h-4 w-4 text-teal-600" />
                                        <span className="text-xs font-bold text-slate-700">Nhấn để phóng to</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <p className="text-xs text-slate-500 font-semibold select-none">Quét QR chuyển nhanh 24/7</p>
                                {payosInfo?.checkoutUrl && (
                                    <a
                                        href={payosInfo.checkoutUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-[11px] font-bold text-teal-600 hover:text-teal-700 underline"
                                    >
                                        Mở trang thanh toán <ExternalLink className="h-3 w-3" />
                                    </a>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="w-64 h-64 flex items-center justify-center bg-slate-50 rounded-2xl border border-slate-100">
                            <LoadingSpinner className="h-8 w-8 text-teal-600" />
                        </div>
                    )}
                </div>

                {/* Bank Transfer Details */}
                <div className="space-y-3 text-xs text-slate-700">
                    {bankFields.map(({ label, value, field }) => (
                        <div key={field} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between gap-2">
                            <div>
                                <p className="text-slate-500 text-[10px] uppercase font-bold">{label}</p>
                                <p className="font-bold text-slate-900 text-sm mt-0.5">{value}</p>
                            </div>
                            <button
                                onClick={() => handleCopy(value, field)}
                                className="text-slate-400 hover:text-teal-600 p-1.5 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-100 shadow-sm shrink-0"
                                title="Sao chép"
                            >
                                {copiedField === field ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                            </button>
                        </div>
                    ))}

                    {payosInfo && (
                        <div className="p-3 bg-teal-50 border border-teal-100 rounded-xl flex items-center justify-between gap-2">
                            <div>
                                <p className="text-teal-700 text-[10px] uppercase font-bold">Nội dung chuyển khoản</p>
                                <p className="font-bold text-teal-900 text-sm mt-0.5 tracking-wider">{payosInfo.description}</p>
                            </div>
                            <button
                                onClick={() => handleCopy(payosInfo.description, "description")}
                                className="text-teal-600 hover:text-teal-800 p-1.5 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-teal-100 shadow-sm shrink-0"
                                title="Sao chép"
                            >
                                {copiedField === "description" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Column: Summary + Auto-confirm */}
            <div className="lg:col-span-5 space-y-5">
                {/* Appointment Summary */}
                {appointment && (
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-6 space-y-4">
                        <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3">Tóm tắt dịch vụ</h3>

                        <div className="flex items-start gap-3 text-xs">
                            <div className="h-9 w-9 bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center rounded-xl shrink-0">
                                {appointment.medicalPackage ? <Package className="h-4 w-4" /> : <Stethoscope className="h-4 w-4" />}
                            </div>
                            <div>
                                <p className="font-bold text-slate-900">
                                    {appointment.medicalPackage?.name || appointment.doctor?.name || "Hệ thống"}
                                </p>
                                <p className="text-slate-500 text-[10px] mt-0.5">
                                    {appointment.medicalPackage ? "Gói khám" : appointment.doctor?.specialty?.name}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 text-xs">
                            <div className="h-9 w-9 bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center rounded-xl shrink-0">
                                <Calendar className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-900">
                                    {new Date(appointment.appointmentDate).toLocaleTimeString("vi-VN", {
                                        hour: "2-digit", minute: "2-digit", hour12: false,
                                    })}
                                </p>
                                <p className="text-slate-500 text-[10px] mt-0.5">
                                    {new Date(appointment.appointmentDate).toLocaleDateString("vi-VN", {
                                        weekday: "long", day: "2-digit", month: "2-digit", year: "numeric",
                                    })}
                                </p>
                            </div>
                        </div>

                        <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
                            <span className="text-slate-500 font-medium">Tổng phí:</span>
                            <span className="font-extrabold text-teal-600 text-base">
                                {(payosInfo?.amount || appointment.amount || 0).toLocaleString("vi-VN")} VND
                            </span>
                        </div>
                    </div>
                )}

                {/* Auto-confirm Indicator */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-6 space-y-4 flex flex-col items-center text-center">
                    <div className="h-14 w-14 bg-teal-50 border border-teal-100 text-teal-600 rounded-full flex items-center justify-center">
                        <LoadingSpinner className="h-6 w-6" />
                    </div>
                    <div className="space-y-1.5">
                        <h3 className="font-bold text-slate-800 text-sm">Hệ thống đang chờ nhận tiền...</h3>
                        <p className="text-xs text-slate-500 leading-relaxed max-w-[240px] mx-auto">
                            Chuyển khoản đúng nội dung{" "}
                            <strong className="text-teal-600">{payosInfo?.description}</strong>. Lịch khám sẽ tự động xác nhận trong vài giây sau khi nhận được tiền.
                        </p>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
}

export default function PrePaymentPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const id = resolvedParams.id;

    return (
        <ProtectedRoute>
            <div className="min-h-[85vh] bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
                {/* Steps Breadcrumb */}
                <div className="max-w-4xl mx-auto flex items-center gap-2.5 text-xs font-bold text-slate-500 mb-8 border-b border-slate-200/50 pb-4">
                    <span className="text-teal-600">1. Điền thông tin</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                    <span className="text-teal-600 font-extrabold bg-teal-50 px-2 py-1 rounded">2. Quét QR thanh toán</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                    <span>3. Xác nhận tự động</span>
                </div>

                <Suspense
                    fallback={
                        <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-100 shadow-xl p-10 text-center flex flex-col items-center justify-center">
                            <LoadingSpinner className="h-10 w-10 text-teal-600 animate-spin" />
                            <p className="mt-4 text-sm text-slate-500 font-medium">Đang tải trang thanh toán...</p>
                        </div>
                    }
                >
                    <PaymentContent id={id} />
                </Suspense>
            </div>
        </ProtectedRoute>
    );
}
