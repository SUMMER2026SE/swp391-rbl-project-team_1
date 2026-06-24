"use client";

import React, { useEffect, useState, useCallback } from "react";
import { adminService } from "@/services/admin.service";
import { AdminComplaint, ComplaintStatus } from "@/types/admin";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";
import { Search, MessageSquare, CheckCircle2, Clock } from "lucide-react";

const STATUS_TABS: { label: string; value: ComplaintStatus | "ALL" }[] = [
  { label: "Tất cả", value: "ALL" },
  { label: "Chờ xử lý", value: "PENDING" },
  { label: "Đã xử lý", value: "RESOLVED" },
];

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<AdminComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<ComplaintStatus | "ALL">("ALL");

  // Modal State
  const [resolvingComplaint, setResolvingComplaint] = useState<AdminComplaint | null>(null);
  const [adminResponse, setAdminResponse] = useState("");

  const loadComplaints = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminService.getComplaints();
      setComplaints(res.data);
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Không thể tải danh sách phản hồi.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  useEffect(() => {
    if (actionMessage) {
      const timer = setTimeout(() => setActionMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [actionMessage]);

  const filteredComplaints = complaints.filter((c) => {
    const matchesSearch =
      !searchQuery.trim() ||
      c.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "ALL" || c.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const handleResolve = async () => {
    if (!resolvingComplaint) return;
    setSubmitting(true);
    try {
      await adminService.resolveComplaint(resolvingComplaint.id, adminResponse);
      setActionMessage({ type: "success", text: "Đã đánh dấu phản hồi là đã xử lý và phản hồi tới người dùng." });
      setResolvingComplaint(null);
      setAdminResponse("");
      loadComplaints();
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Không thể cập nhật trạng thái phản hồi.";
      setActionMessage({ type: "error", text: errorMsg });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <LoadingSpinner className="h-10 w-10 text-teal-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-white">Phản hồi & Khiếu nại</h1>
        <p className="text-sm text-slate-400">
          Quản lý các phản hồi và khiếu nại từ người dùng hệ thống.
        </p>
      </div>

      {error && <Alert type="error" message={error} className="bg-red-950/40 border-red-900/50 text-red-300" />}
      {actionMessage && <Alert type={actionMessage.type} message={actionMessage.text} className="my-2" />}

      {/* Status Tabs + Search */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === tab.value
                  ? "bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20"
                  : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-100"
              }`}
            >
              {tab.label}
              {tab.value !== "ALL" && (
                <span className="ml-1.5">
                  ({complaints.filter((c) => c.status === tab.value).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Tìm theo nội dung hoặc email người gửi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {filteredComplaints.length === 0 ? (
            <div className="text-center py-20 text-slate-500 text-sm font-medium">
              <MessageSquare className="h-10 w-10 mx-auto mb-3 text-slate-700" />
              Không tìm thấy phản hồi nào.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950 text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                  <th className="p-5 font-semibold">Email người gửi</th>
                  <th className="p-5 font-semibold">Nội dung phản hồi</th>
                  <th className="p-5 font-semibold">Trạng thái</th>
                  <th className="p-5 font-semibold">Ngày gửi</th>
                  <th className="p-5 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-900">
                {filteredComplaints.map((complaint) => (
                  <tr key={complaint.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-5 font-bold text-slate-200">{complaint.user.email}</td>
                    <td className="p-5 text-slate-400 max-w-[350px]">
                      <p className="leading-relaxed text-slate-300 font-medium" title={complaint.message}>
                        {complaint.message.length > 150
                          ? `${complaint.message.substring(0, 150)}...`
                          : complaint.message}
                      </p>
                      {complaint.appointment && (
                        <div className="mt-2 text-[10px] text-teal-400 border border-teal-500/20 bg-teal-500/10 p-2 rounded">
                          <p><span className="font-bold">Lịch khám:</span> {complaint.appointment.id}</p>
                          <p><span className="font-bold">Ngày:</span> {new Date(complaint.appointment.appointmentDate).toLocaleString("vi-VN")}</p>
                        </div>
                      )}
                      {complaint.adminResponse && (
                        <div className="mt-2 text-[10px] bg-slate-900 border border-slate-700 p-2 rounded">
                          <span className="font-bold text-slate-500">Phản hồi của Admin: </span>
                          <span className="text-slate-300">{complaint.adminResponse}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-5">
                      {complaint.status === "RESOLVED" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border font-bold text-[10px] tracking-wide uppercase bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3" /> Đã xử lý
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border font-bold text-[10px] tracking-wide uppercase bg-amber-500/10 text-amber-400 border-amber-500/20">
                          <Clock className="h-3 w-3" /> Chờ xử lý
                        </span>
                      )}
                    </td>
                    <td className="p-5 text-slate-500">
                      {new Date(complaint.createdAt).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </td>
                    <td className="p-5 text-right">
                      {complaint.status === "PENDING" ? (
                        <button
                          onClick={() => {
                            setResolvingComplaint(complaint);
                            setAdminResponse("");
                          }}
                          disabled={submitting}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Xử lý
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-600 italic">Đã hoàn tất</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Resolve Modal */}
      {resolvingComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Xử lý khiếu nại</h3>
            <div className="mb-4 text-sm text-slate-300">
              <p><span className="font-bold text-slate-400">Người gửi:</span> {resolvingComplaint.user.email}</p>
              <p className="mt-2"><span className="font-bold text-slate-400">Nội dung:</span></p>
              <p className="bg-slate-900 p-3 rounded mt-1">{resolvingComplaint.message}</p>
            </div>
            
            <div className="mb-6">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Phản hồi từ Admin (Không bắt buộc)
              </label>
              <textarea
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                placeholder="Nhập nội dung phản hồi gửi tới người dùng..."
                rows={4}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm resize-none"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setResolvingComplaint(null)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 bg-slate-900 border border-slate-800 hover:text-slate-100 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleResolve}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors disabled:opacity-50"
              >
                {submitting ? "Đang xử lý..." : "Xác nhận xử lý"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
