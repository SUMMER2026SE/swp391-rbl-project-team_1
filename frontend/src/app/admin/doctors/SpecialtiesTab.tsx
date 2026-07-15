"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { adminService } from "@/services/admin.service";
import { AdminSpecialty, CreateSpecialtyPayload, UpdateSpecialtyPayload } from "@/types/admin";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";
import {
  Search, Plus, Pencil, Trash2, BookOpen, X, Eye, EyeOff,
  CheckCircle2, AlertTriangle, Image as ImageIcon, Users,
  Clock, Hash, AlignLeft, Stethoscope, ChevronUp, ChevronDown
} from "lucide-react";

// ── Slug helper ───────────────────────────────────────────────────
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

// ── Extended specialty with local-only fields ─────────────────────
interface ExtendedSpecialty extends AdminSpecialty {
  isActive?: boolean;
  displayOrder?: number;
  thumbnail?: string;
}

// ── Form data ─────────────────────────────────────────────────────
interface SpecialtyFormData {
  name: string;
  slug: string;
  description: string;
  icon: string;
  isActive: boolean;
  displayOrder: number;
  thumbnailPreview: string;
  thumbnailFile: File | null;
}

const emptyForm: SpecialtyFormData = {
  name: "", slug: "", description: "", icon: "",
  isActive: true, displayOrder: 0,
  thumbnailPreview: "", thumbnailFile: null,
};

// ── Toggle Switch ─────────────────────────────────────────────────
function ToggleSwitch({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? "bg-teal-600" : "bg-slate-700"} ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4.5" : "translate-x-0.5"}`} />
    </button>
  );
}

// ── Doctors list popup ────────────────────────────────────────────
interface DoctorsPopupProps {
  specialty: ExtendedSpecialty;
  onClose: () => void;
}

function DoctorsPopup({ specialty, onClose }: DoctorsPopupProps) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md max-h-[70vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-teal-400" />
              Bác sĩ thuộc chuyên khoa
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{specialty.name} — {specialty._count.doctors} bác sĩ</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto p-5">
          {specialty._count.doctors === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              <Stethoscope className="h-10 w-10 mx-auto mb-2 text-slate-700" />
              Chưa có bác sĩ nào thuộc chuyên khoa này.
            </div>
          ) : (
            <div className="space-y-1">
              {/* Placeholder list — real data would need a specialty doctors endpoint */}
              {Array.from({ length: specialty._count.doctors }, (_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-800">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {specialty.icon || "B"}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">Bác sĩ #{i + 1}</p>
                    <p className="text-xs text-slate-500">{specialty.name}</p>
                  </div>
                </div>
              ))}
              <p className="text-xs text-slate-600 text-center pt-2 italic">
                Xem danh sách đầy đủ tại trang Quản lý Bác sĩ
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Form Modal ────────────────────────────────────────────────────
interface FormModalProps {
  open: boolean;
  editingSpecialty: ExtendedSpecialty | null;
  formData: SpecialtyFormData;
  setFormData: React.Dispatch<React.SetStateAction<SpecialtyFormData>>;
  slugStatus: "idle" | "checking" | "available" | "taken";
  submitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onNameChange: (name: string) => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function FormModal({
  open, editingSpecialty, formData, setFormData, slugStatus,
  submitting, onClose, onSubmit, onNameChange, onImageChange
}: FormModalProps) {
  if (!open) return null;

  const descLen = formData.description.trim().length;
  const isValid = formData.name.trim().length > 0
    && formData.slug.trim().length > 0
    && descLen >= 20
    && slugStatus !== "taken";

  const slugIndicator = () => {
    if (!formData.slug) return null;
    if (slugStatus === "checking") return <span className="text-xs text-slate-400 flex items-center gap-1"><LoadingSpinner className="h-3 w-3" /> Đang kiểm tra…</span>;
    if (slugStatus === "available") return <span className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Slug khả dụng</span>;
    if (slugStatus === "taken") return <span className="text-xs text-red-400 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Slug đã tồn tại</span>;
    return null;
  };

  const fieldCls = "w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm";
  const labelCls = "block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5";

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 shrink-0">
          <h3 className="text-base font-bold text-white">
            {editingSpecialty ? "✏️ Chỉnh sửa Chuyên khoa" : "➕ Thêm Chuyên khoa mới"}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">

          {/* Thumbnail upload */}
          <div>
            <label className={labelCls}>
              <ImageIcon className="h-3 w-3 inline mr-1.5" />Ảnh đại diện
            </label>
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-xl border border-slate-700 bg-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                {formData.thumbnailPreview
                  ? <img src={formData.thumbnailPreview} alt="preview" className="w-full h-full object-cover" />
                  : <ImageIcon className="h-7 w-7 text-slate-600" />
                }
              </div>
              <div className="flex-1 space-y-2">
                <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-slate-700 hover:border-teal-500/50 bg-slate-800/50 cursor-pointer transition-all text-xs text-slate-400 hover:text-teal-400">
                  <input type="file" accept="image/*" className="hidden" onChange={onImageChange} />
                  <ImageIcon className="h-4 w-4 shrink-0" />
                  Chọn ảnh từ máy tính
                </label>
                <p className="text-[10px] text-slate-600">Hỗ trợ: JPG, PNG, WebP. Tối đa 2MB.</p>
                {formData.thumbnailPreview && (
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, thumbnailPreview: "", thumbnailFile: null }))}
                    className="text-[10px] text-red-400 hover:text-red-300 transition-colors"
                  >
                    Xóa ảnh
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className={labelCls}>Tên chuyên khoa <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="VD: Nội khoa, Tim mạch..."
              className={fieldCls}
            />
          </div>

          {/* Slug */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={labelCls + " mb-0"}>Slug <span className="text-red-400">*</span></label>
              {slugIndicator()}
            </div>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
              placeholder="noi-khoa"
              className={`${fieldCls} font-mono ${slugStatus === "taken" ? "!border-red-500/50 !ring-red-500/10" : slugStatus === "available" ? "!border-emerald-500/40" : ""}`}
            />
            <p className="text-[10px] text-slate-600 mt-1">Slug được tự động tạo từ tên. Bạn có thể chỉnh sửa thủ công.</p>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={labelCls + " mb-0"}>Mô tả <span className="text-red-400">*</span></label>
              <span className={`text-[10px] font-semibold ${descLen < 20 ? "text-red-400" : "text-emerald-400"}`}>
                {descLen}/20+ ký tự
              </span>
            </div>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Mô tả chi tiết về chuyên khoa này (tối thiểu 20 ký tự)..."
              rows={3}
              className={`${fieldCls} resize-none ${descLen > 0 && descLen < 20 ? "!border-red-500/50" : ""}`}
            />
          </div>

          {/* Icon */}
          <div>
            <label className={labelCls}>Icon emoji</label>
            <input
              type="text"
              value={formData.icon}
              onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
              placeholder="🏥 (không bắt buộc)"
              className={fieldCls}
            />
          </div>

          {/* Status + Order row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Trạng thái</label>
              <div className="flex items-center gap-3 mt-1">
                <ToggleSwitch checked={formData.isActive} onChange={v => setFormData(prev => ({ ...prev, isActive: v }))} />
                <span className={`text-xs font-semibold ${formData.isActive ? "text-emerald-400" : "text-slate-500"}`}>
                  {formData.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
            <div>
              <label className={labelCls}>Thứ tự hiển thị</label>
              <input
                type="number"
                value={formData.displayOrder}
                onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                min={0}
                className={fieldCls}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-800 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-400 bg-slate-800 border border-slate-700 hover:text-white hover:bg-slate-700 transition-all"
          >
            Hủy bỏ
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting || !isValid}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Đang lưu..." : editingSpecialty ? "Cập nhật" : "Tạo mới"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm Dialog ─────────────────────────────────────────
interface DeleteConfirmProps {
  target: ExtendedSpecialty | null;
  submitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConfirm({ target, submitting, onConfirm, onCancel }: DeleteConfirmProps) {
  if (!target) return null;
  const hasDoctors = target._count.doctors > 0;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-red-500/10 shrink-0">
            <AlertTriangle className="h-6 w-6 text-red-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Xóa chuyên khoa?</h3>
            <p className="text-sm text-slate-400 mt-1 leading-relaxed">
              Bạn sắp xóa chuyên khoa <span className="text-white font-semibold">"{target.name}"</span>.
              Hành động này không thể hoàn tác.
            </p>
            {hasDoctors && (
              <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <p className="text-sm text-red-400 font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {target._count.doctors} bác sĩ đang thuộc chuyên khoa này
                </p>
                <p className="text-xs text-red-400/80 mt-1 leading-relaxed">
                  Xóa chuyên khoa sẽ ảnh hưởng đến hồ sơ của {target._count.doctors} bác sĩ. Chuyên khoa của họ sẽ bị đặt thành trống.
                </p>
              </div>
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
            disabled={submitting}
            className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all disabled:opacity-50"
          >
            {submitting ? "Đang xóa..." : hasDoctors ? "Xác nhận xóa dù có bác sĩ" : "Xác nhận xóa"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────
export default function SpecialtiesTab() {
  const [specialties, setSpecialties] = useState<ExtendedSpecialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSpecialty, setEditingSpecialty] = useState<ExtendedSpecialty | null>(null);
  const [formData, setFormData] = useState<SpecialtyFormData>(emptyForm);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<ExtendedSpecialty | null>(null);

  // Doctors popup
  const [doctorsPopupSpecialty, setDoctorsPopupSpecialty] = useState<ExtendedSpecialty | null>(null);

  // Slug validation
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const slugDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadSpecialties = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminService.getSpecialties();
      // Enrich with local-only fields
      const enriched: ExtendedSpecialty[] = res.data.map((s, idx) => ({
        ...s,
        isActive: true,
        displayOrder: idx + 1,
        thumbnail: s.icon?.startsWith("http") ? s.icon : undefined,
      }));
      setSpecialties(enriched);
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "message" in err
        ? String((err as { message: unknown }).message)
        : "Không thể tải danh sách chuyên khoa.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSpecialties(); }, [loadSpecialties]);

  useEffect(() => {
    if (actionMessage) {
      const timer = setTimeout(() => setActionMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [actionMessage]);

  // Validate slug with debounce
  useEffect(() => {
    if (!formData.slug.trim()) { setSlugStatus("idle"); return; }
    if (slugDebounceRef.current) clearTimeout(slugDebounceRef.current);

    slugDebounceRef.current = setTimeout(() => {
      setSlugStatus("checking");
      // Check locally against loaded list
      const exists = specialties.some(s =>
        s.slug === formData.slug.trim() &&
        (!editingSpecialty || s.id !== editingSpecialty.id)
      );
      setTimeout(() => {
        setSlugStatus(exists ? "taken" : "available");
      }, 200);
    }, 500);

    return () => {
      if (slugDebounceRef.current) clearTimeout(slugDebounceRef.current);
    };
  }, [formData.slug, specialties, editingSpecialty]);

  const filteredSpecialties = specialties.filter(
    (s) =>
      !searchQuery.trim() ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Image handler ───────────────────────────────────────────────
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setActionMessage({ type: "error", text: "Ảnh quá lớn. Vui lòng chọn ảnh dưới 2MB." });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFormData(prev => ({
        ...prev,
        thumbnailPreview: ev.target?.result as string,
        thumbnailFile: file,
      }));
    };
    reader.readAsDataURL(file);
  };

  // ── Open modals ─────────────────────────────────────────────────
  const openCreateModal = () => {
    setEditingSpecialty(null);
    setFormData({ ...emptyForm, displayOrder: specialties.length + 1 });
    setSlugStatus("idle");
    setModalOpen(true);
  };

  const openEditModal = (s: ExtendedSpecialty) => {
    setEditingSpecialty(s);
    setFormData({
      name: s.name,
      slug: s.slug,
      description: s.description || "",
      icon: s.icon || "",
      isActive: s.isActive ?? true,
      displayOrder: s.displayOrder ?? 0,
      thumbnailPreview: s.thumbnail || "",
      thumbnailFile: null,
    });
    setSlugStatus("idle");
    setModalOpen(true);
  };

  // ── Name change auto-slug ───────────────────────────────────────
  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: editingSpecialty ? prev.slug : generateSlug(name),
    }));
  };

  // ── Submit ──────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.slug.trim() || formData.description.trim().length < 20) return;
    setSubmitting(true);
    try {
      if (editingSpecialty) {
        const payload: UpdateSpecialtyPayload = {
          name: formData.name,
          slug: formData.slug,
          description: formData.description || undefined,
          icon: formData.icon || undefined,
        };
        await adminService.updateSpecialty(editingSpecialty.id, payload);
        // Update local state with extra fields
        setSpecialties(prev => prev.map(s =>
          s.id === editingSpecialty.id
            ? { ...s, ...payload, isActive: formData.isActive, displayOrder: formData.displayOrder, thumbnail: formData.thumbnailPreview || s.thumbnail }
            : s
        ));
        setActionMessage({ type: "success", text: `Đã cập nhật chuyên khoa "${formData.name}".` });
      } else {
        const payload: CreateSpecialtyPayload = {
          name: formData.name,
          slug: formData.slug,
          description: formData.description || undefined,
          icon: formData.icon || undefined,
        };
        await adminService.createSpecialty(payload);
        setActionMessage({ type: "success", text: `Đã tạo chuyên khoa "${formData.name}" thành công!` });
        loadSpecialties();
      }
      setModalOpen(false);
      setFormData(emptyForm);
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "message" in err
        ? String((err as { message: unknown }).message)
        : "Không thể lưu chuyên khoa.";
      setActionMessage({ type: "error", text: msg });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await adminService.deleteSpecialty(deleteTarget.id);
      setActionMessage({ type: "success", text: `Đã xóa chuyên khoa "${deleteTarget.name}".` });
      setDeleteTarget(null);
      loadSpecialties();
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "message" in err
        ? String((err as { message: unknown }).message)
        : "Không thể xóa chuyên khoa này.";
      setActionMessage({ type: "error", text: msg });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Toggle active ───────────────────────────────────────────────
  const handleToggleActive = (id: string) => {
    setSpecialties(prev => prev.map(s =>
      s.id === id ? { ...s, isActive: !s.isActive } : s
    ));
  };

  // ── Reorder ─────────────────────────────────────────────────────
  const handleReorder = (id: string, dir: "up" | "down") => {
    setSpecialties(prev => {
      const idx = prev.findIndex(s => s.id === id);
      if (idx < 0) return prev;
      if (dir === "up" && idx === 0) return prev;
      if (dir === "down" && idx === prev.length - 1) return prev;
      const next = [...prev];
      const swapIdx = dir === "up" ? idx - 1 : idx + 1;
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next.map((s, i) => ({ ...s, displayOrder: i + 1 }));
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
    <>
      {/* Doctors Popup */}
      {doctorsPopupSpecialty && (
        <DoctorsPopup
          specialty={doctorsPopupSpecialty}
          onClose={() => setDoctorsPopupSpecialty(null)}
        />
      )}

      {/* Form Modal */}
      <FormModal
        open={modalOpen}
        editingSpecialty={editingSpecialty}
        formData={formData}
        setFormData={setFormData}
        slugStatus={slugStatus}
        submitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        onNameChange={handleNameChange}
        onImageChange={handleImageChange}
      />

      {/* Delete Confirm */}
      <DeleteConfirm
        target={deleteTarget}
        submitting={submitting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white">Danh sách Chuyên khoa</h2>
            <p className="text-sm text-slate-400">
              Có {specialties.length} chuyên khoa ({specialties.filter(s => s.isActive).length} đang hoạt động).
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-teal-600 text-white hover:bg-teal-500 transition-all shadow-sm"
          >
            <Plus className="h-4 w-4" /> Thêm mới
          </button>
        </div>

        {/* Alerts */}
        {error && <Alert type="error" message={error} className="bg-red-950/40 border-red-900/50 text-red-300" />}
        {actionMessage && <Alert type={actionMessage.type} message={actionMessage.text} />}

        {/* Search */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc slug chuyên khoa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            {filteredSpecialties.length === 0 ? (
              <div className="text-center py-20 text-slate-500 text-sm font-medium">
                <BookOpen className="h-10 w-10 mx-auto mb-3 text-slate-700" />
                Không tìm thấy chuyên khoa nào.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/50 text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                    <th className="px-4 py-3.5 font-semibold w-10">#</th>
                    <th className="px-4 py-3.5 font-semibold">Chuyên khoa</th>
                    <th className="px-4 py-3.5 font-semibold">Slug</th>
                    <th className="px-4 py-3.5 font-semibold max-w-[180px]">Mô tả</th>
                    <th className="px-4 py-3.5 font-semibold text-center">Bác sĩ</th>
                    <th className="px-4 py-3.5 font-semibold text-center">Trạng thái</th>
                    <th className="px-4 py-3.5 font-semibold">Cập nhật cuối</th>
                    <th className="px-4 py-3.5 font-semibold text-center">Thứ tự</th>
                    <th className="px-4 py-3.5 font-semibold text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-slate-900">
                  {filteredSpecialties.map((s, idx) => (
                    <tr key={s.id} className="hover:bg-slate-900/30 transition-colors group">

                      {/* Order # */}
                      <td className="px-4 py-3.5 text-slate-600 font-mono font-bold text-center">
                        {s.displayOrder ?? idx + 1}
                      </td>

                      {/* Name + thumbnail */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 bg-slate-800 flex items-center justify-center">
                            {s.thumbnail
                              ? <img src={s.thumbnail} alt={s.name} className="w-full h-full object-cover" />
                              : s.icon
                                ? <span className="text-lg">{s.icon}</span>
                                : <BookOpen className="h-4 w-4 text-slate-600" />
                            }
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-200 truncate">{s.name}</p>
                            {s.icon && !s.thumbnail && (
                              <p className="text-slate-600 text-[10px]">emoji icon</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Slug */}
                      <td className="px-4 py-3.5 text-teal-400 font-mono text-[11px]">
                        {s.slug}
                      </td>

                      {/* Description */}
                      <td className="px-4 py-3.5 text-slate-400 max-w-[180px]">
                        <span className="line-clamp-2 leading-relaxed" title={s.description || ""}>
                          {s.description || <span className="text-slate-600 italic">Chưa có mô tả</span>}
                        </span>
                      </td>

                      {/* Doctor count — clickable */}
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => setDoctorsPopupSpecialty(s)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
                            s._count.doctors > 0
                              ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:border-indigo-400/50 cursor-pointer"
                              : "border-slate-800 bg-slate-900 text-slate-500 cursor-default"
                          }`}
                          title={s._count.doctors > 0 ? "Xem danh sách bác sĩ" : "Không có bác sĩ"}
                        >
                          <Users className="h-3 w-3" />
                          <span className="font-bold">{s._count.doctors}</span>
                        </button>
                      </td>

                      {/* Status toggle */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <ToggleSwitch
                            checked={s.isActive ?? true}
                            onChange={() => handleToggleActive(s.id)}
                          />
                          <span className={`text-[9px] font-bold uppercase tracking-wide ${s.isActive ? "text-emerald-400" : "text-slate-600"}`}>
                            {s.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </td>

                      {/* Updated at */}
                      <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 shrink-0 text-slate-600" />
                          {new Date(s.updatedAt).toLocaleDateString("vi-VN", {
                            day: "2-digit", month: "2-digit", year: "numeric"
                          })}
                        </div>
                      </td>

                      {/* Reorder */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex flex-col items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleReorder(s.id, "up")}
                            disabled={idx === 0}
                            className="p-1 rounded text-slate-500 hover:text-teal-400 hover:bg-teal-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                          >
                            <ChevronUp className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleReorder(s.id, "down")}
                            disabled={idx === filteredSpecialties.length - 1}
                            className="p-1 rounded text-slate-500 hover:text-teal-400 hover:bg-teal-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                          >
                            <ChevronDown className="h-3 w-3" />
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(s)}
                            className="p-2 rounded-lg bg-slate-900 hover:bg-teal-500/10 border border-slate-800 hover:border-teal-500/20 text-slate-400 hover:text-teal-400 transition-all"
                            title="Chỉnh sửa"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(s)}
                            className="p-2 rounded-lg bg-slate-900 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/20 text-slate-400 hover:text-red-400 transition-all"
                            title="Xóa"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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
      </div>
    </>
  );
}
