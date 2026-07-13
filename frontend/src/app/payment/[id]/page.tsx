"use client";

import React, { useEffect, useState, use, Suspense } from "react";
import { useRouter } from "next/navigation";
import {
    Landmark,
    Copy,
    Check,
    Upload,
    Clock,
    AlertCircle,
    CheckCircle2,
    Calendar,
    Stethoscope,
    ChevronRight,
    Package,
} from "lucide-react";
import { appointmentService } from "@/services/appointment.service";
import { Appointment } from "@/types/appointment";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Button from "@/components/common/Button";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import toast from "react-hot-toast";

interface BankDetails {
    bankName: string;
    bankAccount: string;
    bankOwner: string;
}

function PaymentContent({ id }: { id: string }) {
    const router = useRouter();
    const [appointment, setAppointment] = useState<Appointment | null>(null);
    const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
    const [payosLink, setPayosLink] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(300); // 5 mins in seconds
    const [isExpired, setIsExpired] = useState(false);
    const [successPaid, setSuccessPaid] = useState(false);

    // 1. Load appointment details on mount
    useEffect(() => {
        async function fetchDetails() {
            try {
                const res = await appointmentService.getAppointmentById(id);
                setAppointment(res.appointment);
                if (res.bankDetails) {
                    setBankDetails(res.bankDetails);
                }
                
                // Also create PayOS link to get the exact virtual account info
                if (res.appointment.status === "PENDING_PAYMENT") {
                    try {
                        const payosData = await appointmentService.createPayOSPaymentUrl(id);
                        setPayosLink(payosData);
                    } catch (payosErr) {
                        console.error("Failed to create PayOS link", payosErr);
                    }
                }

                // Calculate initial countdown time
                const createdTime = new Date(res.appointment.createdAt).getTime();
                const now = Date.now();
                const elapsedSeconds = Math.floor((now - createdTime) / 1000);
                const remaining = 300 - elapsedSeconds;

                if (res.appointment.status !== "PENDING_PAYMENT") {
                    if (res.appointment.status === "PENDING" || res.appointment.status === "CONFIRMED") {
                        setSuccessPaid(true);
                    } else if (res.appointment.status === "EXPIRED") {
                        setIsExpired(true);
                    }
                }

                if (remaining <= 0) {
                    setIsExpired(true);
                    setTimeLeft(0);
                } else {
                    setTimeLeft(remaining);
                }
            } catch (err: any) {
                toast.error(err.message || "Không thể tải thông tin lịch hẹn.");
            } finally {
                setLoading(false);
            }
        }
        fetchDetails();
    }, [id]);

    // 2. Countdown timer loop
    useEffect(() => {
        if (loading || isExpired || successPaid || timeLeft <= 0) return;

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    setIsExpired(true);
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [loading, isExpired, successPaid, timeLeft]);

    // 3. Polling appointment status for automated webhook
    useEffect(() => {
        if (loading || isExpired || successPaid) return;

        const pollInterval = setInterval(async () => {
            try {
                const res = await appointmentService.getAppointmentById(id);
                if (res.appointment.status === "CONFIRMED" || res.appointment.status === "PENDING") {
                    setSuccessPaid(true);
                    clearInterval(pollInterval);
                }
            } catch (err) {
                console.error("Polling error:", err);
            }
        }, 3000);

        return () => clearInterval(pollInterval);
    }, [loading, isExpired, successPaid, id]);

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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
        }
    };

    const handleUploadProof = async () => {
        if (!file) {
            toast.error("Vui lòng chọn hoặc kéo thả ảnh biên lai chuyển khoản.");
            return;
        }

        try {
            setUploading(true);
            await appointmentService.uploadPaymentProof(id, file);
            setSuccessPaid(true);
            toast.success("Tải biên lai lên thành công! Vui lòng chờ Admin phê duyệt.");
        } catch (err: any) {
            toast.error(err.message || "Có lỗi xảy ra khi tải ảnh lên.");
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <LoadingSpinner className="h-12 w-12 text-teal-600" />
                <p className="mt-4 text-sm text-slate-500 font-medium animate-pulse">Đang tải thông tin thanh toán...</p>
            </div>
        );
    }

    if (isExpired) {
        return (
            <div className="max-w-md mx-auto bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden p-8 text-center space-y-6">
                <div className="flex justify-center">
                    <div className="bg-red-50 p-4 rounded-full border border-red-100 text-red-500">
                        <AlertCircle className="h-16 w-16" />
                    </div>
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-slate-900">Giao Dịch Đã Quá Hạn</h1>
                    <p className="text-sm text-slate-500 max-w-sm mx-auto">
                        Đã quá hạn thời gian 30 phút để thanh toán cho lịch hẹn này. Khung giờ khám đã được giải phóng cho người khác đặt. Vui lòng tạo lại lịch hẹn mới.
                    </p>
                </div>
                <Button variant="teal" onClick={() => router.push("/doctors")} className="w-full rounded-xl py-3 font-semibold">
                    Quay Lại Đặt Lịch
                </Button>
            </div>
        );
    }

    if (successPaid) {
        return (
            <div className="max-w-md mx-auto bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden p-8 text-center space-y-6">
                <div className="flex justify-center">
                    <div className="bg-emerald-50 p-4 rounded-full border border-emerald-100 text-emerald-500">
                        <CheckCircle2 className="h-16 w-16 animate-bounce" />
                    </div>
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-slate-900">Đã Nhận Biên Lai!</h1>
                    <p className="text-sm text-slate-500 max-w-sm mx-auto">
                        Hệ thống đã nhận ảnh chụp biên lai chuyển khoản của bạn.
                        Lịch hẹn đang được chờ duyệt thanh toán.
                    </p>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs text-slate-600 text-left space-y-2">
                    <p>• Trạng thái lịch: <strong className="text-amber-600">Chờ duyệt (PENDING)</strong></p>
                    <p>• Mã lịch hẹn: <strong>MEDBOOKING-{appointment?.transactionCode}</strong></p>
                    <p>• Giá dịch vụ: <strong>{(appointment?.amount || 2000).toLocaleString("vi-VN")} VND</strong></p>
                </div>
                <Button variant="teal" onClick={() => router.push("/my-appointments")} className="w-full rounded-xl py-3 font-semibold">
                    Xem Lịch Hẹn Của Tôi
                </Button>
            </div>
        );
    }

    // Use PayOS data if available
    const displayBankName = payosLink ? payosLink.bin : bankDetails?.bankName;
    const displayBankAccount = payosLink ? payosLink.accountNumber : bankDetails?.bankAccount;
    const displayBankOwner = payosLink ? payosLink.accountName : bankDetails?.bankOwner;
    const transferContent = payosLink ? payosLink.description : `MEDBOOKING-${appointment?.transactionCode}`;
    const amountVal = payosLink ? payosLink.amount : (appointment?.amount || 2000);

    const qrUrl = displayBankName
        ? `https://img.vietqr.io/image/${displayBankName}-${displayBankAccount}-compact2.png?amount=${amountVal}&addInfo=${encodeURIComponent(
              transferContent
          )}&accountName=${encodeURIComponent(displayBankOwner || "")}`
        : "";

    return (
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: QR and Bank Details */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden flex flex-col p-6 sm:p-8 space-y-6">
                {/* Header with timer */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2 text-teal-600">
                        <Landmark className="h-5 w-5" />
                        <span className="font-bold text-base text-slate-800">Thanh Toán Chuyển Khoản</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-full px-3 py-1.5 text-xs font-bold shrink-0">
                        <Clock className="h-4 w-4 animate-spin" />
                        <span>Hết hạn sau: {formatTime(timeLeft)}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    {/* QR Code */}
                    <div className="md:col-span-5 flex flex-col items-center justify-center p-3 bg-slate-50 border border-slate-100 rounded-2xl relative group">
                        {qrUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={qrUrl} alt="VietQR Code" className="w-44 h-44 object-contain" />
                        ) : (
                            <div className="w-44 h-44 flex items-center justify-center">
                                <LoadingSpinner className="h-8 w-8 text-teal-600" />
                            </div>
                        )}
                        <p className="text-[10px] text-slate-500 font-semibold mt-2 select-none">Quét QR chuyển nhanh 24/7</p>
                    </div>

                    {/* Bank Transfer Details */}
                    <div className="md:col-span-7 space-y-3.5 text-xs text-slate-700">
                        {displayBankName && (
                            <>
                                {/* Bank Name */}
                                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                                    <div>
                                        <p className="text-slate-500 text-[10px] uppercase font-bold">Ngân hàng</p>
                                        <p className="font-bold text-slate-900 text-sm mt-0.5">{displayBankName}</p>
                                    </div>
                                    <button
                                        onClick={() => handleCopy(displayBankName, "bankName")}
                                        className="text-slate-400 hover:text-teal-600 p-1.5 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-100 shadow-sm"
                                    >
                                        {copiedField === "bankName" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                    </button>
                                </div>

                                {/* Account number */}
                                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                                    <div>
                                        <p className="text-slate-500 text-[10px] uppercase font-bold">Số tài khoản</p>
                                        <p className="font-bold text-slate-900 text-sm mt-0.5 tracking-wider">{displayBankAccount}</p>
                                    </div>
                                    <button
                                        onClick={() => handleCopy(displayBankAccount, "bankAccount")}
                                        className="text-slate-400 hover:text-teal-600 p-1.5 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-100 shadow-sm"
                                    >
                                        {copiedField === "bankAccount" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                    </button>
                                </div>

                                {/* Owner name */}
                                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                                    <div>
                                        <p className="text-slate-500 text-[10px] uppercase font-bold">Chủ tài khoản</p>
                                        <p className="font-bold text-slate-900 text-sm mt-0.5 uppercase">{displayBankOwner}</p>
                                    </div>
                                    <button
                                        onClick={() => handleCopy(displayBankOwner, "bankOwner")}
                                        className="text-slate-400 hover:text-teal-600 p-1.5 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-100 shadow-sm"
                                    >
                                        {copiedField === "bankOwner" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="p-3 bg-teal-50/20 border border-teal-100/50 rounded-xl flex items-center justify-between">
                                    <div>
                                        <p className="text-teal-700 text-[10px] uppercase font-bold">Nội dung chuyển khoản</p>
                                        <p className="font-bold text-teal-850 text-sm mt-0.5 tracking-wider">{transferContent}</p>
                                    </div>
                                    <button
                                        onClick={() => handleCopy(transferContent, "transferContent")}
                                        className="text-teal-600 hover:text-teal-800 p-1.5 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-teal-100 shadow-sm"
                                    >
                                        {copiedField === "transferContent" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Column: Appointment Info and Receipt Uploader */}
            <div className="lg:col-span-5 space-y-6">
                {/* Appointment Info Summary */}
                {appointment && (
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-6 space-y-4">
                        <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3">Tóm tắt dịch vụ</h3>
                        
                        <div className="flex items-start gap-3 text-xs">
                            <div className="h-9 w-9 bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center rounded-xl shrink-0">
                                {appointment.medicalPackage ? <Package className="h-4 w-4" /> : <Stethoscope className="h-4 w-4" />}
                            </div>
                            <div>
                                <p className="font-bold text-slate-900">{appointment.medicalPackage?.name || appointment.doctor?.name || "Hệ thống"}</p>
                                <p className="text-slate-500 text-[10px] mt-0.5">{appointment.medicalPackage ? "Gói khám" : appointment.doctor?.specialty?.name}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 text-xs">
                            <div className="h-9 w-9 bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center rounded-xl shrink-0">
                                <Calendar className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-900">
                                    {new Date(appointment.appointmentDate).toLocaleTimeString("vi-VN", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        hour12: false,
                                    })}
                                </p>
                                <p className="text-slate-500 text-[10px] mt-0.5">
                                    {new Date(appointment.appointmentDate).toLocaleDateString("vi-VN", {
                                        weekday: "long",
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                    })}
                                </p>
                            </div>
                        </div>

                        <div className="border-t border-slate-150/50 pt-3.5 flex items-center justify-between text-xs">
                            <span className="text-slate-500 font-medium">Tổng phí khám:</span>
                            <span className="font-extrabold text-teal-600 text-base">
                                {amountVal.toLocaleString("vi-VN")} VND
                            </span>
                        </div>
                    </div>
                )}

                {/* Auto Confirm Section */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-6 space-y-5 flex flex-col items-center text-center">
                    <div className="h-14 w-14 bg-teal-50 border border-teal-100 text-teal-600 rounded-full flex items-center justify-center">
                        <LoadingSpinner className="h-6 w-6" />
                    </div>
                    <div className="space-y-1.5">
                        <h3 className="font-bold text-slate-800 text-sm">Hệ thống đang chờ nhận tiền...</h3>
                        <p className="text-xs text-slate-500 leading-relaxed max-w-[240px] mx-auto">
                            Khi bạn chuyển khoản thành công với đúng nội dung <strong className="text-teal-600">{transferContent}</strong>, hệ thống sẽ tự động xác nhận lịch khám trong vài giây. Bạn không cần làm gì thêm.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function PrePaymentPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const id = resolvedParams.id;

    return (
        <ProtectedRoute>
            <div className="min-h-[85vh] bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
                {/* Steps Header */}
                <div className="max-w-4xl mx-auto flex items-center gap-2.5 text-xs font-bold text-slate-500 mb-8 border-b border-slate-200/50 pb-4">
                    <span className="text-teal-600">1. Điền thông tin</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                    <span className="text-teal-600 font-extrabold bg-teal-50 px-2 py-1 rounded">2. Chuyển khoản thanh toán</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                    <span>3. Chờ xác nhận</span>
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
