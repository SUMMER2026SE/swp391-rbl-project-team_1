"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { doctorService } from "@/services/doctor.service";
import { appointmentService } from "@/services/appointment.service";
import { Doctor, DoctorSchedule, TimeSlot } from "@/types/doctor";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import { Award, Building2, Stethoscope, Clock, CalendarDays, ClipboardCheck, ArrowLeft, CalendarRange, User } from "lucide-react";
import Link from "next/link";
import BookingProgress from "@/components/ui/BookingProgress";
import { useBooking } from "@/hooks/useBooking";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function DoctorDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);
  const { isAuthenticated, user } = useAuth();
  const { 
    setSelectedDoctor: setGlobalDoctor, 
    setSelectedDate: setGlobalDate, 
    setSelectedSlot: setGlobalSlot, 
    resetBooking 
  } = useBooking();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking Flow States
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [notes, setNotes] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingMessage, setBookingMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch doctor data on mount
  useEffect(() => {
    async function fetchDoctorDetail() {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch doctor info
        const detailRes = await doctorService.getDoctor(id);
        setDoctor(detailRes.doctor);
        setGlobalDoctor(detailRes.doctor);

        // Fetch schedules
        const scheduleRes = await doctorService.listSchedules(id);
        setSchedules(scheduleRes.schedules);
      } catch (err: unknown) {
        const errorMsg =
          err && typeof err === "object" && "message" in err
            ? String((err as { message: unknown }).message)
            : "Không thể tải chi tiết bác sĩ. Bác sĩ này có thể không tồn tại.";
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    }

    fetchDoctorDetail();
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

  // Helper to generate 1-hour slots from a schedule (e.g. 08:00 - 17:00 -> 08:00-09:00, 09:00-10:00, etc.)
  const generateHourlySlots = (schedulesList: DoctorSchedule[]): TimeSlot[] => {
    const hourlySlots: TimeSlot[] = [];
    schedulesList.forEach((sch) => {
      const [startHour, startMin] = sch.startTime.split(":").map(Number);
      const [endHour, endMin] = sch.endTime.split(":").map(Number);

      let currentHour = startHour;
      let currentMin = startMin;

      while (currentHour < endHour) {
        let nextHour = currentHour + 1;
        let nextMin = currentMin;

        const pad = (n: number) => String(n).padStart(2, "0");
        const slotStart = `${pad(currentHour)}:${pad(currentMin)}`;
        const slotEnd = `${pad(nextHour)}:${pad(nextMin)}`;

        hourlySlots.push({
          id: `${sch.id}-${slotStart}`,
          startTime: slotStart,
          endTime: slotEnd,
        });

        currentHour = nextHour;
      }
    });
    return hourlySlots;
  };

  // Helper to generate dynamic mock achievements based on doctor data
  const generateDoctorAchievements = (doc: Doctor) => {
    const achievements = [];
    achievements.push("Bằng Bác sĩ Đa khoa - Đại học Y Dược TP.HCM");
    
    if (doc.specialty) {
      if (doc.experience >= 15) {
        achievements.push(`Chứng chỉ Bác sĩ Chuyên khoa II (CKII) - Chuyên khoa ${doc.specialty.name}`);
      } else {
        achievements.push(`Chứng chỉ Bác sĩ Chuyên khoa I (CKI) - Chuyên khoa ${doc.specialty.name}`);
      }
    }

    if (doc.experience >= 10) {
      achievements.push(`Nhiều năm kinh nghiệm công tác tại ${doc.hospital}`);
    }

    // Deterministic random achievements based on ID
    const hash = doc.id.charCodeAt(0) + doc.id.charCodeAt(doc.id.length - 1);
    if (hash % 2 === 0) {
      achievements.push("Chứng nhận tu nghiệp Y khoa tại Pháp (F.F.I)");
    } else {
      achievements.push("Chứng nhận đào tạo Y khoa liên tục (CME) Quốc tế");
    }

    if (hash % 3 === 0) {
      achievements.push("Thành viên Hội đồng Y khoa Việt Nam");
    } else if (hash % 3 === 1) {
      achievements.push("Giấy khen hoàn thành xuất sắc nhiệm vụ Y tế");
    }

    achievements.push("Chứng chỉ hành nghề khám bệnh, chữa bệnh do Bộ Y tế cấp");
    return achievements;
  };

  // Find available schedules for selected date
  const handleDateChange = (dateString: string, dayOfWeek: number) => {
    setSelectedDate(dateString);
    setSelectedSlot(null);
    setBookingMessage(null);

    // Save to global context
    setGlobalDate(dateString);
    setGlobalSlot(null);

    // Filter doctor schedules that match the day of week and are available
    const slotsForDay = schedules.filter(
      (sch) => sch.dayOfWeek === dayOfWeek && sch.isAvailable
    );
    
    // Generate 1-hour slots
    const hourlySlots = generateHourlySlots(slotsForDay);
    setAvailableTimeSlots(hourlySlots);
  };

  // Format Day of Week from 0-6
  const getDayName = (dayNum: number) => {
    const days = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
    return days[dayNum] || "";
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
        text: "Chỉ tài khoản người bệnh (USER) mới được phép đặt lịch khám.",
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

      await appointmentService.createAppointment({
        doctorId: id,
        appointmentDate: appointmentDateTime.toISOString(),
        notes: notes.trim() || undefined,
      });

      setBookingMessage({
        type: "success",
        text: "Đặt lịch khám thành công! Bạn đang được chuyển tới danh sách lịch hẹn của tôi.",
      });

      // Clear states
      setSelectedSlot(null);
      setSelectedDate("");
      setNotes("");
      resetBooking();

      setTimeout(() => {
        router.push("/my-appointments");
        router.refresh();
      }, 1500);
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Không thể đặt lịch. Khung giờ này có thể đã bị trùng hoặc bác sĩ không rảnh.";
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
          <p className="mt-4 text-sm text-slate-500 font-medium">Đang tải hồ sơ bác sĩ...</p>
        </div>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <Alert type="error" message={error || "Bác sĩ không tồn tại"} className="mb-6" />
        <Link href="/doctors">
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
      <Link href="/doctors" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors text-sm font-semibold mb-8">
        <ArrowLeft className="h-4 w-4" /> Quay lại danh sách bác sĩ
      </Link>

      <BookingProgress />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Doctor Profile Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Doctor Avatar */}
              <div className="h-28 w-28 rounded-3xl bg-teal-50 text-teal-600 border border-teal-100/50 overflow-hidden relative flex items-center justify-center shadow-inner">
                {doctor.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={doctor.avatar} alt={doctor.name} className="h-full w-full object-cover" />
                ) : (
                  <User className="h-12 w-12 text-teal-500" />
                )}
              </div>

              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-950">{doctor.name}</h1>
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-100/50 rounded-lg px-2.5 py-1 mt-2.5">
                  <Stethoscope className="h-3.5 w-3.5" />
                  <span>{doctor.specialty?.name}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100/60 mt-8 pt-6 space-y-4">
              <div className="flex items-center gap-3 text-sm text-slate-700">
                <Award className="h-5 w-5 text-teal-600 shrink-0" />
                <div>
                  <p className="text-slate-400 text-xs">Kinh nghiệm lâm sàng</p>
                  <p className="font-semibold text-slate-800">{doctor.experience} năm hoạt động</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm text-slate-700">
                <Building2 className="h-5 w-5 text-teal-600 shrink-0" />
                <div>
                  <p className="text-slate-400 text-xs">Bệnh viện công tác</p>
                  <p className="font-semibold text-slate-800">{doctor.hospital}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Doctor Achievements */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider text-teal-700">
              <Award className="h-4.5 w-4.5" />
              Thành tựu & Chứng chỉ y khoa
            </h3>
            <ul className="space-y-3 text-sm text-slate-600">
              {generateDoctorAchievements(doctor).map((achievement, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-500 mt-2 shrink-0"></span>
                  <span>{achievement}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column: Dynamic Booking Form */}
        <div className="lg:col-span-7 bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2 mb-6">
            <CalendarDays className="h-5 w-5 text-teal-600" />
            Đặt Lịch Hẹn Khám Bệnh
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
                      Bác sĩ không có lịch làm việc cố định vào ngày này. Vui lòng chọn ngày khác!
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {availableTimeSlots.map((slot) => (
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
                          <span>{slot.startTime} - {slot.endTime}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Note Symptom */}
              {selectedSlot && (
                <div className="space-y-3 pt-2">
                  <label htmlFor="notes" className="block text-sm font-medium text-slate-800">
                    Bước 3: Nhập triệu chứng bệnh (tùy chọn)
                  </label>
                  <textarea
                    id="notes"
                    rows={4}
                    placeholder="Ghi chú triệu chứng hoặc các yêu cầu cụ thể đối với bác sĩ..."
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
