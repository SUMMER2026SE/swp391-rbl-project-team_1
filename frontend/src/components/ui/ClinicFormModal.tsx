"use client";

import React, { useState, useEffect } from "react";
import { X, Building2, MapPin, Image, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { adminService } from "@/services/admin.service";
import { AdminClinic } from "@/types/admin";

interface ClinicFormModalProps {
  isOpen: boolean;
  clinic: AdminClinic | null; // null = create mode, non-null = edit mode
  onClose: () => void;
  onSave: () => void;
}

interface FormData {
  name: string;
  address: string;
  image: string;
}

const emptyForm: FormData = { name: "", address: "", image: "" };

export default function ClinicFormModal({
  isOpen,
  clinic,
  onClose,
  onSave,
}: ClinicFormModalProps) {
  const [form, setForm] = useState<FormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  // Sync form khi modal mở
  useEffect(() => {
    if (isOpen) {
      setForm(
        clinic
          ? { name: clinic.name, address: clinic.address, image: clinic.image ?? "" }
          : emptyForm
      );
    }
  }, [isOpen, clinic]);

  if (!isOpen) return null;

  const isEdit = clinic !== null;
  const isValid = form.name.trim().length > 0 && form.address.trim().length > 0;

  const handleSubmit = async () => {
    if (!isValid) return;
    setSubmitting(true);
    const toastId = toast.loading(isEdit ? "Đang cập nhật..." : "Đang tạo mới...");
    try {
      if (isEdit) {
        await adminService.updateClinic(clinic.id, {
          name: form.name.trim(),
          address: form.address.trim(),
          image: form.image.trim() || undefined,
        });
        toast.success(`Đã cập nhật "${form.name}" thành công!`, { id: toastId });
      } else {
        await adminService.createClinic({
          name: form.name.trim(),
          address: form.address.trim(),
          image: form.image.trim() || undefined,
        });
        toast.success(`Đã tạo cơ sở "${form.name}" thành công!`, { id: toastId });
      }
      onSave();
      onClose();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Không thể lưu thông tin cơ sở y tế.";
      toast.error(msg, { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl shadow-black/50">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Building2 className="h-5 w-5 text-teal-400" />
            {isEdit ? "Chỉnh sửa Cơ sở" : "Thêm Cơ sở Y tế"}
          </h2>
          <button
            onClick={handleClose}
            disabled={submitting}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Tên */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              Tên cơ sở y tế <span className="text-red-400 normal-case tracking-normal font-normal">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="VD: Bệnh viện Đa khoa Quốc tế Đà Nẵng"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm"
              disabled={submitting}
            />
          </div>

          {/* Địa chỉ */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              Địa chỉ <span className="text-red-400 normal-case tracking-normal font-normal">*</span>
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
              placeholder="VD: 124 Hải Phòng, Hải Châu, Đà Nẵng"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm"
              disabled={submitting}
            />
          </div>

          {/* URL ảnh */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
              <Image className="h-3.5 w-3.5" />
              URL Hình ảnh{" "}
              <span className="text-slate-600 normal-case tracking-normal font-normal">(không bắt buộc)</span>
            </label>
            <input
              type="text"
              value={form.image}
              onChange={(e) => setForm((p) => ({ ...p, image: e.target.value }))}
              placeholder="https://example.com/clinic.jpg"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm"
              disabled={submitting}
            />
            {/* Preview */}
            {form.image.trim() && (
              <div className="mt-2 h-24 rounded-xl overflow-hidden border border-slate-800">
                <img
                  src={form.image.trim()}
                  alt="preview"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={submitting}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 bg-slate-900 border border-slate-800 hover:text-slate-100 hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || submitting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang lưu...
              </>
            ) : isEdit ? (
              "Cập nhật"
            ) : (
              "Tạo mới"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
