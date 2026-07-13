"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { patientProfileService, PatientProfile } from "@/services/patient-profile.service";
import { appointmentService } from "@/services/appointment.service";
import { DoctorSchedule, TimeSlot } from "@/types/doctor";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Alert from "@/components/common/Alert";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Link from "next/link";
import {
  X, User, CheckCircle2, CalendarDays, Clock, ChevronRight,
  ChevronLeft, ClipboardCheck, Plus, UserCircle2, AlertTriangle
} from "lucide-react";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Doctor ID for doctor booking */
  doctorId?: string;
  doctorName?: string;
  doctorClinicId?: string;
  doctorSchedules?: DoctorSchedule[];
  doctorBookedCounts?: Record<string, number>;
  /** Package ID for package booking */
  packageId?: string;
  packageName?: string;
  packageBookedCounts?: Record<string, number>;
  onSuccess?: (appointmentId: string) => void;
}

type Step = 1 | 2 | 3;

interface NewProfileData {
  fullName: string;
  phoneNumber: string;
  gender: string;
  dateOfBirth: string;
  cccd: string;
}

interface SlotWithMeta extends TimeSlot {
  isBooked?: boolean;
  isTooClose?: boolean;
  remaining?: number;
}

const MAX_PROFILES = 3;

const getNext7Days = () => {
  const days = [];
  const weekdays = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    days.push({
      dateString: `${yyyy}-${mm}-${dd}`,
      dayOfWeek: date.getDay(),
      displayDay: weekdays[date.getDay()],
      displayDate: `${dd}/${mm}`,
    });
  }
  return days;
};

const generateHourlySlots = (schedules: DoctorSchedule[]): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  schedules.forEach((sch) => {
    const [startHour] = sch.startTime.split(":").map(Number);
    const [endHour] = sch.endTime.split(":").map(Number);
    for (let h = startHour; h < endHour; h++) {
      const start = `${String(h).padStart(2, "0")}:00`;
      const end = `${String(h + 1).padStart(2, "0")}:00`;
      slots.push({ id: `${sch.id}-${start}`, startTime: start, endTime: end });
    }
  });
  return slots;
};

const generatePackageSlots = (): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  for (let h = 8; h < 17; h++) {
    if (h === 12) continue;
    const start = `${String(h).padStart(2, "0")}:00`;
    const end = `${String(h + 1).padStart(2, "0")}:00`;
    slots.push({ id: `pkg-slot-${h}`, startTime: start, endTime: end });
  }
  return slots;
};

export default function BookingModal({
  isOpen,
  onClose,
  doctorId,
  doctorName,
  doctorClinicId,
  doctorSchedules = [],
  doctorBookedCounts = {},
  packageId,
  packageName,
  packageBookedCounts = {},
  onSuccess,
}: BookingModalProps) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  const [step, setStep] = useState<Step>(1);
  const [profiles, setProfiles] = useState<PatientProfile[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newProfileData, setNewProfileData] = useState<NewProfileData>({
    fullName: "", phoneNumber: "", gender: "", dateOfBirth: "", cccd: "",
  });
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<SlotWithMeta[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<SlotWithMeta | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  const next7Days = getNext7Days();
  const isDoctor = !!doctorId;
  const titleName = doctorName || packageName || "";

  useEffect(() => {
    if (!isOpen || !isAuthenticated || user?.role !== "USER") return;
    setProfilesLoading(true);
    patientProfileService.getMyProfiles()
      .then((data) => {
        setProfiles(data);
        const primary = data.find((p) => p.isPrimary);
        if (primary) setSelectedProfileId(primary.id);
        else if (data.length > 0) setSelectedProfileId(data[0].id);
      })
      .catch(console.error)
      .finally(() => setProfilesLoading(false));
  }, [isOpen, isAuthenticated, user]);

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setSelectedDate("");
      setSelectedSlot(null);
      setAvailableSlots([]);
      setNotes("");
      setError(null);
      setSuccessId(null);
      setIsCreatingNew(false);
      setNewProfileData({ fullName: "", phoneNumber: "", gender: "", dateOfBirth: "", cccd: "" });
    }
  }, [isOpen]);

  const handleDateChange = useCallback((dateString: string, dayOfWeek: number) => {
    setSelectedDate(dateString);
    setSelectedSlot(null);
    setError(null);

    let rawSlots: TimeSlot[];
    if (isDoctor) {
      const daySchedules = doctorSchedules.filter(
        (s) => s.dayOfWeek === dayOfWeek && s.isAvailable
      );
      rawSlots = generateHourlySlots(daySchedules);
    } else {
      rawSlots = generatePackageSlots();
    }

    const bookedCounts = isDoctor ? doctorBookedCounts : packageBookedCounts;
    const mapped = rawSlots.map((slot) => {
      const dt = new Date(`${dateString}T${slot.startTime}:00`);
      const now = new Date();
      const isTooClose = dt.getTime() <= now.getTime() + 2 * 60 * 60 * 1000;
      const isoStr = dt.toISOString();
      const count = bookedCounts[isoStr] || 0;
      const remaining = 20 - count;
      return { ...slot, isTooClose, isBooked: count >= 20, remaining };
    });
    setAvailableSlots(mapped);
  }, [isDoctor, doctorSchedules, doctorBookedCounts, packageBookedCounts]);

  const validateStep1 = () => {
    if (!isCreatingNew && !selectedProfileId) {
      setError("Vui lòng chọn hồ sơ người đi khám.");
      return false;
    }
    if (isCreatingNew && !newProfileData.fullName.trim()) {
      setError("Vui lòng nhập họ tên người khám.");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!selectedDate || !selectedSlot) {
      setError("Vui lòng chọn ngày và giờ khám.");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError(null);
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep((s) => (s < 3 ? (s + 1) as Step : s));
  };

  const handleBack = () => {
    setError(null);
    setStep((s) => (s > 1 ? (s - 1) as Step : s));
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) { router.push("/login"); return; }
    
    if (user?.role !== "USER" && user?.role !== "DOCTOR") {
      setError("Chỉ tài khoản người bệnh hoặc bác sĩ mới được phép đặt lịch khám.");
      return;
    }

    if (user?.role === "DOCTOR" && doctorId === user?.doctorId) {
       setError("Bạn không thể tự đặt lịch khám với chính mình.");
       return;
    }

    if (isDoctor && !doctorClinicId) {
       setError("Không tìm thấy thông tin bệnh viện. Vui lòng thử lại.");
       return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const appointmentDate = new Date(`${selectedDate}T${selectedSlot!.startTime}:00`).toISOString();
      const response = await appointmentService.createAppointment({
        doctorId: doctorId,
        clinicId: doctorClinicId || "default-clinic-id", // Package might not need clinicId or it's handled backend
        packageId: packageId,
        appointmentDate,
        notes: notes.trim() || undefined,
        patientProfileId: isCreatingNew ? undefined : selectedProfileId,
        newPatientProfile: isCreatingNew ? { ...newProfileData, isTemporary: true } : undefined,
      });
      setSuccessId(response.appointment.id);
      if (onSuccess) onSuccess(response.appointment.id);
      setTimeout(() => router.push(`/payment/${response.appointment.id}`), 1800);
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "message" in err
        ? String((err as { message: unknown }).message)
        : "Không thể đặt lịch. Vui lòng thử lại.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const atMaxProfiles = profiles.length >= MAX_PROFILES;
  const selectedProfile = profiles.find((p) => p.id === selectedProfileId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
          <div>
            <p className="text-xs text-teal-600 font-semibold uppercase tracking-wider mb-0.5">
              {isDoctor ? "Đặt lịch bác sĩ" : "Đặt lịch gói khám"}
            </p>
            <h2 className="text-lg font-bold text-slate-900 truncate max-w-sm">{titleName}</h2>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-3 shrink-0 bg-slate-50/70 border-b border-slate-100">
          <div className="flex items-center gap-2">
            {([
              { n: 1, label: "Người khám" },
              { n: 2, label: "Ngày & Giờ" },
              { n: 3, label: "Xác nhận" },
            ] as { n: Step; label: string }[]).map((s, i) => (
              <React.Fragment key={s.n}>
                <div className="flex items-center gap-1.5">
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step > s.n
                      ? "bg-teal-500 text-white"
                      : step === s.n
                      ? "bg-teal-600 text-white ring-4 ring-teal-100"
                      : "bg-slate-200 text-slate-500"
                  }`}>
                    {step > s.n ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.n}
                  </div>
                  <span className={`text-xs font-semibold hidden sm:block ${step === s.n ? "text-teal-700" : "text-slate-400"}`}>
                    {s.label}
                  </span>
                </div>
                {i < 2 && <div className={`flex-1 h-0.5 rounded-full transition-all ${step > s.n ? "bg-teal-400" : "bg-slate-200"}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
              {!isAuthenticated ? (
                <div className="text-center py-10 space-y-4">
                  <UserCircle2 className="h-14 w-14 text-slate-300 mx-auto" />
                  <p className="text-slate-600 font-semibold">Bạn chưa đăng nhập</p>
                  <p className="text-slate-400 text-sm">Vui lòng đăng nhập để đặt lịch và quản lý hồ sơ khám.</p>
                  <Link href="/login">
                    <Button variant="teal" className="mt-2">Đăng nhập ngay</Button>
                  </Link>
                </div>
              ) : profilesLoading ? (
                <div className="flex justify-center py-10"><LoadingSpinner /></div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <User className="h-4 w-4 text-teal-600" />
                      Chọn người đi khám
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${atMaxProfiles ? "bg-orange-100 text-orange-600" : "bg-slate-100 text-slate-500"}`}>
                        {profiles.length}/{MAX_PROFILES}
                      </span>
                    </h3>
                    {!isCreatingNew && (
                      <button
                        type="button"
                        onClick={() => {
                          if (atMaxProfiles) return;
                          setIsCreatingNew(true);
                          setSelectedProfileId("");
                        }}
                        disabled={atMaxProfiles}
                        title={atMaxProfiles ? `Đã đạt tối đa ${MAX_PROFILES} hồ sơ.` : "Nhập thông tin mới"}
                        className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${
                          atMaxProfiles
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                            : "bg-teal-50 text-teal-700 hover:bg-teal-100 cursor-pointer"
                        }`}
                      >
                        <Plus className="h-3 w-3" />
                        {atMaxProfiles ? `Đã đủ ${MAX_PROFILES} hồ sơ` : "Nhập thông tin mới"}
                      </button>
                    )}
                    {isCreatingNew && (
                      <button
                        type="button"
                        onClick={() => { setIsCreatingNew(false); if (profiles.length > 0) setSelectedProfileId(profiles[0].id); }}
                        className="text-xs font-semibold text-slate-500 hover:text-teal-600 px-2 py-1 rounded-lg hover:bg-slate-50"
                      >
                        ← Chọn hồ sơ có sẵn
                      </button>
                    )}
                  </div>

                  {atMaxProfiles && !isCreatingNew && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-orange-50 border border-orange-100 text-xs text-orange-700">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>Bạn đã có <strong>{MAX_PROFILES} hồ sơ</strong>. Hãy vào <Link href="/profile" className="underline font-bold" onClick={onClose}>Trang cá nhân</Link> để xóa hồ sơ cũ nếu muốn tạo mới.</span>
                    </div>
                  )}

                  {!isCreatingNew && (
                    <>
                      {profiles.length === 0 ? (
                        <div className="text-center py-8 border border-dashed border-slate-200 rounded-2xl space-y-3">
                          <User className="h-10 w-10 text-slate-300 mx-auto" />
                          <p className="text-sm font-semibold text-slate-600">Chưa có hồ sơ nào</p>
                          <p className="text-xs text-slate-400">Bấm "Nhập thông tin mới" để tạo hồ sơ đầu tiên</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {profiles.map((p) => {
                            const isSelected = selectedProfileId === p.id;
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => { setSelectedProfileId(p.id); setIsCreatingNew(false); }}
                                className={`relative p-4 rounded-2xl border-2 text-left transition-all duration-150 cursor-pointer group ${
                                  isSelected
                                    ? "border-teal-500 bg-teal-50 shadow-md shadow-teal-500/10 scale-[1.02]"
                                    : "border-slate-200 bg-white hover:border-teal-300 hover:shadow-sm hover:scale-[1.01]"
                                }`}
                              >
                                {isSelected && (
                                  <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-teal-500 flex items-center justify-center shadow-sm">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                                  </div>
                                )}
                                <div className={`h-9 w-9 rounded-xl flex items-center justify-center mb-3 font-bold text-sm ${isSelected ? "bg-teal-100 text-teal-700" : "bg-slate-100 text-slate-500"}`}>
                                  {p.fullName.charAt(0).toUpperCase()}
                                </div>
                                <p className={`font-bold text-sm leading-tight ${isSelected ? "text-teal-800" : "text-slate-800"}`}>
                                  {p.fullName}
                                </p>
                                <p className={`text-xs mt-1 ${isSelected ? "text-teal-600" : "text-slate-400"}`}>
                                  {p.phoneNumber || "Chưa có SĐT"}
                                </p>
                                {p.isPrimary && (
                                  <span className="inline-block mt-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-700">
                                    Hồ sơ chính
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      <p className="text-xs text-slate-400 text-right">
                        <Link href="/profile" className="hover:text-teal-600 underline underline-offset-2" onClick={onClose}>
                          Quản lý hồ sơ →
                        </Link>
                      </p>
                    </>
                  )}

                  {isCreatingNew && (
                    <div className="p-4 rounded-2xl border border-teal-200 bg-teal-50/40 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
                      <p className="text-xs text-slate-500 italic">
                        Thông tin này sẽ được lưu tạm thời cho lịch hẹn này.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold mb-1 text-slate-700">Họ và tên *</label>
                          <Input
                            value={newProfileData.fullName}
                            onChange={(e) => setNewProfileData({ ...newProfileData, fullName: e.target.value })}
                            placeholder="Nguyễn Văn A"
                            className="!py-2 !text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1 text-slate-700">Số điện thoại</label>
                          <Input
                            value={newProfileData.phoneNumber}
                            onChange={(e) => setNewProfileData({ ...newProfileData, phoneNumber: e.target.value })}
                            placeholder="0987654321"
                            className="!py-2 !text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1 text-slate-700">Ngày sinh</label>
                          <Input
                            type="date"
                            value={newProfileData.dateOfBirth}
                            onChange={(e) => setNewProfileData({ ...newProfileData, dateOfBirth: e.target.value })}
                            className="!py-2 !text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1 text-slate-700">Giới tính</label>
                          <select
                            className="w-full border border-slate-200 p-2 rounded-xl text-sm bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                            value={newProfileData.gender}
                            onChange={(e) => setNewProfileData({ ...newProfileData, gender: e.target.value })}
                          >
                            <option value="">Chọn giới tính</option>
                            <option value="Nam">Nam</option>
                            <option value="Nữ">Nữ</option>
                            <option value="Khác">Khác</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
              <div className="space-y-2">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-teal-600" />
                  Chọn ngày khám
                </h3>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {next7Days.map((day) => (
                    <button
                      key={day.dateString}
                      type="button"
                      onClick={() => handleDateChange(day.dateString, day.dayOfWeek)}
                      className={`flex flex-col items-center p-2.5 rounded-xl border text-center transition-all duration-150 ${
                        selectedDate === day.dateString
                          ? "bg-teal-600 border-teal-600 text-white shadow-md scale-[1.03]"
                          : "bg-white border-slate-200 text-slate-700 hover:border-teal-400 hover:bg-teal-50"
                      }`}
                    >
                      <span className="text-[9px] uppercase font-bold tracking-widest opacity-80">{day.displayDay}</span>
                      <span className="text-sm font-bold mt-0.5">{day.displayDate}</span>
                    </button>
                  ))}
                </div>
              </div>

              {selectedDate && (
                <div className="space-y-2 pt-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4 text-teal-600" />
                    Chọn giờ khám
                  </h3>
                  {availableSlots.length === 0 ? (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 text-sm text-amber-800">
                      Không có khung giờ nào trong ngày này. Vui lòng chọn ngày khác.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                      {availableSlots.map((slot) => {
                        const disabled = slot.isBooked || slot.isTooClose;
                        const isSelected = selectedSlot?.id === slot.id;
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            disabled={disabled}
                            onClick={() => setSelectedSlot(slot)}
                            title={slot.isTooClose ? "Giờ quá gần, cần đặt trước 2 tiếng" : slot.isBooked ? "Đã hết chỗ" : undefined}
                            className={`py-2.5 px-2 rounded-xl text-xs font-semibold border transition-all duration-150 relative ${
                              disabled
                                ? "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed line-through"
                                : isSelected
                                ? "border-teal-500 bg-teal-600 text-white shadow-md scale-[1.03]"
                                : "border-slate-200 bg-white text-slate-700 hover:border-teal-400 hover:bg-teal-50 cursor-pointer"
                            }`}
                          >
                            {slot.startTime} - {slot.endTime}
                            {!disabled && slot.remaining !== undefined && slot.remaining <= 5 && (
                              <span className="block text-[9px] font-semibold text-orange-500 mt-0.5">Còn {slot.remaining} chỗ</span>
                            )}
                            {slot.isBooked && (
                              <span className="block text-[9px] text-slate-300 mt-0.5">Hết chỗ</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-teal-600" />
                Xác nhận thông tin đặt lịch
              </h3>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 overflow-hidden">
                <div className="px-5 py-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-teal-100 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="h-4 w-4 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Người khám</p>
                      <p className="font-bold text-slate-800 text-sm">
                        {isCreatingNew ? newProfileData.fullName : (selectedProfile?.fullName || "—")}
                      </p>
                      {!isCreatingNew && selectedProfile?.phoneNumber && (
                        <p className="text-xs text-slate-500">{selectedProfile.phoneNumber}</p>
                      )}
                    </div>
                  </div>

                  <div className="h-px bg-slate-200" />

                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-teal-100 flex items-center justify-center shrink-0 mt-0.5">
                      <CalendarDays className="h-4 w-4 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Thời gian</p>
                      <p className="font-bold text-slate-800 text-sm">
                        {selectedSlot?.startTime} – {selectedSlot?.endTime}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(selectedDate).toLocaleDateString("vi-VN", {
                          weekday: "long", day: "2-digit", month: "2-digit", year: "numeric"
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Ghi chú (không bắt buộc)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Mô tả triệu chứng, yêu cầu đặc biệt..."
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all shadow-sm resize-none placeholder:text-slate-400"
                />
              </div>

              {successId && (
                <Alert
                  type="success"
                  message="Đặt lịch thành công! Đang chuyển sang trang thanh toán..."
                />
              )}
            </div>
          )}

          {error && <Alert type="error" message={error} />}
        </div>

        {isAuthenticated && (
          <div className="shrink-0 flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-white">
            <div>
              {step > 1 && !successId && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Quay lại
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="text-sm text-slate-400 hover:text-slate-700 font-semibold px-3 py-2"
              >
                Hủy
              </button>
              {step < 3 ? (
                <Button
                  variant="teal"
                  className="flex items-center gap-1.5 px-6 rounded-xl"
                  onClick={handleNext}
                  disabled={step === 1 && !isCreatingNew && !selectedProfileId && profiles.length === 0}
                >
                  Tiếp theo
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="teal"
                  className="flex items-center gap-2 px-6 rounded-xl"
                  onClick={handleSubmit}
                  isLoading={submitting}
                  disabled={submitting || !!successId}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Xác nhận đặt lịch
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
