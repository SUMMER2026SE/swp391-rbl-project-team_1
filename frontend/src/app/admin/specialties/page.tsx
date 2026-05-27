"use client";

import React, { useEffect, useState, useCallback } from "react";
import { adminService } from "@/services/admin.service";
import { AdminSpecialty, CreateSpecialtyPayload, UpdateSpecialtyPayload } from "@/types/admin";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";
import { Search, Plus, Pencil, Trash2, BookOpen, X } from "lucide-react";

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

interface SpecialtyFormData {
  name: string;
  slug: string;
  description: string;
  icon: string;
}

const emptyForm: SpecialtyFormData = { name: "", slug: "", description: "", icon: "" };

export default function AdminSpecialtiesPage() {
  const [specialties, setSpecialties] = useState<AdminSpecialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSpecialty, setEditingSpecialty] = useState<AdminSpecialty | null>(null);
  const [formData, setFormData] = useState<SpecialtyFormData>(emptyForm);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<AdminSpecialty | null>(null);

  const loadSpecialties = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminService.getSpecialties();
      setSpecialties(res.data);
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Không thể tải danh sách chuyên khoa.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSpecialties();
  }, [loadSpecialties]);

  useEffect(() => {
    if (actionMessage) {
      const timer = setTimeout(() => setActionMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [actionMessage]);

  const filteredSpecialties = specialties.filter(
    (s) =>
      !searchQuery.trim() ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openCreateModal = () => {
    setEditingSpecialty(null);
    setFormData(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (specialty: AdminSpecialty) => {
    setEditingSpecialty(specialty);
    setFormData({
      name: specialty.name,
      slug: specialty.slug,
      description: specialty.description || "",
      icon: specialty.icon || "",
    });
    setModalOpen(true);
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: editingSpecialty ? prev.slug : generateSlug(name),
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.slug.trim()) return;
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
      }
      setModalOpen(false);
      setFormData(emptyForm);
      loadSpecialties();
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Không thể lưu chuyên khoa.";
      setActionMessage({ type: "error", text: errorMsg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await adminService.deleteSpecialty(deleteTarget.id);
      setActionMessage({ type: "success", text: `Đã xóa chuyên khoa "${deleteTarget.name}".` });
      setDeleteTarget(null);
      loadSpecialties();
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Không thể xóa chuyên khoa này.";
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-white">Quản lý Chuyên khoa</h1>
          <p className="text-sm text-slate-400">Thêm, sửa, xóa các chuyên khoa y tế trong hệ thống.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> Thêm mới
        </button>
      </div>

      {error && <Alert type="error" message={error} className="bg-red-950/40 border-red-900/50 text-red-300" />}
      {actionMessage && <Alert type={actionMessage.type} message={actionMessage.text} className="my-2" />}

      {/* Search */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
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
      <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {filteredSpecialties.length === 0 ? (
            <div className="text-center py-20 text-slate-500 text-sm font-medium">
              <BookOpen className="h-10 w-10 mx-auto mb-3 text-slate-700" />
              Không tìm thấy chuyên khoa nào.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950 text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                  <th className="p-5 font-semibold">Tên chuyên khoa</th>
                  <th className="p-5 font-semibold">Slug</th>
                  <th className="p-5 font-semibold">Mô tả</th>
                  <th className="p-5 font-semibold">Icon</th>
                  <th className="p-5 font-semibold text-center">Số bác sĩ</th>
                  <th className="p-5 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-900">
                {filteredSpecialties.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-5 font-bold text-slate-200">{s.name}</td>
                    <td className="p-5 text-teal-400 font-mono text-[11px]">{s.slug}</td>
                    <td className="p-5 text-slate-400 max-w-[200px] truncate" title={s.description || ""}>
                      {s.description || <span className="text-slate-600 italic">Chưa có</span>}
                    </td>
                    <td className="p-5 text-slate-400">{s.icon || <span className="text-slate-600">—</span>}</td>
                    <td className="p-5 text-center">
                      <span className="inline-block px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900 text-slate-200 font-bold">
                        {s._count.doctors}
                      </span>
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(s)}
                          className="p-2 rounded-lg bg-slate-900 hover:bg-teal-500/10 border border-slate-800 hover:border-teal-500/20 text-slate-400 hover:text-teal-400 transition-all shadow-sm"
                          title="Chỉnh sửa"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(s)}
                          className="p-2 rounded-lg bg-slate-900 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/20 text-slate-400 hover:text-red-400 transition-all shadow-sm"
                          title="Xóa"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-white">
                {editingSpecialty ? "Chỉnh sửa Chuyên khoa" : "Thêm Chuyên khoa mới"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-500 hover:text-slate-300 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Tên chuyên khoa *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="VD: Nội khoa"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Slug *
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                  placeholder="noi-khoa"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Mô tả
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Mô tả ngắn về chuyên khoa..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Icon (emoji hoặc text)
                </label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData((prev) => ({ ...prev, icon: e.target.value }))}
                  placeholder="🏥"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 bg-slate-900 border border-slate-800 hover:text-slate-100 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !formData.name.trim() || !formData.slug.trim()}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors disabled:opacity-50"
              >
                {submitting ? "Đang lưu..." : editingSpecialty ? "Cập nhật" : "Tạo mới"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">Xóa Chuyên khoa</h3>
            <p className="text-sm text-slate-400 mb-5">
              Bạn có chắc chắn muốn xóa chuyên khoa{" "}
              <strong className="text-slate-200">&quot;{deleteTarget.name}&quot;</strong>?
              {deleteTarget._count.doctors > 0 && (
                <span className="block mt-1 text-red-400">
                  Lưu ý: Chuyên khoa này đang có {deleteTarget._count.doctors} bác sĩ liên kết.
                </span>
              )}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 bg-slate-900 border border-slate-800 hover:text-slate-100 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleDelete}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {submitting ? "Đang xóa..." : "Xác nhận Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
