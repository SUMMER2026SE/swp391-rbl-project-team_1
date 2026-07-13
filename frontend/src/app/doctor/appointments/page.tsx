"use client";

import React, { useEffect, useState, useMemo } from "react";
import api from "@/services/api";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";
import toast from "react-hot-toast";
import { Search, Calendar, User, Clock, CheckCircle2, XCircle, FileText, Video, List, CreditCard, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { removeVietnameseTones } from "@/utils/stringUtils";
import Link from "next/link";
import PrescriptionModal from "@/components/ui/PrescriptionModal";
import { 
  format, startOfMonth, endOfMonth, eachDayOfInterval, 
  isSameMonth, isToday, isSameDay, addMonths, subMonths, 
  startOfWeek, endOfWeek 
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
  patientProfile?: {
    fullName?: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    gender?: string;
    cccd?: string;
    address?: string;
  };
  medicalRecord?: {
    id: string;
    status: string;
  };
  payment?: {
    status: string;
  };
}

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"LIST" | "CALENDAR">("LIST");

  // Bulk action state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());
  const [selectedApptModal, setSelectedApptModal] = useState<Appointment | null>(null);

  // Modal state
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelType, setCancelType] = useState<"REJECT" | "CANCEL_CONFIRMED">("REJECT");

  const fetchAppointments = async () => {
    try {
      const res = await api.get("/doctor/appointments");
      setAppointments(res.data);
    } catch (err) {
      setError("Không thể tải danh sách lịch hẹn.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string, reason?: string) => {
    setUpdatingId(id);
    try {
      await api.put(`/doctor/appointments/${id}/status`, { status: newStatus, notes: reason });
      toast.success("Cập nhật trạng thái thành công");
      fetchAppointments();
      if (selectedApptModal && selectedApptModal.id === id) {
        setSelectedApptModal({ ...selectedApptModal, status: newStatus as any });
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Cập nhật trạng thái thất bại";
      toast.error(errorMsg);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleBulkConfirm = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkUpdating(true);
    try {
      await api.put("/doctor/appointments/bulk-status", { ids: selectedIds, status: "CONFIRMED" });
      toast.success(`Đã xác nhận ${selectedIds.length} lịch hẹn`);
      setSelectedIds([]);
      fetchAppointments();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Xác nhận hàng loạt thất bại";
      toast.error(errorMsg);
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const openCancelModal = (id: string, type: "REJECT" | "CANCEL_CONFIRMED") => {
    setCancelTargetId(id);
    setCancelType(type);
    setCancelReason("");
    setIsCancelModalOpen(true);
  };

  const submitCancel = () => {
    if (cancelTargetId && cancelReason.trim()) {
      handleUpdateStatus(cancelTargetId, "CANCELLED", cancelReason.trim());
      setIsCancelModalOpen(false);
      setCancelTargetId(null);
    } else {
      toast.error("Vui lòng nhập lý do.");
    }
  };

  const handleReject = (id: string) => openCancelModal(id, "REJECT");

  const filteredAppointments = useMemo(() => {
    return appointments.filter(app => {
      const displayStatus = app.status || "PENDING";
      const matchStatus = filterStatus === "ALL" || displayStatus === filterStatus;
      const patientName = app.patientProfile?.fullName || app.user?.fullName || "";
      const normalizedName = removeVietnameseTones(patientName.toLowerCase());
      const normalizedSearch = removeVietnameseTones(searchTerm.toLowerCase());
      const matchName = normalizedName.includes(normalizedSearch);
      
      let matchDate = true;
      if (dateFrom || dateTo) {
        const appDate = new Date(app.appointmentDate);
        if (dateFrom && appDate < new Date(dateFrom)) matchDate = false;
        if (dateTo && appDate > new Date(new Date(dateTo).setHours(23, 59, 59))) matchDate = false;
      }
      
      return matchStatus && matchName && matchDate;
    });
  }, [appointments, filterStatus, searchTerm, dateFrom, dateTo]);

  const getStatusBadge = (status: string) => {
    const s = status || "PENDING";
    switch (s) {
      case "PENDING": return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold whitespace-nowrap">Chờ xác nhận</span>;
      case "PENDING_PAYMENT": return <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold whitespace-nowrap">Chờ thanh toán</span>;
      case "CONFIRMED": return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold whitespace-nowrap">Đã xác nhận</span>;
      case "COMPLETED": return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold whitespace-nowrap">Đã hoàn thành</span>;
      case "CANCELLED": return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold whitespace-nowrap">Đã hủy</span>;
      case "EXPIRED": return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold whitespace-nowrap">Đã hết hạn</span>;
      default: return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold whitespace-nowrap">Chờ xác nhận</span>;
    }
  };

  const getPaymentBadge = (status?: string) => {
    if (!status) return <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-xs whitespace-nowrap">Chưa thanh toán</span>;
    switch (status) {
      case "PAID": return <span className="px-2 py-1 bg-green-50 text-green-600 rounded text-xs whitespace-nowrap font-medium">Đã thanh toán</span>;
      case "PENDING": return <span className="px-2 py-1 bg-yellow-50 text-yellow-600 rounded text-xs whitespace-nowrap font-medium">Đang xử lý</span>;
      case "REFUNDED": return <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs whitespace-nowrap font-medium">Đã hoàn tiền</span>;
      default: return <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-xs whitespace-nowrap">Không rõ</span>;
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const pendingIds = filteredAppointments.filter(a => (a.status || 'PENDING') === 'PENDING').map(a => a.id);
      setSelectedIds(pendingIds);
    } else {
      setSelectedIds([]);
    }
  };

  // Calendar Helpers
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const renderCalendar = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        
        // Find appointments for this day
        const dayAppts = filteredAppointments.filter(app => isSameDay(new Date(app.appointmentDate), cloneDay));
        const pending = dayAppts.filter(a => (a.status||'PENDING') === 'PENDING').length;
        const confirmed = dayAppts.filter(a => a.status === 'CONFIRMED').length;
        const completed = dayAppts.filter(a => a.status === 'COMPLETED').length;

        days.push(
          <div
            className={`min-h-[100px] border border-slate-100 p-2 cursor-pointer transition-all ${
              !isSameMonth(day, monthStart)
                ? "bg-slate-50 text-slate-400"
                : isSameDay(day, selectedDay || new Date(0))
                ? "bg-teal-50 border-teal-200"
                : "bg-white hover:bg-slate-50"
            }`}
            key={day.toString()}
            onClick={() => setSelectedDay(cloneDay)}
          >
            <div className="flex justify-between items-start">
              <span className={`text-sm font-semibold ${isToday(day) ? 'bg-teal-600 text-white w-6 h-6 flex items-center justify-center rounded-full' : ''}`}>
                {formattedDate}
              </span>
              {dayAppts.length > 0 && <span className="text-xs text-slate-500">{dayAppts.length} ca</span>}
            </div>
            <div className="mt-2 space-y-1">
              {pending > 0 && <div className="text-[10px] bg-yellow-100 text-yellow-700 px-1 rounded line-clamp-1">{pending} chờ XN</div>}
              {confirmed > 0 && <div className="text-[10px] bg-blue-100 text-blue-700 px-1 rounded line-clamp-1">{confirmed} đã XN</div>}
              {completed > 0 && <div className="text-[10px] bg-green-100 text-green-700 px-1 rounded line-clamp-1">{completed} HT</div>}
            </div>
          </div>
        );
        day = new Date(day.getTime() + 24 * 60 * 60 * 1000);
      }
      rows.push(<div className="grid grid-cols-7" key={day.toString()}>{days}</div>);
      days = [];
    }
    return rows;
  };

  const selectedDayAppointments = useMemo(() => {
    if (!selectedDay) return [];
    return filteredAppointments.filter(app => isSameDay(new Date(app.appointmentDate), selectedDay)).sort((a,b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());
  }, [filteredAppointments, selectedDay]);

  if (loading) return <div className="flex justify-center p-12"><LoadingSpinner className="w-8 h-8 text-teal-600" /></div>;
  if (error) return <Alert type="error" message={error} />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 flex flex-col h-[calc(100vh-80px)] overflow-hidden">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 pr-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Quản lý lịch hẹn</h2>
          <p className="text-slate-500">Quản lý bệnh nhân và lịch trình khám bệnh.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button 
            onClick={() => setViewMode("LIST")}
            className={`px-4 py-2 flex items-center gap-2 rounded-md text-sm font-semibold transition-colors ${viewMode === "LIST" ? "bg-white text-teal-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            <List className="w-4 h-4" /> Dạng danh sách
          </button>
          <button 
            onClick={() => setViewMode("CALENDAR")}
            className={`px-4 py-2 flex items-center gap-2 rounded-md text-sm font-semibold transition-colors ${viewMode === "CALENDAR" ? "bg-white text-teal-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            <Calendar className="w-4 h-4" /> Lịch biểu
          </button>
        </div>
      </div>

      {viewMode === "LIST" ? (
        <div className="flex flex-col h-full overflow-hidden">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100 shrink-0 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm kiếm bệnh nhân..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-500">Từ</span>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 focus:border-teal-500 outline-none text-sm" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-500">Đến</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 focus:border-teal-500 outline-none text-sm" />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 rounded-xl border border-slate-200 focus:border-teal-500 outline-none text-sm bg-slate-50"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PENDING">Chờ xác nhận</option>
              <option value="CONFIRMED">Đã xác nhận</option>
              <option value="COMPLETED">Đã hoàn thành</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </div>

          {/* Bulk Action Header */}
          {selectedIds.length > 0 && (
            <div className="bg-teal-50 border border-teal-200 p-3 rounded-xl mb-4 flex items-center justify-between shrink-0">
              <span className="text-sm font-semibold text-teal-800">Đã chọn {selectedIds.length} lịch hẹn (chờ xác nhận)</span>
              <button 
                onClick={handleBulkConfirm} 
                disabled={isBulkUpdating}
                className="px-4 py-1.5 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isBulkUpdating ? <LoadingSpinner className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                Xác nhận đã chọn
              </button>
            </div>
          )}

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex-1 overflow-hidden flex flex-col">
            <div className="overflow-x-auto flex-1 relative">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100 sticky top-0 z-10">
                  <tr>
                    <th className="p-4 w-12">
                      <input 
                        type="checkbox" 
                        onChange={toggleSelectAll}
                        checked={filteredAppointments.filter(a => (a.status||'PENDING') === 'PENDING').length > 0 && selectedIds.length === filteredAppointments.filter(a => (a.status||'PENDING') === 'PENDING').length}
                        className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                    </th>
                    <th className="p-4">Bệnh nhân</th>
                    <th className="p-4">Thời gian</th>
                    <th className="p-4">Trạng thái</th>
                    <th className="p-4">Thanh toán</th>
                    <th className="p-4">Bệnh án</th>
                    <th className="p-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                        Không tìm thấy lịch hẹn nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredAppointments.map(app => {
                      const displayStatus = app.status || "PENDING";
                      return (
                      <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          {displayStatus === 'PENDING' && (
                            <input 
                              type="checkbox" 
                              checked={selectedIds.includes(app.id)}
                              onChange={() => toggleSelectRow(app.id)}
                              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                            />
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0">
                              {app.user?.avatar ? (
                                <img src={app.user.avatar} alt="avatar" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold">
                                  {((app.patientProfile as any)?.fullName || app.user?.fullName)?.charAt(0) || "U"}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800 line-clamp-1 max-w-[150px]">{(app.patientProfile as any)?.fullName || app.user?.fullName}</p>
                              <p className="text-xs text-slate-500">{(app.patientProfile as any)?.gender || app.user?.gender} • {new Date((app.patientProfile as any)?.dateOfBirth || app.user?.dateOfBirth || Date.now()).getFullYear()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-slate-700 font-medium">
                            <Clock className="w-4 h-4 text-teal-500 shrink-0" />
                            {new Date(app.appointmentDate).toLocaleString('vi-VN')}
                          </div>
                        </td>
                        <td className="p-4">
                          {getStatusBadge(app.status)}
                        </td>
                        <td className="p-4">
                          {getPaymentBadge(app.payment?.status)}
                        </td>
                        <td className="p-4 text-center">
                           {app.medicalRecord ? (
                             <Link href={`/doctor/examination/${app.id}`} className="inline-flex p-2 bg-slate-100 text-slate-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors">
                               <FileText className="w-4 h-4" />
                             </Link>
                           ) : displayStatus === 'CONFIRMED' || displayStatus === 'COMPLETED' ? (
                             <Link href={`/doctor/examination/${app.id}`} className="inline-flex p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Tạo bệnh án">
                               <Plus className="w-4 h-4" />
                             </Link>
                           ) : (
                             <span className="text-xs text-slate-400">-</span>
                           )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            {displayStatus === "PENDING" && (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(app.id, "CONFIRMED")}
                                  disabled={updatingId === app.id}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200" title="Xác nhận"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleReject(app.id)}
                                  disabled={updatingId === app.id}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200" title="Từ chối"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {displayStatus === "CONFIRMED" && (
                              <>
                                <Link href={`/video-call?appointmentId=${app.id}`}>
                                  <button className="p-1.5 text-teal-700 hover:bg-teal-50 rounded-lg transition-colors border border-teal-200 bg-teal-50/20" title="Phòng khám Video">
                                    <Video className="w-4 h-4" />
                                  </button>
                                </Link>
                                <Link href={`/doctor/examination/${app.id}`}>
                                  <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200 ml-2" title="Khám & Kê đơn">
                                    <FileText className="w-4 h-4" />
                                  </button>
                                </Link>
                                <button
                                  onClick={() => openCancelModal(app.id, "CANCEL_CONFIRMED")}
                                  disabled={updatingId === app.id}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200 ml-2" title="Hủy"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {displayStatus === "COMPLETED" && (
                              <button
                                onClick={() => setSelectedPrescriptionId(app.id)}
                                className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors border border-teal-200" title="Xem đơn thuốc"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex h-full gap-6 overflow-hidden">
          {/* Calendar Grid */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-slate-800 capitalize">Tháng {format(currentDate, "MM, yyyy", { locale: vi })}</h3>
              <div className="flex gap-2">
                <button onClick={prevMonth} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"><ChevronLeft className="w-5 h-5 text-slate-600" /></button>
                <button onClick={nextMonth} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"><ChevronRight className="w-5 h-5 text-slate-600" /></button>
              </div>
            </div>
            <div className="grid grid-cols-7 mb-2">
               {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map(d => (
                 <div key={d} className="text-center font-bold text-slate-400 text-xs uppercase tracking-wider pb-2">{d}</div>
               ))}
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {renderCalendar()}
            </div>
          </div>

          {/* Right Sidebar Timeline */}
          <div className="w-[350px] bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden shrink-0">
             <div className="p-4 border-b border-slate-100 bg-slate-50">
               <h3 className="font-bold text-slate-800">Lịch khám trong ngày</h3>
               <p className="text-sm text-slate-500">{selectedDay ? format(selectedDay, "EEEE, dd/MM/yyyy", { locale: vi }) : ""}</p>
             </div>
             <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
               {selectedDayAppointments.length === 0 ? (
                 <div className="text-center text-slate-400 text-sm mt-10">Không có lịch hẹn nào.</div>
               ) : (
                 selectedDayAppointments.map(app => (
                   <div 
                     key={app.id} 
                     onClick={() => setSelectedApptModal(app)}
                     className="relative pl-6 pb-4 border-l-2 border-slate-200 last:border-transparent last:pb-0 cursor-pointer group"
                   >
                      <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white ${
                        app.status === 'COMPLETED' ? 'bg-green-500' :
                        app.status === 'CONFIRMED' ? 'bg-blue-500' :
                        app.status === 'CANCELLED' ? 'bg-red-500' : 'bg-yellow-500'
                      }`}></div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 group-hover:border-teal-300 group-hover:shadow-sm transition-all">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-slate-800 text-sm">{format(new Date(app.appointmentDate), "HH:mm")}</span>
                          {getStatusBadge(app.status)}
                        </div>
                        <p className="font-semibold text-slate-700 text-sm">{(app.patientProfile as any)?.fullName || app.user?.fullName}</p>
                        <p className="text-xs text-slate-500 line-clamp-1">{app.notes || "Không có ghi chú"}</p>
                      </div>
                   </div>
                 ))
               )}
             </div>
          </div>
        </div>
      )}

      {selectedPrescriptionId && (
        <PrescriptionModal 
          appointmentId={selectedPrescriptionId} 
          onClose={() => setSelectedPrescriptionId(null)} 
        />
      )}

      {/* Appointment Detail Modal (Calendar View) */}
      {selectedApptModal && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
           <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in relative">
              <button onClick={() => setSelectedApptModal(null)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors">
                <XCircle className="w-5 h-5" />
              </button>
              
              <div className="p-6 border-b border-slate-100 flex items-center gap-4">
                 <div className="w-16 h-16 rounded-full bg-slate-200 overflow-hidden shrink-0">
                    {selectedApptModal.user?.avatar ? (
                      <img src={selectedApptModal.user.avatar} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-slate-400 m-auto mt-4" />
                    )}
                 </div>
                 <div>
                    <h3 className="text-xl font-bold text-slate-800">{(selectedApptModal.patientProfile as any)?.fullName || selectedApptModal.user?.fullName}</h3>
                    <p className="text-sm text-slate-500">{(selectedApptModal.patientProfile as any)?.gender || selectedApptModal.user?.gender} • {selectedApptModal.user?.email}</p>
                 </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0"><Clock className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold">Thời gian hẹn</p>
                    <p className="text-sm font-bold text-slate-800">{new Date(selectedApptModal.appointmentDate).toLocaleString('vi-VN')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><CheckCircle2 className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold">Trạng thái</p>
                    <div className="mt-1">{getStatusBadge(selectedApptModal.status)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0"><CreditCard className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold">Thanh toán</p>
                    <div className="mt-1">{getPaymentBadge(selectedApptModal.payment?.status)}</div>
                  </div>
                </div>
                {selectedApptModal.notes && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-600 italic">
                    "{selectedApptModal.notes}"
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 flex-wrap">
                 {(selectedApptModal.status || 'PENDING') === 'PENDING' && (
                    <>
                      <button onClick={() => { handleUpdateStatus(selectedApptModal.id, "CONFIRMED"); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">Xác nhận</button>
                      <button onClick={() => { setSelectedApptModal(null); handleReject(selectedApptModal.id); }} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700">Từ chối</button>
                    </>
                 )}
                 {selectedApptModal.status === 'CONFIRMED' && (
                    <>
                      <Link href={`/video-call?appointmentId=${selectedApptModal.id}`} className="px-4 py-2 bg-teal-100 text-teal-700 rounded-lg text-sm font-bold hover:bg-teal-200">Vào phòng khám</Link>
                      <Link href={`/doctor/examination/${selectedApptModal.id}`} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">Khám & Kê đơn</Link>
                      <button onClick={() => { setSelectedApptModal(null); openCancelModal(selectedApptModal.id, "CANCEL_CONFIRMED"); }} className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-semibold">Hủy</button>
                    </>
                 )}
                 {selectedApptModal.status === 'COMPLETED' && (
                    <Link href={`/doctor/examination/${selectedApptModal.id}`} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-300">Xem Bệnh án</Link>
                 )}
              </div>
           </div>
         </div>
      )}

      {/* Cancel/Reject Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800">
                {cancelType === "REJECT" ? "Từ chối lịch hẹn" : "Hủy lịch hẹn đã xác nhận"}
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Vui lòng cung cấp lý do để thông báo cho bệnh nhân.
              </p>
            </div>
            <div className="p-6">
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Nhập lý do chi tiết..."
                className="w-full min-h-[100px] p-3 rounded-xl border border-slate-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-sm resize-none"
                autoFocus
              />
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={submitCancel}
                disabled={!cancelReason.trim()}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
