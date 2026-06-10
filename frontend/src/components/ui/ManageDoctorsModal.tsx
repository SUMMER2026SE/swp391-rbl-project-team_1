"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Users,
  Search,
  Stethoscope,
  Trash2,
  UserPlus,
  Loader2,
  Building2,
} from "lucide-react";
import toast from "react-hot-toast";
import { adminService } from "@/services/admin.service";
import { AdminClinic, AdminDoctor } from "@/types/admin";

interface ManageDoctorsModalProps {
  isOpen: boolean;
  clinic: AdminClinic | null;
  onClose: () => void;
}

// ─── Doctor Avatar ───────────────────────────────────────────────────────────

function DoctorAvatar({ avatar, name }: { avatar?: string; name: string }) {
  return (
    <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
      {avatar ? (
        <img src={avatar} alt={name} className="h-full w-full object-cover" />
      ) : (
        <Stethoscope className="h-4 w-4 text-slate-500" />
      )}
    </div>
  );
}

// ─── Main Modal ──────────────────────────────────────────────────────────────

export default function ManageDoctorsModal({
  isOpen,
  clinic,
  onClose,
}: ManageDoctorsModalProps) {
  // Doctors currently in clinic
  const [clinicDoctors, setClinicDoctors] = useState<AdminDoctor[]>([]);
  const [loadingClinicDoctors, setLoadingClinicDoctors] = useState(false);

  // Search for doctors to add
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<AdminDoctor[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Action loading per doctor id
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // ─── Load clinic doctors ────────────────────────────────────────────────────

  const loadClinicDoctors = useCallback(async () => {
    if (!clinic) return;
    setLoadingClinicDoctors(true);
    try {
      const res = await adminService.getClinicDoctors(clinic.id);
      setClinicDoctors(res.data);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Không thể tải danh sách bác sĩ.";
      toast.error(msg);
    } finally {
      setLoadingClinicDoctors(false);
    }
  }, [clinic]);

  useEffect(() => {
    if (isOpen && clinic) {
      setSearchQuery("");
      setSearchResults([]);
      setShowDropdown(false);
      loadClinicDoctors();
    }
  }, [isOpen, clinic, loadClinicDoctors]);

  // ─── Debounce search ────────────────────────────────────────────────────────

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoadingSearch(true);
      try {
        // Dùng getDoctors từ adminService — filter phía client theo search + APPROVED
        const res = await adminService.getDoctors();
        const allDoctors: AdminDoctor[] = res.data;
        const q = searchQuery.toLowerCase();
        const filtered = allDoctors.filter(
          (d) =>
            d.status === "APPROVED" &&
            (d.name.toLowerCase().includes(q) ||
              d.specialty.name.toLowerCase().includes(q))
        );
        setSearchResults(filtered);
        setShowDropdown(true);
      } catch {
        setSearchResults([]);
      } finally {
        setLoadingSearch(false);
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  // Click-outside to close dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ─── Actions ────────────────────────────────────────────────────────────────

  const handleAdd = async (doctor: AdminDoctor) => {
    if (!clinic) return;
    // Check already in this clinic
    if (clinicDoctors.some((d) => d.id === doctor.id)) {
      toast.error("Bác sĩ này đã thuộc cơ sở hiện tại.");
      return;
    }
    setActionLoading(doctor.id);
    const toastId = toast.loading(`Đang thêm ${doctor.name}...`);
    try {
      await adminService.addDoctorToClinic(clinic.id, doctor.id);
      toast.success(`Đã thêm bác sĩ "${doctor.name}" vào cơ sở.`, { id: toastId });
      setSearchQuery("");
      setShowDropdown(false);
      loadClinicDoctors();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Không thể thêm bác sĩ.";
      toast.error(msg, { id: toastId });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (doctor: AdminDoctor) => {
    if (!clinic) return;
    setActionLoading(doctor.id);
    const toastId = toast.loading(`Đang xóa ${doctor.name}...`);
    try {
      await adminService.removeDoctorFromClinic(clinic.id, doctor.id);
      toast.success(`Đã xóa bác sĩ "${doctor.name}" khỏi cơ sở.`, { id: toastId });
      loadClinicDoctors();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Không thể xóa bác sĩ.";
      toast.error(msg, { id: toastId });
    } finally {
      setActionLoading(null);
    }
  };

  if (!isOpen || !clinic) return null;

  // IDs of doctors currently in this clinic
  const clinicDoctorIds = new Set(clinicDoctors.map((d) => d.id));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl shadow-black/50">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 shrink-0">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-teal-400" />
              Quản lý Bác sĩ
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{clinic.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* ─── Tìm & thêm bác sĩ ─── */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <UserPlus className="h-3.5 w-3.5" /> Thêm bác sĩ vào cơ sở
            </p>
            <div ref={searchRef} className="relative">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
              {loadingSearch && (
                <Loader2 className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-500 animate-spin" />
              )}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                placeholder="Tìm bác sĩ theo tên hoặc chuyên khoa..."
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm"
              />

              {/* Dropdown results */}
              {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-10 max-h-60 overflow-y-auto">
                  {searchResults.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-500">
                      Không tìm thấy bác sĩ phù hợp.
                    </div>
                  ) : (
                    searchResults.map((doctor) => {
                      const alreadyHere = clinicDoctorIds.has(doctor.id);
                      const inOtherClinic =
                        !alreadyHere && doctor.clinic !== null;
                      const isLoading = actionLoading === doctor.id;

                      return (
                        <div
                          key={doctor.id}
                          className="flex items-center gap-3 p-3 hover:bg-slate-800/50 transition-colors border-b border-slate-800/50 last:border-0"
                        >
                          <DoctorAvatar avatar={doctor.avatar} name={doctor.name} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-200 truncate">
                              {doctor.name}
                            </p>
                            <p className="text-xs text-teal-400 truncate">
                              {doctor.specialty.name}
                            </p>
                            {inOtherClinic && doctor.clinic && (
                              <p className="text-[10px] text-amber-400 mt-0.5 flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                Đang thuộc: {doctor.clinic.name}
                              </p>
                            )}
                            {alreadyHere && (
                              <p className="text-[10px] text-emerald-400 mt-0.5">
                                ✓ Đã trong cơ sở này
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleAdd(doctor)}
                            disabled={alreadyHere || inOtherClinic || isLoading}
                            title={
                              alreadyHere
                                ? "Đã trong cơ sở"
                                : inOtherClinic
                                ? `Đang thuộc cơ sở khác: ${doctor.clinic?.name}`
                                : "Thêm vào cơ sở"
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
                          >
                            {isLoading ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <UserPlus className="h-3.5 w-3.5" />
                            )}
                            Thêm
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ─── Danh sách bác sĩ hiện có ─── */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <Stethoscope className="h-3.5 w-3.5" />
              Bác sĩ thuộc cơ sở
              <span className="ml-auto text-teal-500 font-semibold normal-case tracking-normal">
                {clinicDoctors.length} người
              </span>
            </p>

            {loadingClinicDoctors ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-7 w-7 animate-spin text-teal-400" />
              </div>
            ) : clinicDoctors.length === 0 ? (
              <div className="text-center py-8 text-slate-600 text-sm border border-dashed border-slate-800 rounded-xl">
                <Users className="h-8 w-8 mx-auto mb-2 text-slate-700" />
                Chưa có bác sĩ nào trong cơ sở này.
              </div>
            ) : (
              <div className="space-y-2">
                {clinicDoctors.map((doctor) => {
                  const isLoading = actionLoading === doctor.id;
                  return (
                    <div
                      key={doctor.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/60 hover:border-slate-700 transition-colors"
                    >
                      <DoctorAvatar avatar={doctor.avatar} name={doctor.name} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-200 truncate">
                          {doctor.name}
                        </p>
                        <p className="text-xs text-teal-400 truncate">
                          {doctor.specialty.name}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {doctor.experience} năm KN
                          {doctor.hospital && ` · ${doctor.hospital}`}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemove(doctor)}
                        disabled={isLoading}
                        title="Xóa khỏi cơ sở"
                        className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/20 transition-all disabled:opacity-50 shrink-0"
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-800 shrink-0 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 bg-slate-900 border border-slate-800 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
