"use client";

import React, { useEffect, useState } from "react";
import api from "@/services/api";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import Link from "next/link";
import { Video, Calendar, Clock, User, ArrowRight, ShieldAlert } from "lucide-react";

interface UserInfo {
    id: string;
    fullName: string;
    email: string;
    gender: string;
    dateOfBirth: string;
    avatar: string;
}

interface Appointment {
    id: string;
    appointmentDate: string;
    status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
    notes: string | null;
    user: UserInfo;
}

export default function DoctorVideoCallOverviewPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                const res = await api.get("/doctor/appointments");
                // Filter only confirmed appointments
                const confirmed = res.data.filter((app: Appointment) => app.status === "CONFIRMED");
                // Sort by date (closest first)
                confirmed.sort((a: Appointment, b: Appointment) => 
                    new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime()
                );
                setAppointments(confirmed);
            } catch (err) {
                setError("Không thể tải danh sách ca khám trực tuyến.");
            } finally {
                setLoading(false);
            }
        };

        fetchAppointments();
    }, []);

    if (loading) return <div className="flex justify-center p-12"><LoadingSpinner className="w-8 h-8 text-teal-600" /></div>;
    if (error) return <Alert type="error" message={error} />;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Khám bệnh trực tuyến</h2>
                <p className="text-slate-500">Xem và tham gia các phòng khám trực tuyến đang diễn ra hôm nay.</p>
            </div>

            {appointments.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm max-w-2xl mx-auto">
                    <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mx-auto mb-4">
                        <Video className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">Không có ca khám nào sắp diễn ra</h3>
                    <p className="text-sm text-slate-500 mb-6">Bạn chưa có lịch hẹn khám trực tuyến nào ở trạng thái &quot;Đã xác nhận&quot;.</p>
                    <Link href="/doctor/appointments">
                        <Button variant="teal" className="rounded-xl text-xs font-semibold">
                            Xem quản lý lịch hẹn
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {appointments.map((app) => {
                        const appDate = new Date(app.appointmentDate);
                        const dateStr = appDate.toLocaleDateString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric"
                        });
                        const timeStr = appDate.toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit"
                        });

                        return (
                            <div 
                                key={app.id} 
                                className="bg-white rounded-3xl p-6 border border-slate-105 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-6"
                            >
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden shrink-0">
                                            {app.user.avatar ? (
                                                <img src={app.user.avatar} alt={app.user.fullName} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold">
                                                    {app.user.fullName?.charAt(0) || "U"}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-base">{app.user.fullName}</h4>
                                            <p className="text-xs text-slate-500">{app.user.gender} • Sinh năm {new Date(app.user.dateOfBirth).getFullYear() || "N/A"}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-2xl text-xs text-slate-650">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-teal-600" />
                                            <span>Ngày: <strong>{dateStr}</strong></span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-teal-600" />
                                            <span>Giờ hẹn: <strong>{timeStr}</strong></span>
                                        </div>
                                    </div>

                                    {app.notes && (
                                        <div className="text-xs text-slate-600 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                                            <span className="font-semibold block text-slate-700 mb-0.5">Triệu chứng/Ghi chú đặt khám:</span>
                                            <p className="italic line-clamp-2">{app.notes}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                                    <Link href={`/video-call?appointmentId=${app.id}`} className="flex-grow">
                                        <Button variant="teal" className="w-full rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-teal-500/10 py-2.5">
                                            <Video className="w-4 h-4" /> Vào phòng khám
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
