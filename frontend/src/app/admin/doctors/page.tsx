"use client";

import React, { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { adminService } from "@/services/admin.service";
import { AdminDoctor, DoctorStatus } from "@/types/admin";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import DoctorDetailModal from "@/components/ui/DoctorDetailModal";
import RejectModal from "@/components/ui/RejectModal";
import {
  Search,
  Stethoscope,
  CheckCircle2,
  XCircle,
  Lock,
  Unlock,
  Eye,
  Clock,
  ShieldCheck,
  ShieldX,
  ShieldOff,
} from "lucide-react";

// ─── Tab Definitions ────────────────────────────────────────────────────────

type TabKey = "PENDING" | "APPROVED" | "REJECTED" | "LOCKED";

interface TabDef {
  key: TabKey;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabDef[] = [
  {
    key: "PENDING",
    label: "Chờ duyệt",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  {
    key: "APPROVED",
    label: "Đã duyệt",
    icon: <ShieldCheck className="h-3.5 w-3.5" />,
  },
  {
    key: "REJECTED",
    label: "Từ chối",
    icon: <ShieldX className="h-3.5 w-3.5" />,
  },
  {
    key: "LOCKED",
    label: "Bị khóa",
    icon: <ShieldOff className="h-3.5 w-3.5" />,
  },
];

// ─── Status Badge Styles ────────────────────────────────────────────────────

const statusBadge: Record<DoctorStatus, string> = {
  PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  APPROVED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  REJECTED: "bg-red-500/10 text-red-400 border-red-500/20",
};

const statusLabel: Record<DoctorStatus, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
};

// ─── Helpers ───────────────────────────────────────────────────────────────

function filterByTab(doctors: AdminDoctor[], tab: TabKey): AdminDoctor[] {
  switch (tab) {
    case "PENDING":
      return doctors.filter((d) => d.status === "PENDING");
    case "APPROVED":
      return doctors.filter((d) => d.status === "APPROVED" && !d.isLocked);
    case "REJECTED":
      return doctors.filter((d) => d.status === "REJECTED");
    case "LOCKED":
      return doctors.filter((d) => d.isLocked);
  }
}

function countTab(doctors: AdminDoctor[], tab: TabKey): number {
  return filterByTab(doctors, tab).length;
}

// ─── Doctor Card ────────────────────────────────────────────────────────────

interface DoctorCardProps {
  doctor: AdminDoctor;
  activeTab: TabKey;
  onView: (doctor: AdminDoctor) => void;
  onApprove: (doctor: AdminDoctor) => void;
  onRejectOpen: (doctor: AdminDoctor) => void;
  onLock: (doctor: AdminDoctor) => void;
  onUnlock: (doctor: AdminDoctor) => void;
  submitting: boolean;
}

function DoctorCard({
  doctor,
  activeTab,
  onView,
  onApprove,
  onRejectOpen,
  onLock,
  onUnlock,
  submitting,
}: DoctorCardProps) {
  return (
    <div className="relative bg-slate-900/70 border border-slate-800 rounded-2xl p-4 hover:border-teal-500/30 hover:bg-slate-900 transition-all group">
      {/* Status badge top-right */}
      <span
        className={`absolute top-4 right-4 inline-block px-2.5 py-0.5 rounded-lg border text-[10px] font-bold tracking-wide uppercase ${
          doctor.isLocked
            ? "bg-red-500/10 text-red-400 border-red-500/20"
            : statusBadge[doctor.status]
        }`}
      >
        {doctor.isLocked ? "Bị khóa" : statusLabel[doctor.status]}
      </span>

      {/* Avatar + Name */}
      <div className="flex items-start gap-3 mb-3 pr-20">
        <div className="h-12 w-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
          {doctor.avatar ? (
            <img
              src={doctor.avatar}
              alt={doctor.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <Stethoscope className="h-5 w-5 text-slate-500" />
          )}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-white text-base leading-tight truncate">
            {doctor.name}
          </p>
          <p className="text-teal-400 text-xs font-medium mt-0.5">
            {doctor.specialty.name}
          </p>
        </div>
      </div>

      {/* Info rows */}
      <div className="space-y-1.5 mb-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="text-slate-600">Kinh nghiệm:</span>
          <span className="text-slate-300 font-medium">{doctor.experience} năm</span>
          {doctor.hospital && (
            <>
              <span className="text-slate-700">·</span>
              <span className="truncate">{doctor.hospital}</span>
            </>
          )}
        </div>
        {doctor.price != null && (
          <div className="flex items-center gap-2">
            <span className="text-slate-600">Giá khám:</span>
            <span className="text-emerald-400 font-semibold">
              {doctor.price.toLocaleString("vi-VN")} đ
            </span>
          </div>
        )}
        {doctor.status === "REJECTED" && doctor.rejectedReason && (
          <div className="flex items-start gap-2">
            <span className="text-slate-600 shrink-0">Lý do:</span>
            <span className="text-red-400 italic truncate">{doctor.rejectedReason}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {/* View Profile — always shown */}
        <button
          onClick={() => onView(doctor)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:text-white transition-all"
        >
          <Eye className="h-3.5 w-3.5" />
          Xem hồ sơ
        </button>

        {/* PENDING actions */}
        {activeTab === "PENDING" && (
          <>
            <button
              onClick={() => onApprove(doctor)}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 transition-all"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Duyệt
            </button>
            <button
              onClick={() => onRejectOpen(doctor)}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-all"
            >
              <XCircle className="h-3.5 w-3.5" />
              Từ chối
            </button>
          </>
        )}

        {/* APPROVED actions */}
        {activeTab === "APPROVED" && (
          <button
            onClick={() => onLock(doctor)}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-orange-300 bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 disabled:opacity-50 transition-all"
          >
            <Lock className="h-3.5 w-3.5" />
            Khóa tài khoản
          </button>
        )}

        {/* REJECTED actions */}
        {activeTab === "REJECTED" && (
          <button
            onClick={() => onApprove(doctor)}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 transition-all"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Duyệt lại
          </button>
        )}

        {/* LOCKED actions */}
        {activeTab === "LOCKED" && (
          <button
            onClick={() => onUnlock(doctor)}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 disabled:opacity-50 transition-all"
          >
            <Unlock className="h-3.5 w-3.5" />
            Mở khóa
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<AdminDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("PENDING");

  // Detail modal
  const [detailDoctor, setDetailDoctor] = useState<AdminDoctor | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Reject modal
  const [rejectDoctor, setRejectDoctor] = useState<AdminDoctor | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);

  // ─── Load doctors ────────────────────────────────────────────────────────

  const loadDoctors = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminService.getDoctors();
      setDoctors(res.data);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Không thể tải danh sách bác sĩ.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  // ─── Filtered list ───────────────────────────────────────────────────────

  const tabDoctors = filterByTab(doctors, activeTab);

  const filteredDoctors = tabDoctors.filter((doc) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      doc.name.toLowerCase().includes(q) ||
      doc.specialty.name.toLowerCase().includes(q) ||
      (doc.hospital && doc.hospital.toLowerCase().includes(q))
    );
  });

  // ─── Actions ─────────────────────────────────────────────────────────────

  const handleApprove = useCallback(
    async (doctor: AdminDoctor) => {
      setSubmitting(true);
      const toastId = toast.loading(`Đang duyệt bác sĩ ${doctor.name}...`);
      try {
        await adminService.approveDoctor(doctor.id);
        toast.success(`Đã duyệt bác sĩ "${doctor.name}" thành công!`, { id: toastId });
        // Close detail modal if open for this doctor
        if (detailDoctor?.id === doctor.id) {
          setDetailOpen(false);
          setDetailDoctor(null);
        }
        loadDoctors();
      } catch (err: unknown) {
        const msg =
          err && typeof err === "object" && "message" in err
            ? String((err as { message: unknown }).message)
            : "Không thể duyệt bác sĩ này.";
        toast.error(msg, { id: toastId });
      } finally {
        setSubmitting(false);
      }
    },
    [loadDoctors, detailDoctor]
  );

  const handleRejectConfirm = useCallback(
    async (reason: string) => {
      if (!rejectDoctor) return;
      setSubmitting(true);
      const toastId = toast.loading(`Đang từ chối bác sĩ ${rejectDoctor.name}...`);
      try {
        await adminService.rejectDoctor(rejectDoctor.id, reason);
        toast.success(`Đã từ chối hồ sơ bác sĩ "${rejectDoctor.name}".`, { id: toastId });
        setRejectOpen(false);
        setRejectDoctor(null);
        if (detailDoctor?.id === rejectDoctor.id) {
          setDetailOpen(false);
          setDetailDoctor(null);
        }
        loadDoctors();
      } catch (err: unknown) {
        const msg =
          err && typeof err === "object" && "message" in err
            ? String((err as { message: unknown }).message)
            : "Không thể từ chối bác sĩ này.";
        toast.error(msg, { id: toastId });
      } finally {
        setSubmitting(false);
      }
    },
    [rejectDoctor, detailDoctor, loadDoctors]
  );

  const handleLock = useCallback(
    async (doctor: AdminDoctor) => {
      setSubmitting(true);
      const toastId = toast.loading(`Đang khóa tài khoản ${doctor.name}...`);
      try {
        await adminService.lockDoctor(doctor.id);
        toast.success(`Đã khóa tài khoản bác sĩ "${doctor.name}".`, { id: toastId });
        loadDoctors();
      } catch (err: unknown) {
        const msg =
          err && typeof err === "object" && "message" in err
            ? String((err as { message: unknown }).message)
            : "Không thể khóa tài khoản bác sĩ này.";
        toast.error(msg, { id: toastId });
      } finally {
        setSubmitting(false);
      }
    },
    [loadDoctors]
  );

  const handleUnlock = useCallback(
    async (doctor: AdminDoctor) => {
      setSubmitting(true);
      const toastId = toast.loading(`Đang mở khóa tài khoản ${doctor.name}...`);
      try {
        await adminService.lockDoctor(doctor.id); // backend toggles lock/unlock automatically
        toast.success(`Đã mở khóa tài khoản bác sĩ "${doctor.name}".`, { id: toastId });
        loadDoctors();
      } catch (err: unknown) {
        const msg =
          err && typeof err === "object" && "message" in err
            ? String((err as { message: unknown }).message)
            : "Không thể mở khóa tài khoản bác sĩ này.";
        toast.error(msg, { id: toastId });
      } finally {
        setSubmitting(false);
      }
    },
    [loadDoctors]
  );

  // Modal helpers
  const openDetail = (doctor: AdminDoctor) => {
    setDetailDoctor(doctor);
    setDetailOpen(true);
  };

  const openReject = (doctor: AdminDoctor) => {
    setRejectDoctor(doctor);
    setRejectOpen(true);
  };

  // ─── Render ───────────────────────────────────────────────────────────────

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

      {/* Tabs + Search */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => {
            const count = countTab(doctors, tab.key);
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                id={`tab-${tab.key.toLowerCase()}`}
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  isActive
                    ? "bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20"
                    : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-100 hover:border-slate-700"
                }`}
              >
                {tab.icon}
                {tab.label}
                <span
                  className={`inline-flex items-center justify-center h-4 min-w-[1rem] px-1 rounded-full text-[10px] font-black ${
                    isActive
                      ? "bg-slate-950/30 text-slate-950"
                      : count > 0
                      ? "bg-teal-500/10 text-teal-400"
                      : "bg-slate-800 text-slate-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            id="doctor-search"
            placeholder="Tìm theo tên bác sĩ, chuyên khoa, bệnh viện..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm"
          />
        </div>
      </div>

      {/* Doctor Card Grid */}
      <div>
        {filteredDoctors.length === 0 ? (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl text-center py-20 text-slate-500 text-sm font-medium">
            <Stethoscope className="h-10 w-10 mx-auto mb-3 text-slate-700" />
            Không tìm thấy bác sĩ nào phù hợp.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDoctors.map((doc) => (
              <DoctorCard
                key={doc.id}
                doctor={doc}
                activeTab={activeTab}
                onView={openDetail}
                onApprove={handleApprove}
                onRejectOpen={openReject}
                onLock={handleLock}
                onUnlock={handleUnlock}
                submitting={submitting}
              />
            ))}
          </div>
        )}
      </div>

      {/* Doctor Detail Modal */}
      <DoctorDetailModal
        doctor={detailDoctor}
        isOpen={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setDetailDoctor(null);
        }}
        onApprove={(id) => {
          const doc = doctors.find((d) => d.id === id);
          if (doc) handleApprove(doc);
        }}
        onReject={(id) => {
          const doc = doctors.find((d) => d.id === id);
          if (doc) {
            setDetailOpen(false);
            openReject(doc);
          }
        }}
        isSubmitting={submitting}
      />

      {/* Reject Modal */}
      <RejectModal
        isOpen={rejectOpen}
        doctorName={rejectDoctor?.name ?? ""}
        onConfirm={handleRejectConfirm}
        onClose={() => {
          setRejectOpen(false);
          setRejectDoctor(null);
        }}
        isSubmitting={submitting}
      />
    </div>
  );
}
