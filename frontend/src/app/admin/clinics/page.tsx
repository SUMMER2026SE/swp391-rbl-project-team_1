"use client";

import React, { useEffect, useState, useCallback } from "react";
import { adminService } from "@/services/admin.service";
import { AdminClinic, CreateClinicPayload, UpdateClinicPayload, AdminDoctor } from "@/types/admin";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";
import { Search, Plus, Pencil, Trash2, Building2, X, MapPin, Stethoscope, Users } from "lucide-react";

interface ClinicFormData {
  name: string;
  address: string;
  image: string;
}

const emptyForm: ClinicFormData = { name: "", address: "", image: "" };

export default function AdminClinicsPage() {
  const [clinics, setClinics] = useState<AdminClinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClinic, setEditingClinic] = useState<AdminClinic | null>(null);
  const [formData, setFormData] = useState<ClinicFormData>(emptyForm);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<AdminClinic | null>(null);

  // Manage Doctors Modal state
  const [doctorsModalOpen, setDoctorsModalOpen] = useState(false);
  const [selectedClinicForDoctors, setSelectedClinicForDoctors] = useState<AdminClinic | null>(null);
  const [clinicDoctors, setClinicDoctors] = useState<AdminDoctor[]>([]);
  const [unassignedDoctors, setUnassignedDoctors] = useState<AdminDoctor[]>([]);
  const [selectedDoctorToAdd, setSelectedDoctorToAdd] = useState("");
  const [doctorsLoading, setDoctorsLoading] = useState(false);

  const loadClinicDoctorsData = async (clinicId: string) => {
    try {
      setDoctorsLoading(true);
      const [clinicDocsRes, unassignedDocsRes] = await Promise.all([
        adminService.getClinicDoctors(clinicId),
        adminService.getUnassignedDoctors(),
      ]);
      setClinicDoctors(clinicDocsRes.data);
      setUnassignedDoctors(unassignedDocsRes.data);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setDoctorsLoading(false);
    }
  };

  const openDoctorsModal = (clinic: AdminClinic) => {
    setSelectedClinicForDoctors(clinic);
    setSelectedDoctorToAdd("");
    setDoctorsModalOpen(true);
    loadClinicDoctorsData(clinic.id);
  };

  const handleAddDoctor = async () => {
    if (!selectedClinicForDoctors || !selectedDoctorToAdd) return;
    try {
      setDoctorsLoading(true);
      await adminService.addDoctorToClinic(selectedClinicForDoctors.id, selectedDoctorToAdd);
      setSelectedDoctorToAdd("");
      await loadClinicDoctorsData(selectedClinicForDoctors.id);
      loadClinics();
      setActionMessage({ type: "success", text: "Đã thêm bác sĩ vào phòng khám thành công!" });
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Không thể thêm bác sĩ." });
    } finally {
      setDoctorsLoading(false);
    }
  };

  const handleRemoveDoctor = async (doctorId: string) => {
    if (!selectedClinicForDoctors) return;
    try {
      setDoctorsLoading(true);
      await adminService.removeDoctorFromClinic(selectedClinicForDoctors.id, doctorId);
      await loadClinicDoctorsData(selectedClinicForDoctors.id);
      loadClinics();
      setActionMessage({ type: "success", text: "Đã hủy liên kết bác sĩ khỏi phòng khám." });
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Không thể hủy liên kết bác sĩ." });
    } finally {
      setDoctorsLoading(false);
    }
  };

  const loadClinics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminService.getClinics();
      setClinics(res.data);
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Không thể tải danh sách phòng khám.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClinics();
  }, [loadClinics]);

  useEffect(() => {
    if (actionMessage) {
      const timer = setTimeout(() => setActionMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [actionMessage]);

  const filteredClinics = clinics.filter(
    (c) =>
      !searchQuery.trim() ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openCreateModal = () => {
    setEditingClinic(null);
    setFormData(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (clinic: AdminClinic) => {
    setEditingClinic(clinic);
    setFormData({
      name: clinic.name,
      address: clinic.address,
      image: clinic.image || "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.address.trim()) return;
    setSubmitting(true);
    try {
      if (editingClinic) {
        const payload: UpdateClinicPayload = {
          name: formData.name,
          address: formData.address,
          image: formData.image || undefined,
        };
        await adminService.updateClinic(editingClinic.id, payload);
        setActionMessage({ type: "success", text: `Đã cập nhật phòng khám "${formData.name}".` });
      } else {
        const payload: CreateClinicPayload = {
          name: formData.name,
          address: formData.address,
          image: formData.image || undefined,
        };
        await adminService.createClinic(payload);
        setActionMessage({ type: "success", text: `Đã tạo phòng khám "${formData.name}" thành công!` });
      }
      setModalOpen(false);
      setFormData(emptyForm);
      loadClinics();
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Không thể lưu phòng khám.";
      setActionMessage({ type: "error", text: errorMsg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await adminService.deleteClinic(deleteTarget.id);
      setActionMessage({ type: "success", text: `Đã xóa phòng khám "${deleteTarget.name}".` });
      setDeleteTarget(null);
      loadClinics();
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Không thể xóa phòng khám này.";
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
          <h1 className="text-2xl font-black text-white">Quản lý Phòng khám</h1>
          <p className="text-sm text-slate-400">Thêm, sửa, xóa phòng khám trong hệ thống y tế.</p>
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
            placeholder="Tìm theo tên hoặc địa chỉ phòng khám..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm"
          />
        </div>
      </div>

      {/* Clinics Grid / Table */}
      {filteredClinics.length === 0 ? (
        <div className="bg-slate-950 border border-slate-800 rounded-3xl text-center py-20 text-slate-500 text-sm font-medium shadow-sm">
          <Building2 className="h-10 w-10 mx-auto mb-3 text-slate-700" />
          Không tìm thấy phòng khám nào.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClinics.map((clinic) => (
            <div
              key={clinic.id}
              className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:border-slate-700 transition-all"
            >
              {/* Image */}
              <div className="h-40 bg-slate-900 flex items-center justify-center">
                {clinic.image ? (
                  <img src={clinic.image} alt={clinic.name} className="h-full w-full object-cover" />
                ) : (
                  <Building2 className="h-12 w-12 text-slate-700" />
                )}
              </div>

              {/* Content */}
              <div className="p-5 space-y-3">
                <h3 className="font-bold text-white text-sm">{clinic.name}</h3>
                <div className="flex items-start gap-1.5 text-xs text-slate-400">
                  <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-slate-500" />
                  <span>{clinic.address}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {clinic._count.doctors} bác sĩ
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openDoctorsModal(clinic)}
                      className="p-2 rounded-lg bg-slate-900 hover:bg-teal-500/10 border border-slate-800 hover:border-teal-500/20 text-slate-400 hover:text-teal-400 transition-all"
                      title="Quản lý Bác sĩ"
                    >
                      <Users className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => openEditModal(clinic)}
                      className="p-2 rounded-lg bg-slate-900 hover:bg-teal-500/10 border border-slate-800 hover:border-teal-500/20 text-slate-400 hover:text-teal-400 transition-all"
                      title="Chỉnh sửa"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(clinic)}
                      className="p-2 rounded-lg bg-slate-900 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/20 text-slate-400 hover:text-red-400 transition-all"
                      title="Xóa"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-white">
                {editingClinic ? "Chỉnh sửa Phòng khám" : "Thêm Phòng khám mới"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-500 hover:text-slate-300 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Tên phòng khám *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="VD: Phòng khám Đa khoa Quốc tế"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Địa chỉ *
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="VD: 123 Nguyễn Huệ, Quận 1, TP.HCM"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Hình ảnh (URL)
                </label>
                <input
                  type="text"
                  value={formData.image}
                  onChange={(e) => setFormData((prev) => ({ ...prev, image: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
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
                disabled={submitting || !formData.name.trim() || !formData.address.trim()}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors disabled:opacity-50"
              >
                {submitting ? "Đang lưu..." : editingClinic ? "Cập nhật" : "Tạo mới"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">Xóa Phòng khám</h3>
            <p className="text-sm text-slate-400 mb-5">
              Bạn có chắc chắn muốn xóa phòng khám{" "}
              <strong className="text-slate-200">&quot;{deleteTarget.name}&quot;</strong>?
              {deleteTarget._count.doctors > 0 && (
                <span className="block mt-1 text-red-400">
                  Lưu ý: Phòng khám này đang có {deleteTarget._count.doctors} bác sĩ liên kết.
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

      {/* Manage Doctors Modal */}
      {doctorsModalOpen && selectedClinicForDoctors && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 w-full max-w-2xl mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-white">
                  Quản lý Bác sĩ liên kết
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Phòng khám: {selectedClinicForDoctors.name}
                </p>
              </div>
              <button
                onClick={() => setDoctorsModalOpen(false)}
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Add Doctor Section */}
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4 mb-6 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Thêm bác sĩ vào phòng khám
              </h4>
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={selectedDoctorToAdd}
                  onChange={(e) => setSelectedDoctorToAdd(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-xs"
                >
                  <option value="">-- Chọn bác sĩ để liên kết --</option>
                  {unassignedDoctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} ({doc.specialty.name})
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddDoctor}
                  disabled={doctorsLoading || !selectedDoctorToAdd}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-teal-600 text-white hover:bg-teal-700 transition-colors disabled:opacity-50 shrink-0"
                >
                  Thêm bác sĩ
                </button>
              </div>
            </div>

            {/* Current Doctors List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Danh sách Bác sĩ hiện tại ({clinicDoctors.length})
              </h4>
              <div className="max-h-[250px] overflow-y-auto border border-slate-800 rounded-xl divide-y divide-slate-800 bg-slate-950">
                {doctorsLoading && clinicDoctors.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    Đang tải danh sách bác sĩ...
                  </div>
                ) : clinicDoctors.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    Chưa có bác sĩ nào thuộc phòng khám này.
                  </div>
                ) : (
                  clinicDoctors.map((doc) => (
                    <div key={doc.id} className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-800 overflow-hidden flex items-center justify-center">
                          {doc.avatar ? (
                            <img src={doc.avatar} alt={doc.name} className="h-full w-full object-cover" />
                          ) : (
                            <Users className="h-4 w-4 text-slate-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-200 text-xs">{doc.name}</p>
                          <p className="text-[10px] text-teal-400 font-semibold">{doc.specialty.name}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveDoctor(doc.id)}
                        disabled={doctorsLoading}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-50"
                      >
                        Hủy liên kết
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setDoctorsModalOpen(false)}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-slate-400 bg-slate-900 border border-slate-800 hover:text-slate-100 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
