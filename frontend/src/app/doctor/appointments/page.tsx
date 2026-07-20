"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import api from "@/services/api";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  Calendar, Clock, CheckCircle2, XCircle, FileText, Video, 
  ChevronLeft, ChevronRight, Plus, Users, CalendarCheck, Clock8,
  User, Phone, Mail, Heart, AlertCircle, Activity, X, ChevronRight as ArrowRight
} from "lucide-react";
import Link from "next/link";
import PrescriptionModal from "@/components/ui/PrescriptionModal";
import { 
  format, startOfWeek, endOfWeek, addWeeks, subWeeks, 
  isSameWeek, isToday, isSameDay, differenceInMinutes,
  startOfMonth, endOfMonth, addMonths, subMonths, eachDayOfInterval, isSameMonth
} from "date-fns";
import { vi } from "date-fns/locale";

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
  status: "PENDING_PAYMENT" | "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "EXPIRED";
  notes: string | null;
  user: UserInfo;
  patientInfo?: {
    fullName?: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
    bloodType?: string;
    allergies?: string;
    chronicDiseases?: string;
  };
  medicalRecord?: {
    id: string;
    status: string;
  };
}

interface PatientDetail {
  user: {
    id: string;
    fullName: string;
    email: string;
    gender: string;
    dateOfBirth: string;
    avatar: string;
    bloodType: string | null;
    allergies: string | null;
    chronicDiseases: string | null;
    personalHistory: string | null;
    phone: string | null;
    cccd: string | null;
  };
  pastAppointments: Appointment[];
}

export default function DoctorAppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Navigation State
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [calendarMonth, setCalendarMonth] = useState<Date>(startOfMonth(new Date()));
  
  // Modals
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<string | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Patient Profile Drawer
  const [patientDrawerOpen, setPatientDrawerOpen] = useState(false);
  const [patientDetail, setPatientDetail] = useState<PatientDetail | null>(null);
  const [loadingPatient, setLoadingPatient] = useState(false);

  const socketRef = useRef<Socket | null>(null);

  const fetchAppointments = useCallback(async () => {
    try {
      const res = await api.get("/doctor/appointments");
      const filtered = res.data.filter((app: Appointment) => app.status === "CONFIRMED" || app.status === "COMPLETED");
      setAppointments(filtered);
    } catch (err) {
      setError("Không thể tải danh sách lịch hẹn.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Socket.io for Real-time
  useEffect(() => {
    if (!user?.doctorId) return;
    const backendUrl = process.env.NEXT_PUBLIC_API_URL
      ? process.env.NEXT_PUBLIC_API_URL.replace("/api", "")
      : "http://localhost:5000";
    const socket = io(backendUrl, { withCredentials: true, transports: ["websocket", "polling"] });
    socketRef.current = socket;
    socket.on("connect", () => { socket.emit("join", `doctor_${user.doctorId}`); });
    socket.on("new_appointment", (data: { appointmentId: string; message: string }) => {
      toast.success(`🔔 ${data.message || "Bạn có lịch hẹn mới đã thanh toán!"}`, { duration: 6000, icon: "📅" });
      fetchAppointments();
    });
    return () => { socket.disconnect(); };
  }, [user?.doctorId, fetchAppointments]);

  // --- Filtering & Grouping Logic ---
  const currentWeekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
  const isCurrentWeek = isSameWeek(currentWeekStart, new Date(), { weekStartsOn: 1 });

  const weekAppointments = useMemo(() => {
    return appointments.filter(app => {
      const appDate = new Date(app.appointmentDate);
      return appDate >= currentWeekStart && appDate <= currentWeekEnd;
    }).sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());
  }, [appointments, currentWeekStart, currentWeekEnd]);

  const kpis = useMemo(() => {
    const total = weekAppointments.length;
    const today = weekAppointments.filter(app => isToday(new Date(app.appointmentDate))).length;
    const completed = weekAppointments.filter(app => app.status === "COMPLETED").length;
    const now = new Date();
    const waiting = weekAppointments.filter(app => app.status === "CONFIRMED" && new Date(app.appointmentDate) >= now).length;
    return { total, today, completed, waiting };
  }, [weekAppointments]);

  const groupedAppointments = useMemo(() => {
    const groups: Record<string, Appointment[]> = {};
    weekAppointments.forEach(app => {
      const dateStr = format(new Date(app.appointmentDate), "yyyy-MM-dd");
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(app);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [weekAppointments]);

  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    return appointments
      .filter(app => app.status === "CONFIRMED" && new Date(app.appointmentDate) >= now)
      .sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());
  }, [appointments]);

  // --- Handlers ---
  const handlePrevWeek = () => setCurrentWeekStart(prev => subWeeks(prev, 1));
  const handleNextWeek = () => { if (!isCurrentWeek) setCurrentWeekStart(prev => addWeeks(prev, 1)); };
  const handleGoToToday = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const nextMonth = () => setCalendarMonth(addMonths(calendarMonth, 1));
  const prevMonth = () => setCalendarMonth(subMonths(calendarMonth, 1));

  const openCancelModal = (id: string) => { setCancelTargetId(id); setCancelReason(""); setIsCancelModalOpen(true); };

  const submitCancel = async () => {
    if (cancelTargetId && cancelReason.trim()) {
      setUpdatingId(cancelTargetId);
      try {
        await api.put(`/doctor/appointments/${cancelTargetId}/status`, { status: "CANCELLED", notes: cancelReason.trim() });
        toast.success("Đã hủy lịch hẹn");
        fetchAppointments();
        setIsCancelModalOpen(false);
        setCancelTargetId(null);
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Hủy lịch hẹn thất bại");
      } finally {
        setUpdatingId(null);
      }
    } else {
      toast.error("Vui lòng nhập lý do.");
    }
  };

  const openPatientDrawer = async (userId: string) => {
    setPatientDrawerOpen(true);
    setPatientDetail(null);
    setLoadingPatient(true);
    try {
      const res = await api.get(`/doctor/patients/${userId}`);
      setPatientDetail(res.data);
    } catch (err) {
      toast.error("Không thể tải hồ sơ bệnh nhân.");
      setPatientDrawerOpen(false);
    } finally {
      setLoadingPatient(false);
    }
  };

  // UI Helpers
  const formatDayHeader = (dateStr: string, count: number) => {
    const dateObj = new Date(dateStr);
    const dayName = format(dateObj, "EEEE", { locale: vi });
    const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    const dateFormatted = format(dateObj, "dd/MM/yyyy");
    return `${capitalizedDay} - ${dateFormatted} (${count} lịch)`;
  };

  const canEnterRoom = (appDate: string) => {
    const timeDiff = Math.abs(differenceInMinutes(new Date(), new Date(appDate)));
    return timeDiff <= 30;
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(calendarMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 h-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-lg text-slate-800 capitalize">Tháng {format(calendarMonth, "MM, yyyy", { locale: vi })}</h3>
          <div className="flex gap-1">
            <button onClick={prevMonth} className="p-2 bg-slate-50 hover:bg-slate-200 rounded-xl transition-colors"><ChevronLeft className="w-5 h-5 text-slate-600" /></button>
            <button onClick={nextMonth} className="p-2 bg-slate-50 hover:bg-slate-200 rounded-xl transition-colors"><ChevronRight className="w-5 h-5 text-slate-600" /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 mb-4">
          {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map(d => (
            <div key={d} className="text-center font-bold text-slate-400 text-xs uppercase tracking-wider">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {days.map(day => {
            const isCurrentMonth = isSameMonth(day, monthStart);
            const dayAppts = appointments.filter(app => isSameDay(new Date(app.appointmentDate), day));
            const count = dayAppts.length;
            const isTodayDate = isToday(day);
            return (
              <div key={day.toString()} className={`aspect-square flex flex-col items-center justify-center rounded-2xl relative transition-all ${
                !isCurrentMonth ? "text-slate-300 opacity-50" : 
                isTodayDate ? "bg-teal-600 text-white font-bold shadow-lg shadow-teal-500/30 ring-2 ring-teal-200 ring-offset-2" : 
                count > 0 ? "bg-teal-50 text-teal-900 font-bold border border-teal-100 hover:bg-teal-100" : "text-slate-600 hover:bg-slate-50 font-medium"
              }`}>
                <span className="text-sm">{format(day, "d")}</span>
                {count > 0 && !isTodayDate && <span className="absolute bottom-1.5 w-1.5 h-1.5 bg-teal-500 rounded-full"></span>}
                {count > 0 && isTodayDate && <span className="absolute bottom-1.5 w-1.5 h-1.5 bg-white rounded-full"></span>}
              </div>
            );
          })}
        </div>
        <div className="mt-6 flex items-center justify-center gap-6 border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="w-3 h-3 rounded-full bg-teal-600 ring-2 ring-teal-200"></span> Hôm nay
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="w-3 h-3 rounded-full bg-teal-50 border border-teal-200"></span> Có lịch khám
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div className="flex justify-center p-12"><LoadingSpinner className="w-8 h-8 text-teal-600" /></div>;
  if (error) return <Alert type="error" message={error} />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* Title & Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Quản lý lịch hẹn</h2>
          <p className="text-slate-500">Xem và quản lý các lịch khám đã xác nhận của bạn.</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
          <button onClick={handlePrevWeek} className="p-2 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" title="Tuần trước">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col items-center px-2 min-w-[200px]">
            <span className="text-sm font-bold text-slate-800">
              {format(currentWeekStart, "dd/MM/yyyy")} - {format(currentWeekEnd, "dd/MM/yyyy")}
            </span>
          </div>
          <button onClick={handleNextWeek} disabled={isCurrentWeek} className="p-2 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500" title="Tuần sau">
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="w-px h-6 bg-slate-200 mx-1"></div>
          <button onClick={handleGoToToday} className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${isCurrentWeek ? "bg-teal-50 text-teal-700" : "text-slate-600 hover:bg-slate-100"}`}>
            Hôm nay
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: <Calendar className="w-6 h-6" />, color: "teal", label: "Tổng lịch khám", value: kpis.total },
          { icon: <Clock8 className="w-6 h-6" />, color: "orange", label: "Hôm nay", value: kpis.today },
          { icon: <CheckCircle2 className="w-6 h-6" />, color: "green", label: "Đã hoàn thành", value: kpis.completed },
          { icon: <Users className="w-6 h-6" />, color: "blue", label: "Chờ khám", value: kpis.waiting },
        ].map((kpi, i) => (
          <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full bg-${kpi.color}-50 text-${kpi.color}-600 flex items-center justify-center shrink-0`}>{kpi.icon}</div>
            <div>
              <p className="text-xs text-slate-500 font-medium">{kpi.label}</p>
              <p className="text-xl font-bold text-slate-800">{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Weekly Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        {groupedAppointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <CalendarCheck className="w-10 h-10 text-teal-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">Không có lịch khám nào trong tuần này</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-sm">Tuần hiện tại không có bệnh nhân nào đặt lịch. Bạn có thể xem lại các lịch sử tuần trước.</p>
            <button onClick={handlePrevWeek} className="px-6 py-2.5 bg-teal-50 text-teal-700 font-semibold rounded-xl hover:bg-teal-100 transition-colors">Xem tuần trước</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-100">
                <tr>
                  <th className="p-4 pl-6 w-1/3">Bệnh nhân</th>
                  <th className="p-4">Thời gian khám</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4 text-center">Bệnh án</th>
                  <th className="p-4 pr-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50">
                {groupedAppointments.map(([dateStr, dayAppointments]) => (
                  <React.Fragment key={dateStr}>
                    <tr className="bg-slate-50/30">
                      <td colSpan={5} className="py-3 px-6 text-teal-700 font-bold border-y border-slate-100 text-xs tracking-wide">
                        {formatDayHeader(dateStr, dayAppointments.length)}
                      </td>
                    </tr>
                    {dayAppointments.map(app => {
                      const isApptToday = isSameDay(new Date(app.appointmentDate), new Date());
                      const isReadyToEnter = app.status === "CONFIRMED" && canEnterRoom(app.appointmentDate);
                      const patientName = (app.patientInfo as any)?.fullName || app.user?.fullName;
                      return (
                        <tr key={app.id} className="hover:bg-slate-50/80 transition-colors group">
                          <td className="p-4 pl-6">
                            <div className="flex items-center gap-4">
                              <div className="w-11 h-11 rounded-full bg-slate-200 overflow-hidden shrink-0 ring-2 ring-transparent group-hover:ring-teal-100 transition-all">
                                {app.user?.avatar ? (
                                  <img src={app.user.avatar} alt="avatar" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-lg bg-teal-50">
                                    {patientName?.charAt(0) || "U"}
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 text-[15px]">{patientName}</p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {(app.patientInfo as any)?.gender || app.user?.gender} • {new Date((app.patientInfo as any)?.dateOfBirth || app.user?.dateOfBirth || Date.now()).getFullYear()}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-800 text-[15px]">{format(new Date(app.appointmentDate), "HH:mm")}</span>
                                <span className="text-xs text-slate-500">{format(new Date(app.appointmentDate), "dd/MM/yyyy")}</span>
                              </div>
                              {isApptToday && (
                                <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-600 rounded text-[10px] font-bold uppercase tracking-wider">Hôm nay</span>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            {app.status === "CONFIRMED" ? (
                              <span className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-xs font-bold whitespace-nowrap inline-flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>Đã xác nhận
                              </span>
                            ) : (
                              <span className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-100 rounded-full text-xs font-bold whitespace-nowrap inline-flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>Đã hoàn thành
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {app.medicalRecord ? (
                              <Link href={`/doctor/examination/${app.id}`} className="inline-flex p-2 bg-slate-100 text-slate-600 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-colors group/btn" title="Xem bệnh án">
                                <FileText className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                              </Link>
                            ) : app.status === 'CONFIRMED' ? (
                              <Link href={`/doctor/examination/${app.id}`} className="inline-flex p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-xl transition-colors group/btn" title="Tạo bệnh án">
                                <Plus className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                              </Link>
                            ) : (
                              <span className="text-xs text-slate-400">-</span>
                            )}
                          </td>
                          <td className="p-4 pr-6">
                            <div className="flex items-center justify-end gap-2">
                              {app.status === "CONFIRMED" && (
                                <>
                                  {isReadyToEnter ? (
                                    <Link href={`/video-call?appointmentId=${app.id}`}>
                                      <button className="px-3 py-1.5 bg-green-600 text-white rounded-xl text-sm font-bold shadow-md shadow-green-500/20 hover:bg-green-700 transition-all flex items-center gap-2 relative">
                                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></span>
                                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"></span>
                                        <Video className="w-4 h-4" />Vào phòng khám
                                      </button>
                                    </Link>
                                  ) : (
                                    <button disabled className="px-3 py-1.5 bg-slate-100 text-slate-400 rounded-xl text-sm font-semibold flex items-center gap-2 cursor-not-allowed" title="Chưa đến giờ khám">
                                      <Video className="w-4 h-4" />Vào phòng khám
                                    </button>
                                  )}
                                  <Link href={`/doctor/examination/${app.id}`}>
                                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors" title="Chi tiết & Kê đơn">
                                      <FileText className="w-4 h-4" />
                                    </button>
                                  </Link>
                                  <button onClick={() => openCancelModal(app.id)} disabled={updatingId === app.id} className="p-2 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors" title="Hủy lịch">
                                    {updatingId === app.id ? <LoadingSpinner className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                  </button>
                                </>
                              )}
                              {app.status === "COMPLETED" && (
                                <div className="flex items-center gap-2">
                                  {/* View Patient Profile */}
                                  <button
                                    onClick={() => openPatientDrawer(app.user.id)}
                                    className="px-3 py-1.5 border border-teal-200 text-teal-700 hover:bg-teal-50 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5"
                                    title="Xem hồ sơ bệnh nhân"
                                  >
                                    <User className="w-4 h-4" />
                                    Hồ sơ BN
                                  </button>
                                  {/* View Medical Record */}
                                  <button
                                    onClick={() => setSelectedPrescriptionId(app.id)}
                                    className="px-3 py-1.5 border border-slate-200 text-slate-600 hover:text-teal-700 hover:border-teal-200 hover:bg-teal-50 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5"
                                  >
                                    <FileText className="w-4 h-4" />
                                    Bệnh án
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bottom Section: Calendar & Upcoming */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1">{renderCalendar()}</div>
        <div className="xl:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col h-[500px]">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                <Clock8 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-800">Lịch khám sắp tới</h3>
                <p className="text-xs text-slate-500">Các lịch đã xác nhận nhưng chưa diễn ra</p>
              </div>
            </div>
            <span className="bg-orange-100 text-orange-700 py-1 px-3 rounded-full text-sm font-bold">{upcomingAppointments.length} lịch</span>
          </div>
          <div className="flex-1 overflow-y-auto pr-1 space-y-4">
            {upcomingAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <CalendarCheck className="w-12 h-12 text-slate-200 mb-3" />
                <p className="text-slate-500 font-medium">Không có lịch hẹn nào sắp tới</p>
              </div>
            ) : (
              upcomingAppointments.map(app => (
                <div key={app.id} className="p-4 bg-slate-50 hover:bg-slate-100/80 transition-colors rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white border border-slate-200 overflow-hidden shrink-0 shadow-sm">
                      {app.user?.avatar ? (
                        <img src={app.user.avatar} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold bg-teal-50">
                          {((app.patientInfo as any)?.fullName || app.user?.fullName)?.charAt(0) || "U"}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-[15px]">
                        {(app.patientInfo as any)?.fullName || app.user?.fullName}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs font-medium">
                        <span className="text-orange-600 bg-orange-100 px-2 py-0.5 rounded flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />{format(new Date(app.appointmentDate), "HH:mm")}
                        </span>
                        <span className="text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
                          {format(new Date(app.appointmentDate), "dd/MM/yyyy")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    {canEnterRoom(app.appointmentDate) && (
                      <div className="flex items-center gap-2 text-green-600 font-semibold text-xs px-2">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                        </span>
                        Sắp đến giờ
                      </div>
                    )}
                    <Link href={`/doctor/examination/${app.id}`} className="w-full sm:w-auto">
                      <button className="w-full sm:w-auto px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:border-teal-300 hover:text-teal-700 hover:bg-teal-50 shadow-sm transition-all flex justify-center items-center gap-2">
                        Xem hồ sơ
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600" />
                      </button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* --- PATIENT PROFILE DRAWER --- */}
      {patientDrawerOpen && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setPatientDrawerOpen(false)}>
          {/* Backdrop */}
          <div className="flex-1 bg-slate-900/40 backdrop-blur-sm" />
          {/* Drawer */}
          <div
            className="w-full max-w-md bg-white shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300"
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-600 to-teal-700 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Hồ sơ Bệnh nhân</h3>
                  <p className="text-teal-100 text-xs">Thông tin chi tiết & Lịch sử khám</p>
                </div>
              </div>
              <button onClick={() => setPatientDrawerOpen(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto">
              {loadingPatient ? (
                <div className="flex justify-center items-center h-64">
                  <LoadingSpinner className="w-8 h-8 text-teal-600" />
                </div>
              ) : patientDetail ? (
                <div className="p-6 space-y-6">
                  {/* Patient Info Card */}
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-teal-50 overflow-hidden border-2 border-teal-100 shrink-0">
                      {patientDetail.user.avatar ? (
                        <img src={patientDetail.user.avatar} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-teal-600 font-bold text-3xl">
                          {patientDetail.user.fullName?.charAt(0) || "U"}
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-slate-800">{patientDetail.user.fullName}</h4>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {patientDetail.user.gender} •{" "}
                        {patientDetail.user.dateOfBirth ? `${new Date().getFullYear() - new Date(patientDetail.user.dateOfBirth).getFullYear()} tuổi` : "Chưa có"}
                      </p>
                      <p className="text-xs text-teal-600 font-semibold mt-1 bg-teal-50 px-2 py-0.5 rounded-full inline-block">
                        {patientDetail.pastAppointments.length} lần khám
                      </p>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Thông tin liên hệ</h5>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-sm">
                        <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-slate-700 font-medium truncate">{patientDetail.user.email || "Chưa có"}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-slate-700 font-medium">{patientDetail.user.phone || "Chưa có"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Medical Info */}
                  <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Thông tin y tế</h5>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-xl p-3 border border-slate-100">
                        <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mb-1">
                          <Heart className="w-3 h-3 text-red-400" />Nhóm máu
                        </p>
                        <p className="font-bold text-slate-800 text-base">
                          {patientDetail.user.bloodType || <span className="text-slate-400 text-sm font-normal">Chưa có</span>}
                        </p>
                      </div>
                      <div className="bg-white rounded-xl p-3 border border-slate-100">
                        <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mb-1">
                          <User className="w-3 h-3 text-slate-400" />Giới tính
                        </p>
                        <p className="font-bold text-slate-800 text-base">
                          {patientDetail.user.gender || <span className="text-slate-400 text-sm font-normal">Chưa có</span>}
                        </p>
                      </div>
                    </div>
                    {patientDetail.user.allergies && (
                      <div className="bg-red-50 rounded-xl p-3 border border-red-100">
                        <p className="text-xs text-red-500 font-bold flex items-center gap-1.5 mb-1">
                          <AlertCircle className="w-3.5 h-3.5" />Dị ứng thuốc
                        </p>
                        <p className="text-sm text-red-700 font-medium">{patientDetail.user.allergies}</p>
                      </div>
                    )}
                    {patientDetail.user.chronicDiseases && (
                      <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                        <p className="text-xs text-amber-600 font-bold flex items-center gap-1.5 mb-1">
                          <Activity className="w-3.5 h-3.5" />Bệnh nền / Mãn tính
                        </p>
                        <p className="text-sm text-amber-800 font-medium">{patientDetail.user.chronicDiseases}</p>
                      </div>
                    )}
                    {!patientDetail.user.allergies && !patientDetail.user.chronicDiseases && (
                      <p className="text-xs text-slate-400 text-center py-2">Không có thông tin dị ứng hoặc bệnh nền</p>
                    )}
                  </div>

                  {/* Visit History */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Lịch sử khám bệnh ({patientDetail.pastAppointments.length} lần)
                    </h5>
                    {patientDetail.pastAppointments.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-4 bg-slate-50 rounded-2xl">Chưa có lịch sử khám bệnh</p>
                    ) : (
                      <div className="space-y-2">
                        {patientDetail.pastAppointments.map((appt, index) => (
                          <div key={appt.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between gap-3 hover:bg-slate-100 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0 font-bold text-sm">
                                {patientDetail.pastAppointments.length - index}
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 text-sm">
                                  {format(new Date(appt.appointmentDate), "dd/MM/yyyy", { locale: vi })}
                                </p>
                                <p className="text-xs text-slate-500">{format(new Date(appt.appointmentDate), "HH:mm")}</p>
                              </div>
                            </div>
                            {appt.medicalRecord?.status === 'COMPLETED' ? (
                              <Link href={`/doctor/examination/${appt.id}?viewOnly=true`} onClick={() => setPatientDrawerOpen(false)}>
                                <button className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:border-teal-300 hover:text-teal-700 hover:bg-teal-50 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm">
                                  <FileText className="w-3.5 h-3.5" />Bệnh án
                                </button>
                              </Link>
                            ) : (
                              <span className="text-[10px] text-slate-400">Chưa lưu bệnh án</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Prescription View Modal */}
      {selectedPrescriptionId && (
        <PrescriptionModal appointmentId={selectedPrescriptionId} onClose={() => setSelectedPrescriptionId(null)} />
      )}

      {/* Cancel Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Hủy lịch hẹn</h3>
                <p className="text-sm text-slate-500 mt-1">Lý do hủy sẽ được thông báo tới bệnh nhân.</p>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-500">
                <XCircle className="w-6 h-6" />
              </div>
            </div>
            <div className="p-6">
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Nhập lý do chi tiết..."
                className="w-full min-h-[120px] p-4 rounded-xl border border-slate-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none text-sm resize-none bg-slate-50 transition-all"
                autoFocus
              />
            </div>
            <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setIsCancelModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-colors">
                Trở lại
              </button>
              <button
                onClick={submitCancel}
                disabled={!cancelReason.trim() || !!updatingId}
                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-md shadow-red-500/20"
              >
                {updatingId ? <LoadingSpinner className="w-4 h-4" /> : null}
                Xác nhận hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
