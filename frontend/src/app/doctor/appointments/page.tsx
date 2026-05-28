"use client";

import React, { useEffect, useState } from "react";
import api from "@/services/api";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import toast from "react-hot-toast";
import { Search, Calendar, User, Clock, CheckCircle2, XCircle, FileText } from "lucide-react";
import { removeVietnameseTones } from "@/utils/stringUtils";

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

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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
    } catch (err) {
      toast.error("Cập nhật trạng thái thất bại");
    } finally {
      setUpdatingId(null);
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

  const handleReject = (id: string) => {
    openCancelModal(id, "REJECT");
  };

  const filteredAppointments = appointments.filter(app => {
    const matchStatus = filterStatus === "ALL" || app.status === filterStatus;
    const normalizedName = removeVietnameseTones(app.user.fullName || "");
    const normalizedSearch = removeVietnameseTones(searchTerm);
    const matchName = normalizedName.includes(normalizedSearch);
    return matchStatus && matchName;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING": return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">Chờ xác nhận</span>;
      case "CONFIRMED": return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">Đã xác nhận</span>;
      case "COMPLETED": return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Đã hoàn thành</span>;
      case "CANCELLED": return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">Đã hủy</span>;
      default: return null;
    }
  };

  if (loading) return <div className="flex justify-center p-12"><LoadingSpinner className="w-8 h-8 text-teal-600" /></div>;
  if (error) return <Alert type="error" message={error} />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Quản lý lịch hẹn</h2>
        <p className="text-slate-500">Xem và xử lý các yêu cầu đặt lịch khám từ bệnh nhân.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên bệnh nhân..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none text-sm"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none text-sm bg-slate-50"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="PENDING">Chờ xác nhận</option>
          <option value="CONFIRMED">Đã xác nhận</option>
          <option value="COMPLETED">Đã hoàn thành</option>
          <option value="CANCELLED">Đã hủy</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
              <tr>
                <th className="p-4">Bệnh nhân</th>
                <th className="p-4">Thời gian khám</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    Không tìm thấy lịch hẹn nào.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map(app => (
                  <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0">
                          {app.user.avatar ? (
                            <img src={app.user.avatar} alt={app.user.fullName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold">
                              {app.user.fullName?.charAt(0) || "U"}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{app.user.fullName}</p>
                          <p className="text-xs text-slate-500">{app.user.gender} • Sinh năm {new Date(app.user.dateOfBirth).getFullYear() || "N/A"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <Clock className="w-4 h-4 text-teal-500" />
                        {new Date(app.appointmentDate).toLocaleString('vi-VN')}
                      </div>
                      {app.notes && (
                        <div className="text-xs text-slate-500 mt-1 flex items-start gap-1">
                          <FileText className="w-3 h-3 mt-0.5 shrink-0" />
                          <span className="line-clamp-1">{app.notes}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      {getStatusBadge(app.status)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        {app.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(app.id, "CONFIRMED")}
                              disabled={updatingId === app.id}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium text-xs flex items-center gap-1 border border-blue-200"
                            >
                              <CheckCircle2 className="w-4 h-4" /> Xác nhận
                            </button>
                            <button
                              onClick={() => handleReject(app.id)}
                              disabled={updatingId === app.id}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium text-xs flex items-center gap-1 border border-red-200"
                            >
                              <XCircle className="w-4 h-4" /> Từ chối
                            </button>
                          </>
                        )}
                        {app.status === "CONFIRMED" && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(app.id, "COMPLETED")}
                              disabled={updatingId === app.id}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors font-medium text-xs flex items-center gap-1 border border-green-200"
                            >
                              <CheckCircle2 className="w-4 h-4" /> Hoàn thành
                            </button>
                            <button
                              onClick={() => openCancelModal(app.id, "CANCEL_CONFIRMED")}
                              disabled={updatingId === app.id}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium text-xs flex items-center gap-1 border border-red-200"
                            >
                              <XCircle className="w-4 h-4" /> Hủy lịch
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cancel/Reject Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
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
    </div>
  );
}
