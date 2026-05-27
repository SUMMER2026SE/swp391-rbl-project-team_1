"use client";

import React, { useEffect, useState, useCallback } from "react";
import { adminService } from "@/services/admin.service";
import { AdminDoctor, DoctorStatus } from "@/types/admin";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";
import {
  Search,
  Stethoscope,
  CheckCircle2,
  XCircle,
  Lock,
  Unlock,
  X,
  AlertTriangle,
} from "lucide-react";

const STATUS_TABS: { label: string; value: DoctorStatus | "ALL" }[] = [
  { label: "Tất cả", value: "ALL" },
  { label: "Chờ duyệt", value: "PENDING" },
  { label: "Đã duyệt", value: "APPROVED" },
  { label: "Đã từ chối", value: "REJECTED" },
];

const statusBadgeStyles: Record<DoctorStatus, string> = {
  PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  APPROVED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  REJECTED: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<AdminDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<DoctorStatus | "ALL">("ALL");

  // Reject modal
  const [rejectModalDoctor, setRejectModalDoctor] = useState<AdminDoctor | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ open: false, title: "", message: "", onConfirm: () => {} });

  const loadDoctors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminService.getDoctors();
      setDoctors(res.data);
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Không thể tải danh sách bác sĩ.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  // Auto-clear action messages
  useEffect(() => {
    if (actionMessage) {
      const timer = setTimeout(() => setActionMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [actionMessage]);

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch =
      !searchQuery.trim() ||
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialty.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "ALL" || doc.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const handleApprove = (doctor: AdminDoctor) => {
    setConfirmDialog({
      open: true,
      title: "Phê duyệt Bác sĩ",
      message: `Bạn có chắc chắn muốn phê duyệt bác sĩ "${doctor.name}"?`,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        setSubmitting(true);
        try {
          await adminService.approveDoctor(doctor.id);
          setActionMessage({ type: "success", text: `Đã phê duyệt bác sĩ "${doctor.name}" thành công!` });
          loadDoctors();
        } catch (err: unknown) {
          const errorMsg =
            err && typeof err === "object" && "message" in err
              ? String((err as { message: unknown }).message)
              : "Không thể phê duyệt bác sĩ này.";
          setActionMessage({ type: "error", text: errorMsg });
        } finally {
          setSubmitting(false);
        }
      },
    });
  };

  const handleRejectSubmit = async () => {
    if (!rejectModalDoctor) return;
    setSubmitting(true);
    try {
      await adminService.rejectDoctor(rejectModalDoctor.id, rejectReason || undefined);
      setActionMessage({ type: "success", text: `Đã từ chối bác sĩ "${rejectModalDoctor.name}".` });
      setRejectModalDoctor(null);
      setRejectReason("");
      loadDoctors();
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Không thể từ chối bác sĩ này.";
      setActionMessage({ type: "error", text: errorMsg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleLock = (doctor: AdminDoctor) => {
    const actionLabel = doctor.isLocked ? "Mở khóa" : "Khóa";
    setConfirmDialog({
      open: true,
      title: `${actionLabel} Bác sĩ`,
      message: `Bạn có chắc chắn muốn ${actionLabel.toLowerCase()} tài khoản bác sĩ "${doctor.name}"?`,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        setSubmitting(true);
        try {
          await adminService.lockDoctor(doctor.id);
          setActionMessage({ type: "success", text: `Đã ${actionLabel.toLowerCase()} bác sĩ "${doctor.name}".` });
          loadDoctors();
        } catch (err: unknown) {
          const errorMsg =
            err && typeof err === "object" && "message" in err
              ? String((err as { message: unknown }).message)
              : `Không thể ${actionLabel.toLowerCase()} bác sĩ này.`;
          setActionMessage({ type: "error", text: errorMsg });
        } finally {
          setSubmitting(false);
        }
      },
    });
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
        <h1 className="text-2xl font-black text-white">Kiểm duyệt Bác sĩ</h1>
        <p className="text-sm text-slate-400">
          Quản lý danh sách bác sĩ đăng ký, phê duyệt, từ chối hoặc khóa tài khoản.
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
                  ({doctors.filter((d) => d.status === tab.value).length})
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
            placeholder="Tìm theo tên bác sĩ hoặc chuyên khoa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm"
          />
        </div>
      </div>

      {/* Doctor Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {filteredDoctors.length === 0 ? (
            <div className="text-center py-20 text-slate-500 text-sm font-medium">
              <Stethoscope className="h-10 w-10 mx-auto mb-3 text-slate-700" />
              Không tìm thấy bác sĩ nào phù hợp.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950 text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                  <th className="p-5 font-semibold">Bác sĩ</th>
                  <th className="p-5 font-semibold">Chuyên khoa</th>
                  <th className="p-5 font-semibold">Bệnh viện</th>
                  <th className="p-5 font-semibold">Kinh nghiệm</th>
                  <th className="p-5 font-semibold">Trạng thái</th>
                  <th className="p-5 font-semibold">Khóa</th>
                  <th className="p-5 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-900">
                {filteredDoctors.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                          {doc.avatar ? (
                            <img src={doc.avatar} alt={doc.name} className="h-full w-full object-cover" />
                          ) : (
                            <Stethoscope className="h-4 w-4 text-slate-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-200">{doc.name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {doc.userAccount?.email || "Chưa liên kết"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-5 text-teal-400 font-semibold">{doc.specialty.name}</td>
                    <td className="p-5 text-slate-400">{doc.hospital}</td>
                    <td className="p-5 text-slate-400">{doc.experience} năm</td>
                    <td className="p-5">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-lg border font-bold text-[10px] tracking-wide uppercase ${
                          statusBadgeStyles[doc.status]
                        }`}
                      >
                        {doc.status}
                      </span>
                      {doc.status === "REJECTED" && doc.rejectedReason && (
                        <p className="text-[10px] text-red-400/70 mt-1 max-w-[150px] truncate" title={doc.rejectedReason}>
                          Lý do: {doc.rejectedReason}
                        </p>
                      )}
                    </td>
                    <td className="p-5">
                      {doc.isLocked ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                          <Lock className="h-3 w-3" /> Đã khóa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <Unlock className="h-3 w-3" /> Hoạt động
                        </span>
                      )}
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {doc.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => handleApprove(doc)}
                              disabled={submitting}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" /> Duyệt
                            </button>
                            <button
                              onClick={() => {
                                setRejectModalDoctor(doc);
                                setRejectReason("");
                              }}
                              disabled={submitting}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-50"
                            >
                              <XCircle className="h-3.5 w-3.5" /> Từ chối
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleToggleLock(doc)}
                          disabled={submitting}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all disabled:opacity-50 ${
                            doc.isLocked
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
                              : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
                          }`}
                        >
                          {doc.isLocked ? (
                            <>
                              <Unlock className="h-3.5 w-3.5" /> Mở khóa
                            </>
                          ) : (
                            <>
                              <Lock className="h-3.5 w-3.5" /> Khóa
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Reject Reason Modal */}
      {rejectModalDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                Từ chối Bác sĩ
              </h3>
              <button
                onClick={() => setRejectModalDoctor(null)}
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              Bác sĩ: <strong className="text-slate-200">{rejectModalDoctor.name}</strong>
            </p>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Lý do từ chối (tùy chọn)
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Nhập lý do từ chối..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm resize-none"
            />
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setRejectModalDoctor(null)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 bg-slate-900 border border-slate-800 hover:text-slate-100 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Xác nhận Từ chối
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">{confirmDialog.title}</h3>
            <p className="text-sm text-slate-400 mb-5">{confirmDialog.message}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 bg-slate-900 border border-slate-800 hover:text-slate-100 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors"
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
