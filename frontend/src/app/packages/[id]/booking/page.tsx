"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { appointmentService } from "@/services/appointment.service";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import { ArrowLeft, CalendarDays, Clock, ClipboardCheck, Package } from "lucide-react";
import Link from "next/link";
import { packageService, MedicalPackage } from "@/services/package.service";
import BookingProgress from "@/components/ui/BookingProgress";
import { useBooking } from "@/hooks/useBooking";

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PackageBookingPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);
  const { isAuthenticated, user } = useAuth();
  const { 
    setSelectedDate: setGlobalDate, 
    setSelectedSlot: setGlobalSlot, 
    resetBooking 
  } = useBooking();

  const [pkg, setPkg] = useState<MedicalPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking Flow States
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [notes, setNotes] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingMessage, setBookingMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch package data on mount
  useEffect(() => {
    async function fetchPackageDetail() {
      try {
        setLoading(true);
        setError(null);
        
        const detailRes = await packageService.getPackageById(id);
        if (detailRes) {
           setPkg(detailRes);
        } else {
           setError("Không thể tải chi tiết gói khám.");
        }
      } catch (err: unknown) {
        const errorMsg =
          err && typeof err === "object" && "message" in err
            ? String((err as { message: unknown }).message)
            : "Không thể tải chi tiết gói khám. Gói khám này có thể không tồn tại.";
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    }

    fetchPackageDetail();
  }, [id]);

  // Generate next 7 days for picking
  const getNext7Days = () => {
    const days = [];
    const weekdays = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
    
    for (let i = 1; i <= 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      const dateString = `${yyyy}-${mm}-${dd}`;
      
      days.push({
        dateString,
        dayOfWeek: date.getDay(), // 0-6
        displayDay: weekdays[date.getDay()],
        displayDate: `${dd}/${mm}`,
      });
    }
    return days;
  };

  const next7Days = getNext7Days();

  // Helper to generate generic 1-hour slots
  const generateGenericSlots = (): TimeSlot[] => {
    const hourlySlots: TimeSlot[] = [];
    const periods = [
        { start: 8, end: 12 },
        { start: 13, end: 17 }
    ];

    periods.forEach(period => {
      let currentHour = period.start;

      while (currentHour < period.end) {
        let nextHour = currentHour + 1;

        const pad = (n: number) => String(n).padStart(2, "0");
        const slotStart = `${pad(currentHour)}:00`;
        const slotEnd = `${pad(nextHour)}:00`;

        hourlySlots.push({
          id: `slot-${slotStart}`,
          startTime: slotStart,
          endTime: slotEnd,
        });

        currentHour = nextHour;
      }
    });
    return hourlySlots;
  };

  // Find available schedules for selected date
  const handleDateChange = (dateString: string, dayOfWeek: number) => {
    setSelectedDate(dateString);
    setSelectedSlot(null);
    setBookingMessage(null);

    // Save to global context
    setGlobalDate(dateString);
    setGlobalSlot(null);

    // Generate 1-hour slots
    const hourlySlots = generateGenericSlots();
    setAvailableTimeSlots(hourlySlots);
  };

  // Submit appointment booking
  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (user?.role !== "USER") {
      setBookingMessage({
        type: "error",
        text: "Chỉ tài khoản người bệnh mới được phép đặt lịch gói khám.",
      });
      return;
    }

    if (!selectedDate || !selectedSlot) {
      setBookingMessage({
        type: "error",
        text: "Vui lòng chọn ngày và khung giờ khám bệnh.",
      });
      return;
    }

    setBookingLoading(true);
    setBookingMessage(null);

    try {
      // Build ISO Date: selectedDate "YYYY-MM-DD" + selectedSlot.startTime "HH:MM"
      const appointmentDateTime = new Date(`${selectedDate}T${selectedSlot.startTime}:00`);

      const response = await appointmentService.createAppointment({
        appointmentDate: appointmentDateTime.toISOString(),
        notes: notes.trim() || undefined,
        packageId: pkg?.id,
      });

      setBookingMessage({
        type: "success",
        text: "Đặt lịch khám thành công! Bạn đang được chuyển tới trang thanh toán để xác nhận lịch hẹn.",
      });

      // Clear states
      setSelectedSlot(null);
      setSelectedDate("");
      setNotes("");
      resetBooking();

      setTimeout(() => {
        router.push(`/payment/${response.appointment.id}`);
        router.refresh();
      }, 1500);
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Không thể đặt lịch. Vui lòng thử lại sau.";
      setBookingMessage({
        type: "error",
        text: errorMsg,
      });
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-slate-50">
        <div className="text-center">
          <LoadingSpinner className="mx-auto h-10 w-10 text-teal-600" />
          <p className="mt-4 text-sm text-slate-500 font-medium">Đang tải thông tin gói khám...</p>
        </div>
      </div>
    );
  }

  if (error || !pkg) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <Alert type="error" message={error || "Gói khám không tồn tại"} className="mb-6" />
        <Link href="/packages">
          <Button variant="outline" className="rounded-xl inline-flex items-center gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Quay lại danh sách
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow">
      {/* Navigation breadcrumb */}
      <Link href={`/packages/${pkg.id}`} className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors text-sm font-semibold mb-8">
        <ArrowLeft className="h-4 w-4" /> Quay lại chi tiết gói khám
      </Link>

      <BookingProgress />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Package Profile Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-28 w-28 rounded-3xl bg-teal-50 text-teal-600 border border-teal-100/50 overflow-hidden relative flex items-center justify-center shadow-inner">
                {pkg.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={pkg.thumbnail} alt={pkg.name} className="h-full w-full object-cover" />
                ) : (
                  <Package className="h-12 w-12 text-teal-500" />
                )}
              </div>

              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-950">{pkg.name}</h1>
                <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 bg-teal-50 border border-teal-100/50 rounded-lg px-3 py-1.5 mt-2.5">
                  <span className="text-lg">{pkg.price.toLocaleString("vi-VN")} VND</span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100/60 mt-8 pt-6 space-y-4">
              <div className="text-sm text-slate-700">
                  <p className="text-slate-400 text-xs mb-1">Mô tả gói khám</p>
                  <p className="font-semibold text-slate-800 line-clamp-3">{pkg.description}</p>
              </div>
              <div className="text-sm text-slate-700">
                  <p className="text-slate-400 text-xs mb-1">Cơ sở y tế</p>
                  <p className="font-semibold text-slate-800">{pkg.hospital}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Booking Form */}
        <div className="lg:col-span-7 bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2 mb-6">
            <CalendarDays className="h-5 w-5 text-teal-600" />
            Đặt Lịch Gói Khám Bệnh
          </h2>

          {!isAuthenticated ? (
            <div className="p-6 rounded-2xl bg-teal-50 border border-teal-100 text-center space-y-4">
              <p className="text-sm font-semibold text-teal-900">Đăng nhập tài khoản để tiến hành đặt lịch</p>
              <p className="text-xs text-teal-800/80">Bạn cần có tài khoản người bệnh trên hệ thống để xem và quản lý các khung giờ đặt hẹn rảnh.</p>
              <Link href="/login" className="inline-block mt-2">
                <Button variant="teal" className="rounded-xl text-xs px-6 py-2">Đăng Nhập Ngay</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleBookAppointment} className="space-y-6">

              {/* Step 1: Pick Date */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-800">
                  Bước 1: Chọn ngày khám bệnh
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
                  {next7Days.map((day) => (
                    <button
                      key={day.dateString}
                      type="button"
                      onClick={() => handleDateChange(day.dateString, day.dayOfWeek)}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                        selectedDate === day.dateString
                          ? "bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-600/10 scale-[1.03]"
                          : "bg-white border-slate-200 text-slate-700 hover:border-teal-400"
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold tracking-wider opacity-90 block">
                        {day.displayDay.split(" ")[1] || day.displayDay}
                      </span>
                      <span className="text-sm font-bold block mt-1">{day.displayDate}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Pick Time slot */}
              {selectedDate && (
                <div className="space-y-3 pt-2">
                  <label className="block text-sm font-medium text-slate-800">
                    Bước 2: Chọn khung giờ khám rảnh
                  </label>
                  {availableTimeSlots.length === 0 ? (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 text-xs text-amber-800">
                      Cơ sở y tế không có lịch làm việc vào ngày này. Vui lòng chọn ngày khác!
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {availableTimeSlots.map((slot) => {
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => {
                              setSelectedSlot(slot);
                              setGlobalSlot(slot);
                              setBookingMessage(null);
                            }}
                            className={`flex items-center justify-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition-all ${
                                selectedSlot?.id === slot.id
                                ? "bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-600/10"
                                : "bg-slate-50 border-slate-200 text-slate-700 hover:border-teal-400 hover:bg-white"
                            }`}
                          >
                            <Clock className="h-3.5 w-3.5 shrink-0" />
                            <span>
                              {slot.startTime} - {slot.endTime}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Note Symptom */}
              {selectedSlot && (
                <div className="space-y-3 pt-2">
                  <label htmlFor="notes" className="block text-sm font-medium text-slate-800">
                    Bước 3: Nhập ghi chú thêm (tùy chọn)
                  </label>
                  <textarea
                    id="notes"
                    rows={4}
                    placeholder="Ghi chú thêm thông tin đối với cơ sở y tế..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm resize-none"
                  />
                </div>
              )}

              {/* Toast/Alert Messages */}
              {bookingMessage && (
                <Alert type={bookingMessage.type} message={bookingMessage.text} className="mt-4" />
              )}

              {/* Confirm submit */}
              {selectedSlot && (
                <div className="pt-4 border-t border-slate-100/60 flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    Lịch hẹn sẽ được gửi trực tiếp tới hệ thống kiểm duyệt.
                  </div>
                  <Button
                    type="submit"
                    variant="teal"
                    className="rounded-xl py-3 px-8 text-sm font-bold inline-flex items-center gap-1.5 shadow-md"
                    isLoading={bookingLoading}
                  >
                    <ClipboardCheck className="h-4.5 w-4.5" />
                    Xác Nhận Đặt Lịch
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
