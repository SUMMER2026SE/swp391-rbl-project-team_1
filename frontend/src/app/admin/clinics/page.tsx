"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import { adminService } from "@/services/admin.service";
import { AdminClinic } from "@/types/admin";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Pagination from "@/components/common/Pagination";
import ClinicFormModal from "@/components/ui/ClinicFormModal";
import ManageDoctorsModal from "@/components/ui/ManageDoctorsModal";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Building2,
  MapPin,
  Users,
  Loader2,
  X,
  AlertTriangle,
} from "lucide-react";

const ITEMS_PER_PAGE = 9;

// ─── Delete Confirm Modal ────────────────────────────────────────────────────

function DeleteConfirmModal({
  clinic,
  onConfirm,
  onClose,
  submitting,
}: {
  clinic: AdminClinic;
  onConfirm: () => void;
  onClose: () => void;
  submitting: boolean;
}) {
  const hasDoctors = clinic.doctors && clinic.doctors.length > 0;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl shadow-black/50">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            Xóa Cơ sở Y tế
          </h3>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">
          <p className="text-sm text-slate-400 mb-2">
            Bạn có chắc chắn muốn xóa cơ sở{" "}
            <strong className="text-slate-100">&quot;{clinic.name}&quot;</strong>?
          </p>
          {hasDoctors && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
              <strong>Lưu ý:</strong> Cơ sở này đang có {clinic.doctors.length} bác sĩ liên kết.
              Vui lòng xóa hoặc chuyển bác sĩ trước khi xóa cơ sở.
            </div>
          )}
        </div>
        <div className="p-5 border-t border-slate-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 bg-slate-900 border border-slate-800 hover:text-slate-100 hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang xóa...
              </>
            ) : (
              "Xác nhận Xóa"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Clinic Card ─────────────────────────────────────────────────────────────

function ClinicCard({
  clinic,
  onEdit,
  onManageDoctors,
  onDelete,
}: {
  clinic: AdminClinic;
  onEdit: (c: AdminClinic) => void;
  onManageDoctors: (c: AdminClinic) => void;
  onDelete: (c: AdminClinic) => void;
}) {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden hover:border-teal-500/30 hover:shadow-lg hover:shadow-teal-500/5 transition-all group">
      {/* Thumbnail */}
      <div className="h-40 bg-slate-900 flex items-center justify-center overflow-hidden relative">
        {clinic.image ? (
          <img
            src={clinic.image}
            alt={clinic.name}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <Building2 className="h-12 w-12 text-slate-700" />
        )}
        {/* Doctor count badge */}
        <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-sm text-[10px] font-bold text-slate-300 border border-slate-800/60">
          <Users className="h-3 w-3 text-teal-400" />
          {clinic.doctors ? clinic.doctors.length : 0} bác sĩ
        </span>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-white text-sm leading-tight line-clamp-2">
            {clinic.name}
          </h3>
          <div className="flex items-start gap-1.5 text-xs text-slate-500 mt-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-slate-600" />
            <span className="line-clamp-2">{clinic.address}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60">
          <button
            onClick={() => onEdit(clinic)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-800 hover:bg-teal-500/10 hover:border-teal-500/20 hover:text-teal-400 transition-all"
            title="Chỉnh sửa"
          >
            <Pencil className="h-3.5 w-3.5" />
            Sửa
          </button>
          <button
            onClick={() => onManageDoctors(clinic)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-800 hover:bg-blue-500/10 hover:border-blue-500/20 hover:text-blue-400 transition-all"
            title="Quản lý bác sĩ"
          >
            <Users className="h-3.5 w-3.5" />
            Bác sĩ
          </button>
          <button
            onClick={() => onDelete(clinic)}
            className="p-2 rounded-lg text-slate-500 bg-slate-900 border border-slate-800 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-all"
            title="Xóa cơ sở"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AdminClinicsPage() {
  const [clinics, setClinics] = useState<AdminClinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Search + pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [totalClinics, setTotalClinics] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [formModal, setFormModal] = useState<{ open: boolean; clinic: AdminClinic | null }>({
    open: false,
    clinic: null,
  });
  const [manageModal, setManageModal] = useState<{ open: boolean; clinic: AdminClinic | null }>({
    open: false,
    clinic: null,
  });
  const [deleteTarget, setDeleteTarget] = useState<AdminClinic | null>(null);

  // ─── Load ────────────────────────────────────────────────────────────────

  const loadClinics = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminService.getClinics(debouncedSearch, currentPage, ITEMS_PER_PAGE);
      setClinics(res.data);
      setTotalClinics(res.total);
      setTotalPages(res.totalPages);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Không thể tải danh sách cơ sở y tế.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClinics();
  }, [loadClinics, debouncedSearch, currentPage]);

  // ─── Debounce search ──────────────────────────────────────────────────────

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  // ─── Delete ───────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    const toastId = toast.loading(`Đang xóa "${deleteTarget.name}"...`);
    try {
      await adminService.deleteClinic(deleteTarget.id);
      toast.success(`Đã xóa cơ sở "${deleteTarget.name}".`, { id: toastId });
      setDeleteTarget(null);
      loadClinics();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Không thể xóa cơ sở y tế này.";
      toast.error(msg, { id: toastId });
    } finally {
      setDeletingId(null);
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-white">Quản lý Cơ sở Y tế</h1>
          <p className="text-sm text-slate-400">
            Thêm, sửa, xóa cơ sở y tế và quản lý danh sách bác sĩ.
          </p>
        </div>
        <button
          id="btn-add-clinic"
          onClick={() => setFormModal({ open: true, clinic: null })}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Thêm cơ sở
        </button>
      </div>

      {/* Search + stats */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
          <input
            id="clinic-search"
            type="text"
            placeholder="Tìm theo tên hoặc địa chỉ cơ sở..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm"
          />
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            Tổng cộng:{" "}
            <span className="text-teal-400 font-semibold">{totalClinics}</span> cơ sở
          </span>
        </div>
      </div>

      {/* Clinic Grid */}
      <div id="clinic-grid">
        {clinics.length === 0 ? (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl text-center py-20 text-slate-500 text-sm font-medium">
            <Building2 className="h-10 w-10 mx-auto mb-3 text-slate-700" />
            {debouncedSearch
              ? "Không tìm thấy cơ sở nào phù hợp."
              : "Chưa có cơ sở y tế nào trong hệ thống."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {clinics.map((clinic) => (
              <ClinicCard
                key={clinic.id}
                clinic={clinic}
                onEdit={(c) => setFormModal({ open: true, clinic: c })}
                onManageDoctors={(c) => setManageModal({ open: true, clinic: c })}
                onDelete={(c) => setDeleteTarget(c)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        scrollTargetId="clinic-grid"
      />

      {/* ─── Clinic Form Modal (Add/Edit) ─── */}
      <ClinicFormModal
        isOpen={formModal.open}
        clinic={formModal.clinic}
        onClose={() => setFormModal({ open: false, clinic: null })}
        onSave={loadClinics}
      />

      {/* ─── Manage Doctors Modal ─── */}
      <ManageDoctorsModal
        isOpen={manageModal.open}
        clinic={manageModal.clinic}
        onClose={() => setManageModal({ open: false, clinic: null })}
      />

      {/* ─── Delete Confirm Modal ─── */}
      {deleteTarget && (
        <DeleteConfirmModal
          clinic={deleteTarget}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          submitting={deletingId === deleteTarget.id}
        />
      )}
    </div>
  );
}
