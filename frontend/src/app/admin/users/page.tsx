"use client";

import React, { useEffect, useState, useMemo } from "react";
import { adminService } from "@/services/admin.service";
import { doctorService } from "@/services/doctor.service";
import { useAuth } from "@/hooks/useAuth";
import { AdminUser } from "@/types/admin";
import { Doctor } from "@/types/doctor";
import { UserRole } from "@/types/auth";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import {
  Search, Users, Stethoscope, ShieldAlert, UserPlus,
  Lock, Unlock, Trash2, Eye, X, ChevronLeft, ChevronRight,
  Download, Calendar, SortAsc, SortDesc, UserCircle2, Phone,
  Mail, MapPin, Clock, Activity, ShieldCheck, AlertTriangle,
  CheckCircle2, Link as LinkIcon, CalendarDays
} from "lucide-react";

// ── Extended user type to hold extra display fields ──────────────
interface ExtendedUser extends AdminUser {
  fullName?: string;
  phoneNumber?: string;
  avatar?: string;
  dateOfBirth?: string;
  address?: string;
  lastLoginAt?: string;
  appointmentCount?: number;
  status?: "ACTIVE" | "BANNED" | "PENDING";
}

// ── Confirm Dialog Component ──────────────────────────────────────
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  consequence?: string;
  confirmLabel: string;
  confirmVariant?: "red" | "orange" | "teal";
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

function ConfirmDialog({
  open, title, description, consequence, confirmLabel,
  confirmVariant = "red", onConfirm, onCancel, loading
}: ConfirmDialogProps) {
  if (!open) return null;
  const variantCls = {
    red: "bg-red-600 hover:bg-red-500 text-white",
    orange: "bg-orange-600 hover:bg-orange-500 text-white",
    teal: "bg-teal-600 hover:bg-teal-500 text-white",
  }[confirmVariant];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-start gap-4">
          <div className={`p-2.5 rounded-xl shrink-0 ${confirmVariant === "red" ? "bg-red-500/10" : confirmVariant === "orange" ? "bg-orange-500/10" : "bg-teal-500/10"}`}>
            <AlertTriangle className={`h-6 w-6 ${confirmVariant === "red" ? "text-red-400" : confirmVariant === "orange" ? "text-orange-400" : "text-teal-400"}`} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">{title}</h3>
            <p className="text-sm text-slate-400 mt-1 leading-relaxed">{description}</p>
            {consequence && (
              <p className="text-xs text-red-400/90 mt-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 leading-relaxed">
                ⚠️ {consequence}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-all"
          >
            Hủy bỏ
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all disabled:opacity-50 ${variantCls}`}
          >
            {loading ? "Đang xử lý..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | number | null }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-800/60 last:border-0">
      <div className="p-1.5 rounded-lg bg-slate-800 shrink-0 mt-0.5">
        <Icon className="h-3.5 w-3.5 text-slate-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
        <p className="text-sm text-slate-200 font-medium mt-0.5 break-words">{value || "—"}</p>
      </div>
    </div>
  );
}

// ── User Detail Modal ─────────────────────────────────────────────
interface UserDetailModalProps {
  user: ExtendedUser | null;
  doctors: Doctor[];
  onClose: () => void;
}

function UserDetailModal({ user, doctors, onClose }: UserDetailModalProps) {
  if (!user) return null;

  const linkedDoctor = user.doctorId ? doctors.find(d => d.id === user.doctorId) : null;

  const roleConfig = {
    USER:   { label: "Người bệnh", cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    DOCTOR: { label: "Bác sĩ",    cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    ADMIN:  { label: "Quản trị",  cls: "bg-red-500/10 text-red-400 border-red-500/20" },
  };

  const statusConfig = {
    ACTIVE:  { label: "Hoạt động",   cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    BANNED:  { label: "Bị khóa",     cls: "bg-red-500/10 text-red-400 border-red-500/20" },
    PENDING: { label: "Chờ duyệt",   cls: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  };

  const derivedStatus: "ACTIVE" | "BANNED" | "PENDING" = user.isLocked ? "BANNED" : (user.status || "ACTIVE");


  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Eye className="h-4 w-4 text-teal-400" /> Chi tiết thành viên
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Avatar + Name */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-black shrink-0 overflow-hidden">
              {user.avatar
                ? <img src={user.avatar} alt={user.fullName || user.email} className="w-full h-full object-cover" />
                : (user.fullName?.[0] || user.email?.[0] || "U").toUpperCase()
              }
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{user.fullName || "Chưa cập nhật"}</h3>
              <p className="text-sm text-slate-400">{user.email}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wide ${roleConfig[user.role].cls}`}>
                  {roleConfig[user.role].label}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wide ${statusConfig[derivedStatus].cls}`}>
                  {statusConfig[derivedStatus].label}
                </span>
              </div>
            </div>
          </div>

          {/* Info Grid */}
          <div className="bg-slate-800/30 rounded-xl border border-slate-800 p-1 divide-y divide-slate-800/60">
            <InfoRow icon={Mail} label="Email" value={user.email} />
            <InfoRow icon={Phone} label="Số điện thoại" value={user.phoneNumber} />
            <InfoRow icon={CalendarDays} label="Ngày sinh" value={
              user.dateOfBirth
                ? new Date(user.dateOfBirth).toLocaleDateString("vi-VN")
                : undefined
            } />
            <InfoRow icon={MapPin} label="Địa chỉ" value={user.address} />
            <InfoRow icon={Calendar} label="Ngày tạo tài khoản" value={
              new Date(user.createdAt).toLocaleDateString("vi-VN", {
                day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
              })
            } />
            <InfoRow icon={Clock} label="Lần đăng nhập cuối" value={
              user.lastLoginAt
                ? new Date(user.lastLoginAt).toLocaleDateString("vi-VN", {
                    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
                  })
                : "Chưa có thông tin"
            } />
          </div>

          {/* Role-specific info */}
          {user.role === "USER" && (
            <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-4">
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Activity className="h-3 w-3" /> Lịch sử đặt lịch
              </p>
              <p className="text-2xl font-black text-white">
                {user.appointmentCount ?? "—"}
                <span className="text-sm font-normal text-slate-400 ml-1">lịch hẹn</span>
              </p>
            </div>
          )}

          {user.role === "DOCTOR" && (
            <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-4">
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Stethoscope className="h-3 w-3" /> Hồ sơ bác sĩ liên kết
              </p>
              {linkedDoctor ? (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 overflow-hidden shrink-0">
                    {linkedDoctor.avatar
                      ? <img src={linkedDoctor.avatar} alt={linkedDoctor.name} className="w-full h-full object-cover" />
                      : <Stethoscope className="h-4 w-4 text-emerald-400 m-auto mt-2.5" />
                    }
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{linkedDoctor.name}</p>
                    <p className="text-xs text-slate-400">{(linkedDoctor as any).specialty?.name || "Không rõ chuyên khoa"}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">Chưa liên kết hồ sơ bác sĩ</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── KPI Card Component ────────────────────────────────────────────
interface KPICardProps {
  icon: any; label: string; value: number | string;
  sub?: string; color: string; iconBg: string;
}

function KPICard({ icon: Icon, label, value, sub, color, iconBg }: KPICardProps) {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex items-center gap-4 hover:border-slate-700 transition-all">
      <div className={`p-3 rounded-xl shrink-0 ${iconBg}`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-500 font-semibold">{label}</p>
        <p className={`text-2xl font-black mt-0.5 ${color}`}>{value}</p>
        {sub && <p className="text-[10px] text-slate-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────
const PAGE_SIZE = 20;

export default function AdminUsersPage() {
  const { user: currentAdmin } = useAuth();

  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [submittingAction, setSubmittingAction] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole | "ALL">("ALL");
  const [selectedStatus, setSelectedStatus] = useState<"ALL" | "ACTIVE" | "BANNED">("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [detailUser, setDetailUser] = useState<ExtendedUser | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    consequence?: string;
    confirmLabel: string;
    confirmVariant?: "red" | "orange" | "teal";
    onConfirm: () => void;
  }>({ open: false, title: "", description: "", confirmLabel: "", onConfirm: () => {} });

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const [usersRes, doctorsRes] = await Promise.all([
        adminService.getUsers(),
        doctorService.listDoctors(),
      ]);
      setUsers(usersRes.data as ExtendedUser[]);
      setDoctors(doctorsRes.doctors);
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "message" in err
        ? String((err as { message: unknown }).message)
        : "Không thể tải danh sách tài khoản.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);
  useEffect(() => { setCurrentPage(1); }, [searchQuery, selectedRole, selectedStatus, dateFrom, dateTo, sortOrder]);

  // ── KPI stats ─────────────────────────────────────────────────
  const kpi = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return {
      total: users.length,
      doctors: users.filter(u => u.role === "DOCTOR").length,
      locked: users.filter(u => u.isLocked).length,
      newLast7: users.filter(u => new Date(u.createdAt) >= sevenDaysAgo).length,
    };
  }, [users]);

  // ── Filtered & sorted list ────────────────────────────────────
  const filteredUsers = useMemo(() => {
    let result = [...users];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(u =>
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.fullName && u.fullName.toLowerCase().includes(q))
      );
    }
    if (selectedRole !== "ALL") result = result.filter(u => u.role === selectedRole);
    if (selectedStatus === "ACTIVE") result = result.filter(u => !u.isLocked);
    if (selectedStatus === "BANNED") result = result.filter(u => u.isLocked);
    if (dateFrom) result = result.filter(u => new Date(u.createdAt) >= new Date(dateFrom));
    if (dateTo) result = result.filter(u => new Date(u.createdAt) <= new Date(dateTo + "T23:59:59"));

    result.sort((a, b) => {
      const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return sortOrder === "newest" ? diff : -diff;
    });

    return result;
  }, [users, searchQuery, selectedRole, selectedStatus, dateFrom, dateTo, sortOrder]);

  // ── Pagination ────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const rangeStart = filteredUsers.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filteredUsers.length);

  // ── CSV Export ───────────────────────────────────────────────
  const handleExportCSV = () => {
    const headers = ["ID", "Email", "Họ tên", "SĐT", "Vai trò", "Trạng thái", "Ngày tạo", "Đăng nhập cuối"];
    const rows = filteredUsers.map(u => [
      u.id,
      u.email,
      u.fullName || "",
      u.phoneNumber || "",
      u.role,
      u.isLocked ? "BANNED" : "ACTIVE",
      new Date(u.createdAt).toLocaleDateString("vi-VN"),
      u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString("vi-VN") : "",
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Actions ───────────────────────────────────────────────────
  const openLockConfirm = (u: ExtendedUser) => {
    const isLocking = !u.isLocked;
    setConfirmDialog({
      open: true,
      title: isLocking ? "Khóa tài khoản?" : "Mở khóa tài khoản?",
      description: isLocking
        ? `Bạn sắp khóa tài khoản "${u.email}". Người dùng này sẽ không thể đăng nhập cho đến khi được mở khóa.`
        : `Bạn sắp mở khóa tài khoản "${u.email}". Người dùng sẽ có thể đăng nhập và sử dụng dịch vụ trở lại.`,
      consequence: isLocking ? "Mọi phiên đăng nhập hiện tại của người dùng sẽ bị vô hiệu hóa ngay lập tức." : undefined,
      confirmLabel: isLocking ? "Khóa tài khoản" : "Mở khóa",
      confirmVariant: isLocking ? "orange" : "teal",
      onConfirm: async () => {
        setSubmittingAction(true);
        try {
          await adminService.lockUser(u.id, isLocking);
          setActionMessage({ type: "success", text: `Đã ${isLocking ? "khóa" : "mở khóa"} tài khoản thành công!` });
          loadData();
        } catch (err: unknown) {
          const msg = err && typeof err === "object" && "message" in err ? String((err as any).message) : "Thao tác thất bại.";
          setActionMessage({ type: "error", text: msg });
        } finally {
          setSubmittingAction(false);
          setConfirmDialog(prev => ({ ...prev, open: false }));
        }
      },
    });
  };

  const openDeleteConfirm = (u: ExtendedUser) => {
    setConfirmDialog({
      open: true,
      title: "Xóa tài khoản vĩnh viễn?",
      description: `Bạn sắp xóa tài khoản "${u.email}" (${u.fullName || "Chưa có tên"}). Hành động này không thể hoàn tác.`,
      consequence: "Tất cả lịch hẹn, hồ sơ bệnh nhân và lịch sử giao dịch liên quan sẽ bị xóa vĩnh viễn.",
      confirmLabel: "Xóa vĩnh viễn",
      confirmVariant: "red",
      onConfirm: async () => {
        setSubmittingAction(true);
        try {
          await adminService.deleteUser(u.id);
          setActionMessage({ type: "success", text: "Đã xóa tài khoản và toàn bộ dữ liệu liên quan thành công!" });
          loadData();
        } catch (err: unknown) {
          const msg = err && typeof err === "object" && "message" in err ? String((err as any).message) : "Không thể xóa tài khoản.";
          setActionMessage({ type: "error", text: msg });
        } finally {
          setSubmittingAction(false);
          setConfirmDialog(prev => ({ ...prev, open: false }));
        }
      },
    });
  };

  // ── Role/Status styling ───────────────────────────────────────
  const roleConfig: Record<string, { label: string; cls: string }> = {
    USER:   { label: "Người bệnh", cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    DOCTOR: { label: "Bác sĩ",    cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    ADMIN:  { label: "Quản trị",  cls: "bg-red-500/10 text-red-400 border-red-500/20" },
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <LoadingSpinner className="h-10 w-10 text-teal-400" />
      </div>
    );
  }

  return (
    <>
      {/* Modals */}
      <UserDetailModal user={detailUser} doctors={doctors} onClose={() => setDetailUser(null)} />
      <ConfirmDialog
        {...confirmDialog}
        loading={submittingAction}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
      />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-white">Quản lý Thành viên</h1>
            <p className="text-sm text-slate-400">Quản lý tài khoản, vai trò và trạng thái thành viên hệ thống.</p>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white rounded-xl text-sm font-semibold transition-all"
          >
            <Download className="h-4 w-4" />
            Xuất CSV
          </button>
        </div>

        {/* Alerts */}
        {error && <Alert type="error" message={error} className="bg-red-950/40 border-red-900/50 text-red-300" />}
        {actionMessage && (
          <Alert type={actionMessage.type} message={actionMessage.text} className="my-2" />
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            icon={Users} label="Tổng thành viên" value={kpi.total}
            sub="Tất cả tài khoản"
            color="text-teal-400" iconBg="bg-teal-500/10"
          />
          <KPICard
            icon={Stethoscope} label="Tổng bác sĩ" value={kpi.doctors}
            sub="Tài khoản DOCTOR"
            color="text-indigo-400" iconBg="bg-indigo-500/10"
          />
          <KPICard
            icon={ShieldAlert} label="Tài khoản bị khóa" value={kpi.locked}
            sub="Đang bị vô hiệu hóa"
            color="text-red-400" iconBg="bg-red-500/10"
          />
          <KPICard
            icon={UserPlus} label="Mới trong 7 ngày" value={kpi.newLast7}
            sub="Thành viên đăng ký mới"
            color="text-amber-400" iconBg="bg-amber-500/10"
          />
        </div>

        {/* Filters */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search */}
            <div className="md:col-span-4 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Tìm theo email hoặc họ tên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm"
              />
            </div>

            {/* Role filter */}
            <div className="md:col-span-2">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole | "ALL")}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm cursor-pointer"
              >
                <option value="ALL">Tất cả vai trò</option>
                <option value="USER">Người bệnh</option>
                <option value="DOCTOR">Bác sĩ</option>
                <option value="ADMIN">Quản trị</option>
              </select>
            </div>

            {/* Status filter */}
            <div className="md:col-span-2">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as "ALL" | "ACTIVE" | "BANNED")}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm cursor-pointer"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="ACTIVE">Hoạt động</option>
                <option value="BANNED">Bị khóa</option>
              </select>
            </div>

            {/* Date from */}
            <div className="md:col-span-2">
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm"
                title="Từ ngày"
              />
            </div>

            {/* Date to */}
            <div className="md:col-span-2">
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm"
                title="Đến ngày"
              />
            </div>
          </div>

          {/* Sort + result count */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs text-slate-500">
              Hiển thị <span className="text-white font-semibold">{rangeStart}–{rangeEnd}</span> trong tổng{" "}
              <span className="text-white font-semibold">{filteredUsers.length}</span> thành viên
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Sắp xếp:</span>
              <button
                onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
              >
                {sortOrder === "newest"
                  ? <><SortDesc className="h-3.5 w-3.5" /> Mới nhất</>
                  : <><SortAsc className="h-3.5 w-3.5" /> Cũ nhất</>
                }
              </button>
              {(searchQuery || selectedRole !== "ALL" || selectedStatus !== "ALL" || dateFrom || dateTo) && (
                <button
                  onClick={() => { setSearchQuery(""); setSelectedRole("ALL"); setSelectedStatus("ALL"); setDateFrom(""); setDateTo(""); }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 text-slate-400 text-xs font-semibold transition-all"
                >
                  <X className="h-3.5 w-3.5" /> Xóa bộ lọc
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            {paginatedUsers.length === 0 ? (
              <div className="text-center py-20 text-slate-500 text-sm font-medium">
                <UserCircle2 className="h-12 w-12 text-slate-700 mx-auto mb-3" />
                Không tìm thấy thành viên phù hợp với bộ lọc.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/50 text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                    <th className="px-5 py-3.5 font-semibold">Thành viên</th>
                    <th className="px-5 py-3.5 font-semibold">Email</th>
                    <th className="px-5 py-3.5 font-semibold">SĐT</th>
                    <th className="px-5 py-3.5 font-semibold">Vai trò</th>
                    <th className="px-5 py-3.5 font-semibold">Trạng thái</th>
                    <th className="px-5 py-3.5 font-semibold">Ngày tạo</th>
                    <th className="px-5 py-3.5 font-semibold">Đăng nhập cuối</th>
                    <th className="px-5 py-3.5 font-semibold text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-slate-900">
                  {paginatedUsers.map((u) => {
                    const isMe = currentAdmin?.id === u.id;
                    const isProtected = isMe || u.role === "ADMIN";
                    const derivedStatus = u.isLocked ? "BANNED" : "ACTIVE";

                    return (
                      <tr key={u.id} className="hover:bg-slate-900/40 transition-colors group">
                        {/* Avatar + Name */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden">
                              {u.avatar
                                ? <img src={u.avatar} alt={u.fullName || u.email} className="w-full h-full object-cover" />
                                : (u.fullName?.[0] || u.email?.[0] || "U").toUpperCase()
                              }
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-200 truncate max-w-[130px]">
                                {u.fullName || <span className="text-slate-500 italic">Chưa cập nhật</span>}
                              </p>
                              {isMe && (
                                <span className="text-[9px] uppercase tracking-wide font-black px-1.5 py-0.5 rounded bg-teal-500 text-slate-950">
                                  Bạn
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-5 py-3.5 text-slate-400 font-medium max-w-[160px]">
                          <span className="truncate block">{u.email}</span>
                        </td>

                        {/* Phone */}
                        <td className="px-5 py-3.5 text-slate-400">
                          {u.phoneNumber || <span className="text-slate-600 italic">—</span>}
                        </td>

                        {/* Role badge */}
                        <td className="px-5 py-3.5">
                          <span className={`px-2.5 py-1 rounded-lg border font-bold text-[10px] tracking-wide uppercase ${roleConfig[u.role]?.cls || ""}`}>
                            {roleConfig[u.role]?.label || u.role}
                          </span>
                        </td>

                        {/* Status badge */}
                        <td className="px-5 py-3.5">
                          {derivedStatus === "ACTIVE" ? (
                            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Hoạt động
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-red-400 font-semibold">
                              <ShieldAlert className="h-3.5 w-3.5" /> Bị khóa
                            </span>
                          )}
                        </td>

                        {/* Created at */}
                        <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                          {new Date(u.createdAt).toLocaleDateString("vi-VN", {
                            day: "2-digit", month: "2-digit", year: "numeric"
                          })}
                        </td>

                        {/* Last login */}
                        <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                          {u.lastLoginAt
                            ? new Date(u.lastLoginAt).toLocaleDateString("vi-VN", {
                                day: "2-digit", month: "2-digit", year: "numeric"
                              })
                            : <span className="italic text-slate-700">Chưa có</span>
                          }
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View detail */}
                            <button
                              onClick={() => setDetailUser(u)}
                              className="p-2 rounded-lg bg-slate-900 hover:bg-teal-500/10 border border-slate-800 hover:border-teal-500/20 text-slate-400 hover:text-teal-400 transition-all"
                              title="Xem chi tiết"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>

                            {!isProtected ? (
                              <>
                                {/* Lock / Unlock */}
                                <button
                                  onClick={() => openLockConfirm(u)}
                                  disabled={submittingAction}
                                  className={`p-2 rounded-lg border transition-all ${u.isLocked
                                    ? "bg-slate-900 hover:bg-emerald-500/10 border-slate-800 hover:border-emerald-500/20 text-slate-400 hover:text-emerald-400"
                                    : "bg-slate-900 hover:bg-orange-500/10 border-slate-800 hover:border-orange-500/20 text-slate-400 hover:text-orange-400"
                                  }`}
                                  title={u.isLocked ? "Mở khóa tài khoản" : "Khóa tài khoản"}
                                >
                                  {u.isLocked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                                </button>

                                {/* Delete */}
                                <button
                                  onClick={() => openDeleteConfirm(u)}
                                  disabled={submittingAction}
                                  className="p-2 rounded-lg bg-slate-900 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/20 text-slate-400 hover:text-red-400 transition-all"
                                  title="Xóa tài khoản"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </>
                            ) : (
                              <span className="text-[9px] text-slate-600 italic px-2">Bảo vệ</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {filteredUsers.length > PAGE_SIZE && (
            <div className="flex items-center justify-between gap-4 px-5 py-4 border-t border-slate-800 bg-slate-900/30">
              <p className="text-xs text-slate-500">
                Hiển thị <span className="text-white font-semibold">{rangeStart}–{rangeEnd}</span> trong tổng{" "}
                <span className="text-white font-semibold">{filteredUsers.length}</span> thành viên
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === "..." ? (
                      <span key={`dot-${idx}`} className="px-2 text-slate-600 text-sm">…</span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => setCurrentPage(item as number)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold border transition-all ${
                          currentPage === item
                            ? "bg-teal-600 border-teal-600 text-white"
                            : "border-slate-700 bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                        }`}
                      >
                        {item}
                      </button>
                    )
                  )
                }

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
