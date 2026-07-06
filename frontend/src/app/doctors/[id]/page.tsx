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
import { Award, Building2, Stethoscope, Clock, CalendarDays, ClipboardCheck, ArrowLeft, CalendarRange, User, FileText, Star, Package, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { packageService, MedicalPackage } from "@/services/package.service";
import { patientProfileService, PatientProfile } from "@/services/patient-profile.service";
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
  const [bookedCounts, setBookedCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking Flow States
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [packages, setPackages] = useState<MedicalPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<MedicalPackage | null>(null);
  const [notes, setNotes] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingMessage, setBookingMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Patient Profiles
  const [profiles, setProfiles] = useState<PatientProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");

  // Reviews States
  const [reviews, setReviews] = useState<any[]>([]);
  const [stats, setStats] = useState<{
    averageRating: number;
    totalReviews: number;
    distribution: Record<number, number>;
  }>({
    averageRating: 0,
    totalReviews: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });
  const [reviewsLoading, setReviewsLoading] = useState(true);

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
        if (scheduleRes.bookedCounts) {
          setBookedCounts(scheduleRes.bookedCounts);
        }
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

  useEffect(() => {
    async function fetchReviews() {
      try {
        setReviewsLoading(true);
        const res = await doctorService.getReviews(id);
        if (res && res.data) {
          setReviews(res.data.reviews);
          setStats(res.data.stats);
        }
      } catch (err) {
        console.error("Failed to load doctor reviews:", err);
      } finally {
        setReviewsLoading(false);
      }
    }
    fetchReviews();
  }, [id]);

  useEffect(() => {
    async function fetchPackages() {
      try {
        const res = await packageService.getPackages();
        if (Array.isArray(res)) {
          setPackages(res);
        } else if (res && (res as any).packages) {
          setPackages((res as any).packages);
        }
      } catch (err) {
        console.error("Failed to load packages:", err);
      }
    }
    fetchPackages();
  }, []);

  useEffect(() => {
    async function fetchProfiles() {
      if (isAuthenticated && user?.role === "USER") {
        try {
          const myProfiles = await patientProfileService.getMyProfiles();
          setProfiles(myProfiles);
          const primary = myProfiles.find(p => p.isPrimary);
          if (primary) setSelectedProfileId(primary.id);
          else if (myProfiles.length > 0) setSelectedProfileId(myProfiles[0].id);
        } catch (err) {
          console.error("Failed to fetch profiles:", err);
        }
      }
    }
    fetchProfiles();
  }, [isAuthenticated, user]);

  // Generate next 7 days for picking
  const getNext7Days = () => {
    const days = [];
    const weekdays = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
    
    for (let i = 0; i < 7; i++) {
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
    
    // Map slots and mark if they are booked
    const mappedSlots = hourlySlots.map((slot) => {
      const slotDateTime = new Date(`${dateString}T${slot.startTime}:00`);
      const now = new Date();
      const isTooClose = slotDateTime.getTime() <= now.getTime() + 2 * 60 * 60 * 1000;
      
      const isoString = slotDateTime.toISOString();
      const count = bookedCounts[isoString] || 0;
      const remaining = 20 - count;
      const isBooked = count >= 20;

      return {
        ...slot,
        isBooked,
        isTooClose,
        remaining,
      };
    });

    setAvailableTimeSlots(mappedSlots);
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

    if (user?.role !== "USER" && user?.role !== "DOCTOR") {
      setBookingMessage({
        type: "error",
        text: "Chỉ tài khoản người bệnh hoặc bác sĩ mới được phép đặt lịch khám.",
      });
      return;
    }

    if (user?.role === "DOCTOR" && doctor?.id === user?.doctorId) {
      setBookingMessage({
        type: "error",
        text: "Bạn không thể tự đặt lịch khám với chính mình.",
      });
      return;
    }

    if (!selectedProfileId) {
      setBookingMessage({
        type: "error",
        text: "Vui lòng chọn hồ sơ người đi khám.",
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

    if (!doctor?.clinicId) {
      setBookingMessage({
        type: "error",
        text: "Không tìm thấy thông tin bệnh viện. Vui lòng quay lại và chọn lại.",
      });
      return;
    }

    setBookingLoading(true);
    setBookingMessage(null);

    try {
      // Build ISO Date: selectedDate "YYYY-MM-DD" + selectedSlot.startTime "HH:MM"
      const appointmentDateTime = new Date(`${selectedDate}T${selectedSlot.startTime}:00`);

      const response = await appointmentService.createAppointment({
        doctorId: id,
        clinicId: doctor.clinicId,
        appointmentDate: appointmentDateTime.toISOString(),
        notes: notes.trim() || undefined,
        packageId: selectedPackage?.id,
        patientProfileId: selectedProfileId,
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
            
            {!doctor.certificates || doctor.certificates.length === 0 ? (
              <p className="text-sm text-slate-500 italic">Bác sĩ chưa cập nhật chứng chỉ y khoa.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {doctor.certificates.map((cert) => (
                  <div key={cert.id} className="border border-slate-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                    {(cert.imageUrl || cert.fileUrl) && (
                      <div className="h-32 bg-slate-50 border-b border-slate-100 flex items-center justify-center relative group overflow-hidden">
                        {cert.imageUrl ? (
                          <img src={cert.imageUrl} alt={cert.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="text-center text-rose-500 flex flex-col items-center">
                            <FileText className="h-8 w-8 mb-1" />
                            <span className="text-xs font-semibold">Tài liệu PDF</span>
                          </div>
                        )}
                        <a 
                          href={cert.imageUrl || cert.fileUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-sm font-semibold"
                        >
                          Xem chi tiết
                        </a>
                      </div>
                    )}
                    <div className="p-4 bg-white">
                      <div className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0"></span>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{cert.title}</p>
                          {(cert.issuer || cert.issuedYear) && (
                            <p className="text-xs text-slate-500 mt-1">
                              {cert.issuer} {cert.issuedYear ? `- ${cert.issuedYear}` : ''}
                            </p>
                          )}
                          {cert.description && (
                            <p className="text-xs text-slate-600 mt-2 italic border-l-2 border-slate-200 pl-2">{cert.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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


              {/* Step 0: Pick Patient Profile */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-800">
                  Bước 1: Chọn hồ sơ người đi khám
                </label>
                {profiles.length === 0 ? (
                  <div className="p-4 rounded-xl bg-orange-50 border border-orange-100 flex flex-col gap-3">
                     <p className="text-sm text-orange-800">Bạn chưa có hồ sơ người khám nào.</p>
                     <Link href="/profile/patients"><Button type="button" variant="outline" className="text-xs">Tạo hồ sơ mới</Button></Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                     {profiles.map(p => (
                       <div 
                         key={p.id}
                         onClick={() => setSelectedProfileId(p.id)}
                         className={`p-3 rounded-xl border cursor-pointer flex items-center gap-3 transition-colors ${
                           selectedProfileId === p.id 
                           ? 'border-teal-500 bg-teal-50 shadow-sm' 
                           : 'border-slate-200 hover:border-teal-300'
                         }`}
                       >
                         <User className={`w-5 h-5 ${selectedProfileId === p.id ? 'text-teal-600' : 'text-slate-400'}`} />
                         <div className="flex-1 min-w-0">
                           <p className="font-semibold text-sm text-slate-800 truncate">{p.fullName}</p>
                           <p className="text-xs text-slate-500 truncate">{p.phoneNumber || 'Chưa cập nhật SĐT'}</p>
                         </div>
                       </div>
                     ))}
                  </div>
                )}
                {profiles.length > 0 && (
                   <div className="mt-2 text-right">
                     <Link href="/profile/patients" className="text-xs font-semibold text-teal-600 hover:underline">Quản lý hồ sơ khám bệnh</Link>
                   </div>
                )}
              </div>

              {/* Step 1: Pick Date */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-800">
                  Bước 2: Chọn ngày khám bệnh
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
                    Bước 3: Chọn khung giờ khám rảnh
                  </label>
                  {availableTimeSlots.length === 0 ? (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 text-xs text-amber-800">
                      Bác sĩ không có lịch làm việc cố định vào ngày này. Vui lòng chọn ngày khác!
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {availableTimeSlots.map((slot) => {
                        const isBooked = slot.isBooked;
                        const isTooClose = slot.isTooClose;
                        const isDisabled = isTooClose || slot.isBooked;
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            disabled={isDisabled}
                            title={isTooClose ? "Slot quá gần (cách hiện tại < 2 tiếng), vui lòng chọn giờ khác" : slot.isBooked ? "Đã hết chỗ" : undefined}
                            onClick={() => {
                              setSelectedSlot(slot);
                              setGlobalSlot(slot);
                              setBookingMessage(null);
                            }}
                            className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl border text-xs transition-all ${
                                isDisabled
                                ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60"
                                : selectedSlot?.id === slot.id
                                ? "bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-600/10"
                                : "bg-slate-50 border-slate-200 text-slate-700 hover:border-teal-400 hover:bg-white"
                            }`}
                          >
                            <div className="flex items-center gap-1.5 font-semibold">
                                <Clock className="h-3.5 w-3.5 shrink-0" />
                                <span>{slot.startTime} - {slot.endTime}</span>
                            </div>
                            <span className="text-[10px] opacity-90">
                                {isTooClose ? "Quá gần" : slot.isBooked ? "Hết chỗ" : `Còn ${slot.remaining} chỗ`}
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
                    Bước 4: Nhập triệu chứng bệnh (tùy chọn)
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

      {/* Ratings & Reviews Section */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm mt-8 space-y-8">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-lg font-bold text-slate-955 flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500 fill-amber-400" />
            Đánh Giá & Nhận Xét Từ Bệnh Nhân
          </h2>
          <p className="text-xs text-slate-500 mt-1">Ý kiến phản hồi thực tế từ những người đã trải nghiệm dịch vụ khám với bác sĩ.</p>
        </div>

        {reviewsLoading ? (
          <div className="flex justify-center p-8"><LoadingSpinner className="w-8 h-8 text-teal-600" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            
            {/* Stats Summary Column */}
            <div className="md:col-span-4 bg-slate-50/50 border border-slate-100 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
              <span className="text-5xl font-black text-slate-900 leading-none">{stats.averageRating}</span>
              <div className="flex items-center gap-1 mt-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className={`w-4 h-4 ${
                      star <= Math.round(stats.averageRating)
                        ? "fill-amber-400 text-amber-450 stroke-amber-500"
                        : "text-slate-200 stroke-slate-300"
                    }`} 
                  />
                ))}
              </div>
              <p className="text-xs font-semibold text-slate-500 mt-2">Đánh giá trung bình ({stats.totalReviews} lượt nhận xét)</p>

              {/* Progress bars for stars */}
              <div className="w-full mt-6 space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = stats.distribution[star] || 0;
                  const percent = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center text-xs text-slate-600 gap-2">
                      <span className="w-10 text-right font-medium">{star} sao</span>
                      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-teal-500 rounded-full transition-all duration-500" 
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="w-6 text-left font-semibold text-slate-400">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reviews List Column */}
            <div className="md:col-span-8 space-y-4">
              {reviews.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl">
                  <Star className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-700">Chưa có lượt đánh giá nào</p>
                  <p className="text-xs text-slate-400 mt-0.5">Bệnh nhân khám xong lịch trực tuyến sẽ gửi nhận xét đầu tiên.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
                  {reviews.map((review) => {
                    const reviewerName = review.user?.fullName || "Bệnh nhân MedBooking";
                    // Mask name
                    const maskedName = reviewerName.split(" ").map((word: string, i: number, arr: string[]) => {
                      if (i === 0 || i === arr.length - 1) return word;
                      return word[0] + ".";
                    }).join(" ");

                    const reviewerInitials = reviewerName.charAt(0).toUpperCase();

                    return (
                      <div key={review.id} className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 hover:shadow-sm transition-shadow space-y-3">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-100 overflow-hidden relative flex items-center justify-center border border-slate-200 shrink-0">
                              {review.user?.avatar ? (
                                <img src={review.user.avatar} alt={reviewerName} className="w-full h-full object-cover" />
                              ) : (
                                <span className="font-bold text-slate-400 text-xs">{reviewerInitials}</span>
                              )}
                            </div>
                            <div>
                              <h5 className="font-bold text-slate-800 text-xs sm:text-sm">{maskedName}</h5>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <div className="flex items-center gap-0.5">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star 
                                      key={star} 
                                      className={`w-3 h-3 ${
                                        star <= review.rating
                                          ? "fill-amber-400 text-amber-450 stroke-amber-500"
                                          : "text-slate-200 stroke-slate-300"
                                      }`} 
                                    />
                                  ))}
                                </div>
                                <span className="text-[10px] text-slate-400 font-semibold">•</span>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {review.comment && (
                          <p className="text-xs text-slate-600 leading-relaxed pl-1 whitespace-pre-wrap">
                            &ldquo;{review.comment}&rdquo;
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
