"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  User, Users, Phone, Calendar, MapPin, Droplets,
  AlertTriangle, ChevronRight, Plus, Check, AlertCircle, Mail, Activity, ActivitySquare
} from "lucide-react";
import { bookingProfileService, BookingProfile } from "@/services/booking-profile.service";
import Input from "@/components/common/Input";
import AddressInput from "@/components/common/AddressInput";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PatientFormData {
  fullName: string;
  phoneNumber?: string;
  email?: string;
  gender: string;
  dateOfBirth: string;
  relationship: string;
  province?: string;
  district?: string;
  ward?: string;
  street?: string;
  bloodType?: string;
  allergies?: string;
  chronicDiseases?: string;
  personalHistory?: string;
  familyHistory?: string;
}

export interface RelativePatientSnapshot {
  fullName: string;
  phoneNumber?: string;
  email?: string;
  gender?: string;
  dateOfBirth?: string;
  relationship?: string;
  province?: string;
  district?: string;
  ward?: string;
  street?: string;
  bloodType?: string;
  allergies?: string;
  chronicDiseases?: string;
  personalHistory?: string;
  familyHistory?: string;
}

interface PatientSelectorProps {
  // From parent - current user's profile
  userProfile: {
    fullName?: string | null;
    phoneNumber?: string | null;
    gender?: string | null;
    dateOfBirth?: string | null;
    address?: string | null;
    bloodType?: string | null;
    allergies?: string | null;
  } | null;

  isBookingForMyself: boolean;
  setIsBookingForMyself: (v: boolean) => void;

  // Relative form state (controlled from parent)
  relativeData: PatientFormData;
  setRelativeData: (data: PatientFormData) => void;

  saveProfile: boolean;
  setSaveProfile: (v: boolean) => void;

  bookingErrors?: Record<string, string>;
  setBookingErrors?: (fn: (prev: Record<string, string>) => Record<string, string>) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const GENDER_OPTIONS = [
  { value: "", label: "Chọn giới tính" },
  { value: "Nam", label: "Nam" },
  { value: "Nữ", label: "Nữ" },
  { value: "Khác", label: "Khác" },
];

const RELATIONSHIP_OPTIONS = [
  { value: "", label: "Chọn mối quan hệ" },
  { value: "Bố", label: "Bố" },
  { value: "Mẹ", label: "Mẹ" },
  { value: "Con", label: "Con" },
  { value: "Vợ", label: "Vợ" },
  { value: "Chồng", label: "Chồng" },
  { value: "Anh", label: "Anh" },
  { value: "Chị", label: "Chị" },
  { value: "Em", label: "Em" },
  { value: "Khác", label: "Khác" },
];

const BLOOD_TYPES = [
  { value: "", label: "Chọn nhóm máu (tùy chọn)" },
  { value: "A+", label: "A+" },
  { value: "A-", label: "A-" },
  { value: "B+", label: "B+" },
  { value: "B-", label: "B-" },
  { value: "AB+", label: "AB+" },
  { value: "AB-", label: "AB-" },
  { value: "O+", label: "O+" },
  { value: "O-", label: "O-" },
];

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("vi-VN");
  } catch {
    return dateStr;
  }
}

function isProfileComplete(profile: PatientSelectorProps["userProfile"]): boolean {
  if (!profile) return false;
  return !!(profile.fullName && profile.gender && profile.dateOfBirth);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PatientSelector({
  userProfile,
  isBookingForMyself,
  setIsBookingForMyself,
  relativeData,
  setRelativeData,
  saveProfile,
  setSaveProfile,
  bookingErrors = {},
  setBookingErrors,
}: PatientSelectorProps) {
  const [savedProfiles, setSavedProfiles] = useState<BookingProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Load saved profiles on mount
  useEffect(() => {
    async function loadProfiles() {
      setLoadingProfiles(true);
      try {
        const data = await bookingProfileService.getMyProfiles();
        setSavedProfiles(data);
        if (data.length > 0) setSelectedProfileId(data[0].id);
      } catch {
        // ignore silently
      } finally {
        setLoadingProfiles(false);
      }
    }
    loadProfiles();
  }, []);

  // When a saved profile is selected, auto-fill form
  const handleSelectSaved = (profile: BookingProfile) => {
    setSelectedProfileId(profile.id);
    setIsCreatingNew(false);
    setRelativeData({
      fullName: profile.fullName,
      phoneNumber: profile.phone || "",
      email: profile.email || "",
      gender: profile.gender || "",
      dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : "",
      relationship: profile.relationship,
      province: profile.province || "",
      district: profile.district || "",
      ward: profile.ward || "",
      street: profile.street || "",
      bloodType: profile.bloodType || "",
      allergies: profile.allergies || "",
      chronicDiseases: profile.chronicDiseases || "",
      personalHistory: profile.personalHistory || "",
      familyHistory: profile.familyHistory || ""
    });
    if (setBookingErrors) {
      setBookingErrors(prev => ({ ...prev, fullName: "", relationship: "" }));
    }
  };

  const handleStartNew = () => {
    setIsCreatingNew(true);
    setSelectedProfileId("");
    setRelativeData({
      fullName: "", phoneNumber: "", email: "", gender: "", dateOfBirth: "", relationship: "",
      province: "", district: "", ward: "", street: "", bloodType: "", allergies: "",
      chronicDiseases: "", personalHistory: "", familyHistory: ""
    });
  };

  const handleSwitchToMyself = () => {
    setIsBookingForMyself(true);
    setIsCreatingNew(false);
  };

  const handleSwitchToRelative = () => {
    setIsBookingForMyself(false);
    if (savedProfiles.length === 0) {
      setIsCreatingNew(true);
    } else if (savedProfiles.length > 0 && !selectedProfileId) {
      handleSelectSaved(savedProfiles[0]);
    }
  };

  const profileComplete = isProfileComplete(userProfile);

  return (
    <div className="space-y-4">
      {/* Toggle buttons */}
      <div className="flex rounded-xl border border-slate-200 overflow-hidden">
        <button
          type="button"
          onClick={handleSwitchToMyself}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-all ${
            isBookingForMyself
              ? "bg-teal-600 text-white shadow-inner"
              : "bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          <User className="w-4 h-4" />
          Cho bản thân
        </button>
        <button
          type="button"
          onClick={handleSwitchToRelative}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-all border-l border-slate-200 ${
            !isBookingForMyself
              ? "bg-teal-600 text-white shadow-inner"
              : "bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Users className="w-4 h-4" />
          Cho người thân
        </button>
      </div>

      {/* ── SELF VIEW ─────────────────────────────────────────────────────── */}
      {isBookingForMyself && (
        <div className="space-y-3">
          {/* Incomplete profile warning */}
          {!profileComplete && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800 leading-relaxed">
                Hồ sơ của bạn chưa đầy đủ. Vui lòng{" "}
                <Link href="/profile" className="font-semibold underline hover:text-amber-900">
                  cập nhật tại trang cá nhân
                </Link>{" "}
                để đặt lịch chính xác hơn.
              </p>
            </div>
          )}

          {/* User info card */}
          <div className="border border-teal-200 bg-teal-50/60 rounded-2xl p-4 space-y-3">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {userProfile?.fullName?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div>
                <p className="font-bold text-teal-900 text-sm">{userProfile?.fullName || "—"}</p>
                <p className="text-xs text-teal-600">Hồ sơ chính của bạn</p>
              </div>
              {profileComplete && (
                <div className="ml-auto flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
                  <Check className="w-3 h-3" />
                  Đầy đủ
                </div>
              )}
            </div>

            {/* Fields */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-1 border-t border-teal-200/60">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Phone className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                <span className="truncate">{userProfile?.phoneNumber || "Chưa cập nhật"}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <User className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                <span>{userProfile?.gender || "Chưa cập nhật"}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Calendar className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                <span>{formatDate(userProfile?.dateOfBirth) || "Chưa cập nhật"}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Droplets className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                <span>{userProfile?.bloodType || "Chưa cập nhật"}</span>
              </div>
              {userProfile?.address && (
                <div className="flex items-start gap-2 text-xs text-slate-600 col-span-2">
                  <MapPin className="w-3.5 h-3.5 text-teal-500 shrink-0 mt-0.5" />
                  <span className="line-clamp-1">{userProfile.address}</span>
                </div>
              )}
              {userProfile?.allergies && (
                <div className="flex items-start gap-2 text-xs text-slate-600 col-span-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <span className="line-clamp-1">Dị ứng: {userProfile.allergies}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── RELATIVE VIEW ──────────────────────────────────────────────────── */}
      {!isBookingForMyself && (
        <div className="space-y-4">
          {/* Saved profile cards */}
          {!isCreatingNew && !loadingProfiles && savedProfiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-600">Chọn hồ sơ đã lưu:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {savedProfiles.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectSaved(p)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedProfileId === p.id
                        ? "border-teal-500 bg-teal-50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-teal-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-sm text-slate-800">{p.fullName}</p>
                      {selectedProfileId === p.id && (
                        <Check className="w-4 h-4 text-teal-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {p.relationship} {p.gender ? `· ${p.gender}` : ""} {p.dateOfBirth ? `· ${new Date(p.dateOfBirth).getFullYear()}` : ""}
                    </p>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={handleStartNew}
                className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-800 mt-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Nhập tên mới
              </button>
            </div>
          )}

          {/* Form: new entry or editing selected profile */}
          {(isCreatingNew || savedProfiles.length === 0 || selectedProfileId) && (
            <div className="space-y-6 p-5 border border-slate-200 rounded-2xl bg-white shadow-sm">
              {isCreatingNew && savedProfiles.length > 0 && (
                <button
                  type="button"
                  onClick={() => { setIsCreatingNew(false); setSelectedProfileId(savedProfiles[0].id); handleSelectSaved(savedProfiles[0]); }}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-teal-600 font-medium -mt-2 -ml-1 mb-2"
                >
                  ← Chọn từ danh sách
                </button>
              )}

              <p className="text-sm font-bold text-slate-800 border-b pb-2">
                {isCreatingNew ? "Thông tin người thân mới" : "Thông tin (có thể chỉnh sửa)"}
              </p>

              {/* Thông tin cá nhân */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 text-slate-700">Họ và tên <span className="text-red-500">*</span></label>
                    <Input
                      value={relativeData.fullName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setRelativeData({ ...relativeData, fullName: e.target.value });
                        if (setBookingErrors) setBookingErrors(prev => ({ ...prev, fullName: "" }));
                      }}
                      placeholder="Dũng Nguyễn"
                      className={`!py-2.5 !text-sm ${bookingErrors.fullName ? "!border-red-400" : ""}`}
                    />
                    {bookingErrors.fullName && <p className="text-xs text-red-500 mt-1">{bookingErrors.fullName}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 text-slate-700">Giới tính</label>
                    <select
                      value={relativeData.gender}
                      onChange={(e) => setRelativeData({ ...relativeData, gender: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
                    >
                      {GENDER_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 text-slate-700">Ngày sinh</label>
                    <Input
                      type="date"
                      value={relativeData.dateOfBirth}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRelativeData({ ...relativeData, dateOfBirth: e.target.value })}
                      className="!py-2.5 !text-sm w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 text-slate-700">Email</label>
                    <Input
                      value={relativeData.email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRelativeData({ ...relativeData, email: e.target.value })}
                      placeholder="heotaixanh121212@gmail.com"
                      className="!py-2.5 !text-sm w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-slate-700">Mối quan hệ <span className="text-red-500">*</span></label>
                  <select
                    value={relativeData.relationship}
                    onChange={(e) => {
                      setRelativeData({ ...relativeData, relationship: e.target.value });
                      if (setBookingErrors) setBookingErrors(prev => ({ ...prev, relationship: "" }));
                    }}
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white ${
                      bookingErrors.relationship ? "border-red-400" : "border-slate-300"
                    }`}
                  >
                    {RELATIONSHIP_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {bookingErrors.relationship && <p className="text-xs text-red-500 mt-1">{bookingErrors.relationship}</p>}
                </div>
              </div>

              {/* Địa chỉ hiện tại */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <p className="text-sm font-bold text-slate-800">Địa chỉ hiện tại</p>
                <AddressInput
                  value=""
                  onChange={() => {}}
                  onAddressChange={(parts) => {
                    setRelativeData({
                      ...relativeData,
                      province: parts.province,
                      district: parts.district,
                      ward: parts.ward,
                      street: parts.street
                    });
                  }}
                  existingAddress={[relativeData.street, relativeData.ward, relativeData.district, relativeData.province].filter(Boolean).join(", ")}
                />
              </div>

              {/* Thông tin sức khỏe cơ bản */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5 text-teal-700">
                  <Activity className="w-4 h-4" />
                  Thông tin sức khỏe cơ bản
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 text-slate-700">Nhóm máu</label>
                    <select
                      value={relativeData.bloodType}
                      onChange={(e) => setRelativeData({ ...relativeData, bloodType: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
                    >
                      {BLOOD_TYPES.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 text-slate-700">Tiền sử dị ứng</label>
                    <Input
                      value={relativeData.allergies}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRelativeData({ ...relativeData, allergies: e.target.value })}
                      placeholder="không có"
                      className="!py-2.5 !text-sm w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-slate-700">Bệnh lý nền / Mãn tính</label>
                  <Input
                    value={relativeData.chronicDiseases}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRelativeData({ ...relativeData, chronicDiseases: e.target.value })}
                    placeholder="không có"
                    className="!py-2.5 !text-sm w-full"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 text-slate-700">Tiền sử phẫu thuật / Cá nhân</label>
                    <textarea
                      value={relativeData.personalHistory}
                      onChange={(e) => setRelativeData({ ...relativeData, personalHistory: e.target.value })}
                      placeholder="không có"
                      rows={3}
                      className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 text-slate-700">Tiền sử bệnh gia đình</label>
                    <textarea
                      value={relativeData.familyHistory}
                      onChange={(e) => setRelativeData({ ...relativeData, familyHistory: e.target.value })}
                      placeholder="Ghi chú về bệnh lý di truyền trong gia đình..."
                      rows={3}
                      className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Save profile checkbox (only for new entries) */}
              {isCreatingNew && (
                <label className="flex items-center gap-2.5 cursor-pointer pt-3 border-t border-slate-100">
                  <input
                    type="checkbox"
                    checked={saveProfile}
                    onChange={(e) => setSaveProfile(e.target.checked)}
                    className="w-4 h-4 accent-teal-600 rounded"
                  />
                  <span className="text-sm font-semibold text-teal-800 leading-relaxed">
                    Lưu hồ sơ này để dùng cho những lần đặt sau
                  </span>
                </label>
              )}
            </div>
          )}

          {/* Empty state — no profiles saved yet */}
          {!isCreatingNew && !loadingProfiles && savedProfiles.length === 0 && (
            <div className="text-center py-6 border border-dashed border-slate-300 rounded-xl">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500 mb-3">Chưa có hồ sơ người thân</p>
              <button
                type="button"
                onClick={handleStartNew}
                className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:underline mx-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                Nhập tên người thân
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Export helper to build patientInfo snapshot from form ────────────────────

export function buildRelativeSnapshot(data: PatientFormData): RelativePatientSnapshot {
  return {
    fullName: data.fullName,
    phoneNumber: data.phoneNumber || undefined,
    email: data.email || undefined,
    gender: data.gender || undefined,
    dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString() : undefined,
    relationship: data.relationship || undefined,
    province: data.province || undefined,
    district: data.district || undefined,
    ward: data.ward || undefined,
    street: data.street || undefined,
    bloodType: data.bloodType || undefined,
    allergies: data.allergies || undefined,
    chronicDiseases: data.chronicDiseases || undefined,
    personalHistory: data.personalHistory || undefined,
    familyHistory: data.familyHistory || undefined
  };
}
