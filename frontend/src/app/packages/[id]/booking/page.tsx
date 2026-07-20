"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { appointmentService } from "@/services/appointment.service";
import { voucherService } from "@/services/voucher.service";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import { ArrowLeft, CalendarDays, Clock, Package, Tag, Check, ChevronRight } from "lucide-react";
import Link from "next/link";
import { packageService, MedicalPackage } from "@/services/package.service";
import { bookingProfileService } from "@/services/booking-profile.service";
import BookingProgress from "@/components/ui/BookingProgress";
import { useBooking } from "@/hooks/useBooking";
import PatientSelector, { PatientFormData, buildRelativeSnapshot } from "@/components/ui/PatientSelector";
import VoucherSelectorModal from "@/components/ui/VoucherSelectorModal";

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
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);

  const [pkg, setPkg] = useState<MedicalPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookedCounts, setBookedCounts] = useState<Record<string, number>>({});

  // Patient Selector state
  const [isBookingForMyself, setIsBookingForMyself] = useState(true);
  const [relativeData, setRelativeData] = useState<PatientFormData>({
    fullName: "", phoneNumber: "", gender: "", dateOfBirth: "", relationship: ""
  });
  const [saveProfile, setSaveProfile] = useState(false);
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);
  const [bookingErrors, setBookingErrors] = useState<Record<string, string>>({});

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

  const handleApplyVoucher = async (codeToApply?: string) => {
    const code = codeToApply || voucherCode;
    if (!pkg || !code.trim()) return;
    const depositAmt = Math.round((pkg.price * (pkg.depositPercentage || 100)) / 100);
    try {
      setVoucherLoading(true);
      setVoucherError("");
      const result = await voucherService.validateVoucher(code.trim(), depositAmt, undefined, pkg.id);
      if (result.valid) {
        setVoucherResult(result);
        setVoucherCode(code.trim().toUpperCase());
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

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!isBookingForMyself) {
      if (!relativeData.fullName.trim()) errors.fullName = "Họ và tên không được để trống.";
      if (!relativeData.relationship) errors.relationship = "Vui lòng chọn mối quan hệ.";
    }
    setBookingErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { router.push("/login"); return; }
    if (user?.role !== "USER") {
      setBookingMessage({ type: "error", text: "Chỉ tài khoản người bệnh mới được phép đặt lịch." });
      return;
    }
    if (!validateForm()) {
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
      let patientInfo: Record<string, unknown>;
      let patientProfileType: "SELF" | "OTHER";

      if (isBookingForMyself) {
        patientProfileType = "SELF";
        patientInfo = {
          fullName: user?.fullName || "Bệnh nhân",
          gender: user?.gender || "",
          dateOfBirth: user?.dateOfBirth || undefined,
          address: user?.address || "",
          province: user?.province || "",
          district: user?.district || "",
          ward: user?.ward || "",
          street: user?.street || "",
          bloodType: user?.bloodType || undefined,
          allergies: user?.allergies || undefined,
        };
      } else {
        patientProfileType = "OTHER";
        patientInfo = buildRelativeSnapshot(relativeData) as unknown as Record<string, unknown>;

        if (saveProfile && relativeData.fullName.trim()) {
          try {
            await bookingProfileService.createProfile({
              fullName: relativeData.fullName,
              phone: relativeData.phoneNumber || undefined,
              gender: relativeData.gender || undefined,
              dateOfBirth: relativeData.dateOfBirth ? relativeData.dateOfBirth : undefined,
              relationship: relativeData.relationship,
            });
          } catch {
            console.warn("Failed to save booking profile, continuing...");
          }
        }
      }

      const appointmentDateTime = new Date(`${selectedDate}T${selectedSlot.startTime}:00`);
      const response = await appointmentService.createAppointment({
        appointmentDate: appointmentDateTime.toISOString(),
        notes: notes.trim() || undefined,
        packageId: pkg!.id,
        patientProfileType,
        patientInfo: patientInfo as any,
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
                <button
                  onClick={() => setIsVoucherModalOpen(true)}
                  className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs font-medium text-slate-500 hover:border-teal-400 focus:outline-none flex items-center justify-between transition-colors text-left"
                >
                  <span>Chọn hoặc nhập mã giảm giá</span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
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
                const defaultDeposit = Math.round((pkg.price * (pkg.depositPercentage || 100)) / 100);
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

              {/* Bước 1: Người đi khám - PatientSelector */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-800">Bước 1: Người đi khám</label>
                <PatientSelector
                  userProfile={user ? {
                    fullName: user.fullName,
                    phoneNumber: null,
                    gender: user.gender,
                    dateOfBirth: user.dateOfBirth,
                    address: user.address,
                    bloodType: user.bloodType,
                    allergies: user.allergies,
                  } : null}
                  isBookingForMyself={isBookingForMyself}
                  setIsBookingForMyself={setIsBookingForMyself}
                  relativeData={relativeData}
                  setRelativeData={setRelativeData}
                  saveProfile={saveProfile}
                  setSaveProfile={setSaveProfile}
                  bookingErrors={bookingErrors}
                  setBookingErrors={setBookingErrors}
                />
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
      
      {pkg && (
        <VoucherSelectorModal
          isOpen={isVoucherModalOpen}
          onClose={() => setIsVoucherModalOpen(false)}
          onSelect={(code) => handleApplyVoucher(code)}
          depositAmount={Math.round((pkg.price * (pkg.depositPercentage || 100)) / 100)}
          packageId={pkg.id}
          isDoctorBooking={false}
        />
      )}
    </div>
  );
}
