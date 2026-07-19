"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { appointmentService } from "@/services/appointment.service";
import { voucherService } from "@/services/voucher.service";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import { ArrowLeft, CalendarDays, Clock, Package, UserCircle2, Plus, Tag, Check } from "lucide-react";
import Link from "next/link";
import { packageService, MedicalPackage } from "@/services/package.service";
import { bookingProfileService, BookingProfile } from "@/services/booking-profile.service";
import BookingProgress from "@/components/ui/BookingProgress";
import { useBooking } from "@/hooks/useBooking";

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  isTooClose?: boolean;
  isBooked?: boolean;
  remaining?: number;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PackageBookingPage({ params }: PageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { id } = use(params);
  const { isAuthenticated, user } = useAuth();
  const {
    setSelectedDate: setGlobalDate,
    setSelectedSlot: setGlobalSlot,
    resetBooking
  } = useBooking();

  // Voucher (passed from detail page via query)
  const [voucherCode, setVoucherCode] = useState(searchParams.get("voucherCode") || "");
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherError, setVoucherError] = useState("");
  const [voucherResult, setVoucherResult] = useState<{
    valid: boolean;
    discountAmount?: number;
    finalDeposit?: number;
    voucher?: any;
    message?: string;
  } | null>(null);

  const [pkg, setPkg] = useState<MedicalPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookedCounts, setBookedCounts] = useState<Record<string, number>>({});

  // Patient Profiles
  const [profiles, setProfiles] = useState<BookingProfile[]>([]);
  const [isBookingForMyself, setIsBookingForMyself] = useState<boolean>(true);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newProfileData, setNewProfileData] = useState({ fullName: "" });

  const [agreedToPolicy, setAgreedToPolicy] = useState(false);
  const [bookingErrors, setBookingErrors] = useState<Record<string, string>>({});

  const validateBookingForm = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!isBookingForMyself && isCreatingNew && !newProfileData.fullName.trim()) {
      errors.fullName = "Họ và tên không được để trống.";
    }
    if (!isBookingForMyself && !isCreatingNew && !selectedProfileId) {
      errors.profile = "Vui lòng chọn hồ sơ người thân.";
    }
    return errors;
  };

  // Booking Flow States
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [notes, setNotes] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingMessage, setBookingMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Auto-apply voucher if passed from detail page
  useEffect(() => {
    const initialCode = searchParams.get("voucherCode");
    if (initialCode) setVoucherCode(initialCode);
  }, [searchParams]);

  // Fetch package & profiles on mount
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const detailRes = await packageService.getPackageById(id);
        if (detailRes) {
          setPkg(detailRes);
          try {
            const slotsRes = await packageService.getBookedSlots(id);
            if (slotsRes.bookedCounts) setBookedCounts(slotsRes.bookedCounts);
          } catch (slotErr) {
            console.error("Failed to load booked slots", slotErr);
          }
        } else {
          setError("Không thể tải chi tiết gói khám.");
        }
        if (isAuthenticated && user?.role === "USER") {
          try {
            const myProfiles = await bookingProfileService.getMyProfiles();
            setProfiles(myProfiles);
            if (myProfiles.length > 0) setSelectedProfileId(myProfiles[0].id);
          } catch (profileErr) {
            console.error("Failed to load profiles", profileErr);
          }
        }
      } catch (err: unknown) {
        const errorMsg = err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Lỗi tải dữ liệu";
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, isAuthenticated, user]);

  const handleApplyVoucher = async () => {
    if (!pkg || !voucherCode.trim()) return;
    const depositAmt = Math.round((pkg.price * pkg.depositPercentage) / 100);
    try {
      setVoucherLoading(true);
      setVoucherError("");
      const result = await voucherService.validateVoucher(voucherCode.trim(), depositAmt, undefined, pkg.id);
      if (result.valid) {
        setVoucherResult(result);
      } else {
        setVoucherError(result.message);
        setVoucherResult(null);
      }
    } catch (err: any) {
      setVoucherError(err.message || "Lỗi khi áp dụng mã");
      setVoucherResult(null);
    } finally {
      setVoucherLoading(false);
    }
  };

  const getNext7Days = () => {
    const days = [];
    const weekdays = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
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

  const next7Days = getNext7Days();

  const generateHourlySlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    let slotId = 1;
    for (let h = 8; h < 17; h++) {
      if (h === 12) continue;
      slots.push({
        id: `slot_${slotId++}`,
        startTime: h.toString().padStart(2, "0") + ":00",
        endTime: (h + 1).toString().padStart(2, "0") + ":00",
      });
    }
    return slots;
  };

  const handleDateChange = (dateString: string) => {
    setSelectedDate(dateString);
    setGlobalDate(dateString);
    setSelectedSlot(null);
    setGlobalSlot(null);
    setBookingMessage(null);
    const allSlots = generateHourlySlots();
    const mappedSlots = allSlots.map(slot => {
      const slotDateTime = new Date(`${dateString}T${slot.startTime}:00`);
      const now = new Date();
      const isTooClose = slotDateTime.getTime() <= now.getTime() + 2 * 60 * 60 * 1000;
      const isoString = slotDateTime.toISOString();
      const count = bookedCounts[isoString] || 0;
      const remaining = 20 - count;
      const isBooked = count >= 20;
      return { ...slot, isTooClose, isBooked, remaining };
    });
    setAvailableTimeSlots(mappedSlots);
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { router.push("/login"); return; }
    if (user?.role !== "USER") {
      setBookingMessage({ type: "error", text: "Chỉ tài khoản người bệnh mới được phép đặt lịch." });
      return;
    }
    const bErrors = validateBookingForm();
    setBookingErrors(bErrors);
    if (Object.keys(bErrors).length > 0) {
      setBookingMessage({ type: "error", text: "Vui lòng kiểm tra lại thông tin người đi khám." });
      return;
    }
    if (!agreedToPolicy) {
      setBookingMessage({ type: "error", text: "Vui lòng đồng ý với chính sách bảo mật." });
      return;
    }
    if (!selectedDate || !selectedSlot) {
      setBookingMessage({ type: "error", text: "Vui lòng chọn ngày và khung giờ khám bệnh." });
      return;
    }

    setBookingLoading(true);
    setBookingMessage(null);
    try {
      const appointmentDateTime = new Date(`${selectedDate}T${selectedSlot.startTime}:00`);
      const response = await appointmentService.createAppointment({
        appointmentDate: appointmentDateTime.toISOString(),
        notes: notes.trim() || undefined,
        packageId: pkg!.id,
        isBookingForMyself,
        relativeProfileId: !isBookingForMyself && !isCreatingNew ? selectedProfileId : undefined,
        otherProfileName: !isBookingForMyself && isCreatingNew ? newProfileData.fullName : undefined,
      });
      setBookingMessage({ type: "success", text: "Đặt lịch thành công! Chuyển hướng..." });
      resetBooking();
      setTimeout(() => {
        router.push(`/payment/${response.appointment.id}`);
        router.refresh();
      }, 1500);
    } catch (err: unknown) {
      const errorMsg = err && typeof err === "object" && "message" in err
        ? String((err as { message: unknown }).message)
        : "Không thể đặt lịch. Vui lòng thử lại sau.";
      setBookingMessage({ type: "error", text: errorMsg });
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return <div className="flex h-[80vh] items-center justify-center bg-slate-50"><LoadingSpinner /></div>;
  if (error || !pkg) return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center">
      <Alert type="error" message={error || "Gói khám không tồn tại"} className="mb-6" />
      <Link href="/packages"><Button variant="outline" className="rounded-xl inline-flex items-center gap-1.5"><ArrowLeft className="h-4 w-4" /> Quay lại danh sách</Button></Link>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow">
      <Link href={`/packages/${pkg.id}`} className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors text-sm font-semibold mb-8">
        <ArrowLeft className="h-4 w-4" /> Quay lại chi tiết gói khám
      </Link>

      <BookingProgress />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Package Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-28 w-28 rounded-3xl bg-teal-50 text-teal-600 border border-teal-100/50 overflow-hidden relative flex items-center justify-center shadow-inner">
                {pkg.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={pkg.image} alt={pkg.name} className="h-full w-full object-cover" />
                ) : (
                  <Package className="h-12 w-12 text-teal-500" />
                )}
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-950">{pkg.name}</h1>
                <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 bg-teal-50 border border-teal-100/50 rounded-lg px-3 py-1.5 mt-2.5">
                  <span className="text-lg">{pkg.price.toLocaleString("vi-VN")}đ</span>
                </div>
              </div>
            </div>

            {/* Voucher & Cost Breakdown */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-teal-600" /> Mã giảm giá
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Nhập mã voucher..."
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-teal-500 uppercase"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                />
                <button
                  onClick={handleApplyVoucher}
                  disabled={voucherLoading || !voucherCode.trim()}
                  className="bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                >
                  {voucherLoading ? "..." : "Áp dụng"}
                </button>
              </div>
              {voucherError && <p className="text-rose-500 text-xs mb-2">{voucherError}</p>}
              {voucherResult?.valid && (
                <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-1.5 rounded-lg border border-emerald-100 mb-3 text-xs">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-medium">{voucherResult.message}</span>
                </div>
              )}

              {/* Cost Summary */}
              {(() => {
                const defaultDeposit = Math.round((pkg.price * pkg.depositPercentage) / 100);
                const currentDeposit = voucherResult?.finalDeposit ?? defaultDeposit;
                return (
                  <div className="space-y-2 bg-teal-50/60 p-3 rounded-xl border border-teal-100 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Giá gói khám:</span>
                      <span className="font-semibold text-slate-700">{pkg.price.toLocaleString("vi-VN")}đ</span>
                    </div>
                    {voucherResult?.valid && voucherResult.discountAmount ? (
                      <>
                        <div className="flex justify-between text-emerald-600 font-bold">
                          <span>Voucher ({voucherResult.voucher?.code}):</span>
                          <span>- {voucherResult.discountAmount.toLocaleString("vi-VN")}đ</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Giá sau giảm:</span>
                          <span className="font-semibold text-slate-700">{(pkg.price - voucherResult.discountAmount).toLocaleString("vi-VN")}đ</span>
                        </div>
                      </>
                    ) : null}
                    <div className="flex justify-between font-bold border-t border-teal-200 pt-2">
                      <span className="text-teal-800">Tiền cọc ({pkg.depositPercentage}%):</span>
                      <span className="text-teal-900">{currentDeposit.toLocaleString("vi-VN")}đ</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-2 text-slate-400">
                      <span>Phí đặt lịch (demo):</span>
                      <span className="font-medium">5,000đ</span>
                    </div>
                    <p className="text-[10px] text-slate-400 italic">* Phí đặt lịch 5,000đ thanh toán online. Tiền cọc thu tại quầy.</p>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Right: Booking Form */}
        <div className="lg:col-span-7 bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2 mb-6">
            <CalendarDays className="h-5 w-5 text-teal-600" />
            Đặt Lịch Gói Khám Bệnh
          </h2>

          {!isAuthenticated ? (
            <div className="p-6 rounded-2xl bg-teal-50 border border-teal-100 text-center space-y-4">
              <p className="text-sm font-semibold text-teal-900">Đăng nhập tài khoản để tiến hành đặt lịch</p>
              <Link href="/login" className="inline-block mt-2">
                <Button variant="teal" className="rounded-xl text-xs px-6 py-2">Đăng Nhập Ngay</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleBookAppointment} className="space-y-6">

              {/* Bước 1: Người đi khám */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-800">Bước 1: Người đi khám</label>

                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={isBookingForMyself} onChange={() => { setIsBookingForMyself(true); setIsCreatingNew(false); }} className="accent-teal-600 w-4 h-4" />
                    <span className="text-sm font-semibold text-slate-700">Cho bản thân</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={!isBookingForMyself} onChange={() => setIsBookingForMyself(false)} className="accent-teal-600 w-4 h-4" />
                    <span className="text-sm font-semibold text-slate-700">Cho người thân</span>
                  </label>
                </div>

                {isBookingForMyself && (
                  <div className="p-4 rounded-xl border border-teal-200 bg-teal-50 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold text-sm">
                      {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <p className="font-bold text-teal-900">{user?.fullName}</p>
                      <p className="text-xs text-teal-700">Hồ sơ chính của bạn</p>
                    </div>
                  </div>
                )}

                {!isBookingForMyself && (
                  <div className="space-y-3 p-4 border border-slate-200 rounded-xl bg-slate-50">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-slate-700">Chọn hồ sơ người thân:</span>
                      {!isCreatingNew && (
                        <button type="button" onClick={() => { setIsCreatingNew(true); setSelectedProfileId(""); }} className="text-xs font-semibold text-teal-600 hover:underline flex items-center gap-1">
                          <Plus className="w-3 h-3" /> Nhập tên mới
                        </button>
                      )}
                    </div>

                    {isCreatingNew ? (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
                        <div>
                          <label className="block text-xs font-semibold mb-1 text-slate-700">Họ và tên người bệnh *</label>
                          <Input
                            value={newProfileData.fullName}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setNewProfileData({ fullName: e.target.value }); setBookingErrors(prev => ({ ...prev, fullName: "" })); }}
                            placeholder="Nguyễn Văn A"
                            className={`!py-2.5 !text-sm ${bookingErrors.fullName ? '!border-red-400' : ''}`}
                          />
                          {bookingErrors.fullName && <p className="text-xs text-red-500 mt-1">{bookingErrors.fullName}</p>}
                        </div>
                        <button type="button" onClick={() => setIsCreatingNew(false)} className="text-xs text-slate-500 hover:text-teal-600 font-medium">← Chọn từ danh sách</button>
                      </div>
                    ) : (
                      profiles.length === 0 ? (
                        <div className="text-center py-4 border border-dashed border-slate-300 rounded-lg">
                          <p className="text-sm text-slate-500 mb-2">Chưa có hồ sơ người thân</p>
                          <button type="button" onClick={() => setIsCreatingNew(true)} className="text-xs font-semibold text-teal-600 hover:underline">Nhập tên người thân</button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {profiles.map(p => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setSelectedProfileId(p.id)}
                              className={`p-3 rounded-xl border text-left transition-all ${selectedProfileId === p.id ? "border-teal-500 bg-teal-50 shadow-sm" : "border-slate-200 bg-white hover:border-teal-300"}`}
                            >
                              <p className="font-bold text-sm text-slate-800">{p.fullName}</p>
                              <p className="text-xs text-slate-500 mt-0.5">Quan hệ: {p.relationship || "Người thân"}</p>
                            </button>
                          ))}
                        </div>
                      )
                    )}
                    {bookingErrors.profile && <p className="text-xs text-red-500">{bookingErrors.profile}</p>}
                  </div>
                )}
              </div>

              {/* Policy checkbox */}
              <div>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToPolicy}
                    onChange={e => setAgreedToPolicy(e.target.checked)}
                    className="mt-0.5 accent-teal-600 w-4 h-4 shrink-0"
                  />
                  <span className="text-xs text-slate-500 leading-relaxed">
                    Tôi xác nhận đã đọc và đồng ý với{" "}
                    <Link href="/privacy" className="text-teal-600 font-semibold hover:underline">chính sách bảo mật.</Link>
                  </span>
                </label>
              </div>

              {/* Bước 2: Chọn ngày */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-800">Bước 2: Chọn ngày khám</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
                  {next7Days.map((day) => (
                    <button
                      key={day.dateString}
                      type="button"
                      onClick={() => handleDateChange(day.dateString)}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                        selectedDate === day.dateString
                          ? "bg-teal-600 border-teal-600 text-white shadow-md scale-[1.03]"
                          : "bg-white border-slate-200 text-slate-700 hover:border-teal-400"
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold tracking-wider opacity-90 block">{day.displayDay.split(" ")[1] || day.displayDay}</span>
                      <span className="text-sm font-bold block mt-1">{day.displayDate}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bước 3: Chọn giờ */}
              {selectedDate && (
                <div className="space-y-3 pt-2">
                  <label className="block text-sm font-bold text-slate-800">Bước 3: Chọn khung giờ khám</label>
                  {availableTimeSlots.length === 0 ? (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 text-xs text-amber-800">
                      Không có khung giờ nào. Vui lòng chọn ngày khác!
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {availableTimeSlots.map((slot) => {
                        const isDisabled = slot.isTooClose || slot.isBooked;
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => { setSelectedSlot(slot); setGlobalSlot(slot); setBookingMessage(null); }}
                            className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border text-sm font-semibold transition-all ${
                              isDisabled
                                ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-50"
                                : selectedSlot?.id === slot.id
                                ? "bg-teal-600 border-teal-600 text-white shadow-lg shadow-teal-600/20"
                                : "bg-teal-50 border-teal-200 text-teal-700 hover:border-teal-400 hover:bg-teal-100"
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-4 w-4 shrink-0" />
                              <span>{slot.startTime} - {slot.endTime}</span>
                            </div>
                            {isDisabled && (
                              <span className="text-[10px] font-bold opacity-80 uppercase tracking-widest">
                                {slot.isTooClose ? "Quá gần" : "Đã kín"}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Bước 4: Ghi chú */}
              {selectedSlot && (
                <div className="space-y-3 pt-2">
                  <label htmlFor="pkg_notes" className="block text-sm font-bold text-slate-800">
                    Bước 4: Ghi chú (tùy chọn)
                  </label>
                  <textarea
                    id="pkg_notes"
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Mô tả triệu chứng hoặc yêu cầu đặc biệt..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-sm resize-none"
                  />
                </div>
              )}

              {bookingMessage && <Alert type={bookingMessage.type} message={bookingMessage.text} className="mt-4" />}

              {selectedSlot && (
                <div className="pt-4 border-t flex justify-end">
                  <Button type="submit" variant="teal" disabled={bookingLoading} className="px-8 rounded-xl">
                    {bookingLoading ? "Đang xử lý..." : "Xác nhận Đặt Lịch"}
                  </Button>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
