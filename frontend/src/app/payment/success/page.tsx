"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Calendar, User, Stethoscope, Landmark, CreditCard, ArrowRight } from "lucide-react";
import { appointmentService } from "@/services/appointment.service";
import { Appointment } from "@/types/appointment";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Button from "@/components/common/Button";
import ProtectedRoute from "@/components/common/ProtectedRoute";

function PaymentResultContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [appointment, setAppointment] = useState<Appointment | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const status = searchParams.get("status"); // 'success' | 'failed' | 'error'
    const appointmentId = searchParams.get("appointmentId");
    const txnRef = searchParams.get("txnRef");
    const responseCode = searchParams.get("responseCode");
    const message = searchParams.get("message");

    useEffect(() => {
        if (!appointmentId) {
            setLoading(false);
            return;
        }

        async function loadAppointmentDetails() {
            try {
                const appt = await appointmentService.getAppointmentById(appointmentId as string);
                setAppointment(appt.appointment);
            } catch (err: any) {
                console.error("Failed to load appointment details:", err);
                setError("Không thể tải thông tin chi tiết lịch hẹn.");
            } finally {
                setLoading(false);
            }
        }

        loadAppointmentDetails();
    }, [appointmentId]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                <LoadingSpinner className="h-12 w-12 text-teal-600 animate-spin" />
                <p className="mt-4 text-sm text-slate-500 font-medium">Đang xử lý kết quả thanh toán...</p>
            </div>
        );
    }

    const isSuccess = status === "success";

    return (
        <div className="max-w-xl mx-auto bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden mt-6">
            {/* Top color bar depending on status */}
            <div className={`h-3 ${isSuccess ? "bg-emerald-500" : "bg-red-500"}`} />

            <div className="p-8 sm:p-10 text-center space-y-6">
                {/* Status Icon */}
                <div className="flex justify-center">
                    {isSuccess ? (
                        <div className="bg-emerald-50 p-4 rounded-full border border-emerald-100 text-emerald-500">
                            <CheckCircle2 className="h-16 w-16" />
                        </div>
                    ) : (
                        <div className="bg-red-50 p-4 rounded-full border border-red-100 text-red-500">
                            <XCircle className="h-16 w-16" />
                        </div>
                    )}
                </div>

                {/* Status Message */}
                <div className="space-y-2">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                        {isSuccess ? "Thanh Toán Thành Công!" : "Thanh Toán Thất Bại"}
                    </h1>
                    <p className="text-sm text-slate-500 max-w-sm mx-auto">
                        {isSuccess
                            ? "Cảm ơn bạn. Giao dịch đặt lịch khám bệnh của bạn đã được xác nhận thanh toán thành công."
                            : message || `Thanh toán không thành công. Mã lỗi: ${responseCode || "UNKNOWN"}`}
                    </p>
                </div>

                {/* Invoice Details Card */}
                {appointment && (
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 text-left text-xs text-slate-700 space-y-4 shadow-inner">
                        <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-2 mb-1 uppercase tracking-wider text-[10px]">
                            Chi tiết hóa đơn y tế
                        </h3>

                        {/* Doctor info */}
                        <div className="flex items-start gap-3">
                            <Stethoscope className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-slate-500">Bác sĩ khám</p>
                                <p className="font-bold text-slate-800 text-sm">{appointment.doctor?.name}</p>
                                <p className="text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded w-max font-semibold mt-1">
                                    {appointment.doctor?.specialty?.name}
                                </p>
                            </div>
                        </div>

                        {/* Appointment Time */}
                        <div className="flex items-start gap-3">
                            <Calendar className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-slate-500">Thời gian hẹn</p>
                                <p className="font-bold text-slate-800">
                                    {new Date(appointment.appointmentDate).toLocaleTimeString("vi-VN", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        hour12: false,
                                    })}{" "}
                                    ngày{" "}
                                    {new Date(appointment.appointmentDate).toLocaleDateString("vi-VN", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                    })}
                                </p>
                            </div>
                        </div>

                        {/* Clinic/Hospital location */}
                        {appointment.doctor?.hospital && (
                            <div className="flex items-start gap-3">
                                <Landmark className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-slate-500">Địa điểm khám</p>
                                    <p className="font-bold text-slate-800">{appointment.doctor.hospital}</p>
                                </div>
                            </div>
                        )}

                        {/* Transaction Billing */}
                        <div className="border-t border-slate-200 pt-3 grid grid-cols-2 gap-y-2">
                            <div>
                                <p className="text-slate-500">Số tiền thanh toán</p>
                                <p className="font-extrabold text-teal-600 text-sm">
                                    {(appointment.payment?.amount || appointment.doctor?.price || 2000).toLocaleString("vi-VN")}{" "}
                                    VND
                                </p>
                            </div>
                            <div>
                                <p className="text-slate-500">Mã giao dịch</p>
                                <p className="font-mono font-bold text-slate-800 truncate" title={txnRef || appointment.payment?.transactionId || ""}>
                                    {txnRef || appointment.payment?.transactionId || "N/A"}
                                </p>
                            </div>
                            <div>
                                <p className="text-slate-500">Cổng thanh toán</p>
                                <p className="font-bold text-slate-800">
                                    {appointment.payment?.method === "MOCK" ? "Thanh toán Giả lập" : "VNPay"}
                                </p>
                            </div>
                            <div>
                                <p className="text-slate-500">Trạng thái lịch</p>
                                <p className="font-bold text-emerald-600">Đã xác nhận</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Link href="/my-appointments" className="flex-grow">
                        <Button variant="teal" className="w-full rounded-xl py-3 font-semibold flex items-center justify-center gap-1.5 group">
                            Quản lý Lịch hẹn <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                    <Link href="/" className="flex-grow">
                        <Button variant="outline" className="w-full rounded-xl py-3 font-semibold border-slate-200 hover:bg-slate-50 text-slate-700">
                            Về Trang Chủ
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function PaymentSuccessPage() {
    return (
        <ProtectedRoute>
            <div className="min-h-[70vh] flex flex-col justify-center items-center px-4 py-10 bg-slate-50">
                <Suspense
                    fallback={
                        <div className="max-w-xl mx-auto bg-white rounded-3xl border border-slate-100 shadow-xl p-10 text-center flex flex-col items-center justify-center">
                            <LoadingSpinner className="h-10 w-10 text-teal-600 animate-spin" />
                            <p className="mt-4 text-sm text-slate-500 font-medium">Đang tải kết quả...</p>
                        </div>
                    }
                >
                    <PaymentResultContent />
                </Suspense>
            </div>
        </ProtectedRoute>
    );
}
