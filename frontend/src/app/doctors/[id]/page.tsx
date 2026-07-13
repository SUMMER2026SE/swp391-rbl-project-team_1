"use client";

import React, { useEffect, useState, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { doctorService } from "@/services/doctor.service";
import { appointmentService } from "@/services/appointment.service";
import { Doctor, DoctorSchedule, TimeSlot } from "@/types/doctor";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import { 
  CalendarDays, MapPin, Building2, Clock, CheckCircle2, Award, 
  Stethoscope, Star, User, ArrowLeft, ShieldCheck, MessageCircle,
  ChevronRight, FileText, ClipboardCheck, X, CalendarCheck
} from "lucide-react";
import Link from "next/link";
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
  const { setSelectedDoctor: setGlobalDoctor, setSelectedDate: setGlobalDate, setSelectedSlot: setGlobalSlot, resetBooking } = useBooking();

  const bookingSectionRef = useRef<HTMLDivElement>(null);

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [bookedCounts, setBookedCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking Flow States
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [notes, setNotes] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingMessage, setBookingMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Patient Profiles
  const [profiles, setProfiles] = useState<PatientProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");

  // Reviews
  const [reviews, setReviews] = useState<any[]>([]);
  const [ratingStats, setRatingStats] = useState<{ averageRating: number; totalReviews: number; distribution: Record<number, number> }>({
    averageRating: 0, totalReviews: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [showAllReviews, setShowAllReviews] = useState(false);

  // Certificate lightbox
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDoctorDetail() {
      try {
        setLoading(true);
        setError(null);
        const detailRes = await doctorService.getDoctor(id);
        setDoctor(detailRes.doctor);
        setGlobalDoctor(detailRes.doctor);
        const scheduleRes = await doctorService.listSchedules(id);
        setSchedules(scheduleRes.schedules);
        if (scheduleRes.bookedCounts) setBookedCounts(scheduleRes.bookedCounts);
      } catch (err: unknown) {
        const errorMsg = err && typeof err === "object" && "message" in err ? String((err as { message: unknown }).message) : "Không thể tải chi tiết bác sĩ.";
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
          setRatingStats(res.data.stats);
        }
      } catch (err) {
        console.error("Failed to load reviews:", err);
      } finally {
        setReviewsLoading(false);
      }
    }
    fetchReviews();
  }, [id]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "USER") {
      patientProfileService.getMyProfiles().then(myProfiles => {
        setProfiles(myProfiles);
        const primary = myProfiles.find(p => p.isPrimary);
        if (primary) setSelectedProfileId(primary.id);
        else if (myProfiles.length > 0) setSelectedProfileId(myProfiles[0].id);
      }).catch(console.error);
    }
  }, [isAuthenticated, user]);

  const getNext7Days = () => {
    const weekdays = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      return { dateString: `${yyyy}-${mm}-${dd}`, dayOfWeek: date.getDay(), displayDay: weekdays[date.getDay()], displayDate: `${dd}/${mm}` };
    });
  };

  const next7Days = getNext7Days();

  const generateHourlySlots = (schedulesList: DoctorSchedule[]): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    schedulesList.forEach(sch => {
      const [startH] = sch.startTime.split(":").map(Number);
      const [endH] = sch.endTime.split(":").map(Number);
      for (let h = startH; h < endH; h++) {
        const pad = (n: number) => String(n).padStart(2, "0");
        slots.push({ id: `${sch.id}-${pad(h)}:00`, startTime: `${pad(h)}:00`, endTime: `${pad(h + 1)}:00` });
      }
    });
    return slots;
  };

  const handleDateChange = (dateString: string, dayOfWeek: number) => {
    setSelectedDate(dateString);
    setSelectedSlot(null);
    setBookingMessage(null);
    setGlobalDate(dateString);
    setGlobalSlot(null);
    const slotsForDay = schedules.filter(sch => sch.dayOfWeek === dayOfWeek && sch.isAvailable);
    const hourlySlots = generateHourlySlots(slotsForDay);
    const now = new Date();
    const mappedSlots = hourlySlots.map(slot => {
      const slotDateTime = new Date(`${dateString}T${slot.startTime}:00`);
      const isTooClose = slotDateTime.getTime() <= now.getTime() + 2 * 60 * 60 * 1000;
      const count = bookedCounts[slotDateTime.toISOString()] || 0;
      return { ...slot, isBooked: count >= 20, isTooClose, remaining: 20 - count };
    });
    setAvailableTimeSlots(mappedSlots);
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { router.push("/login"); return; }
    if (user?.role !== "USER" && user?.role !== "DOCTOR") {
      setBookingMessage({ type: "error", text: "Chỉ tài khoản người bệnh mới được phép đặt lịch khám." });
      return;
    }
    if (user?.role === "DOCTOR" && doctor?.id === user?.doctorId) {
      setBookingMessage({ type: "error", text: "Bạn không thể tự đặt lịch khám với chính mình." });
      return;
    }
    if (!selectedProfileId) { setBookingMessage({ type: "error", text: "Vui lòng chọn hồ sơ người đi khám." }); return; }
    if (!selectedDate || !selectedSlot) { setBookingMessage({ type: "error", text: "Vui lòng chọn ngày và khung giờ khám bệnh." }); return; }
    if (!doctor?.clinicId) { setBookingMessage({ type: "error", text: "Không tìm thấy thông tin bệnh viện." }); return; }

    setBookingLoading(true);
    setBookingMessage(null);
    try {
      const appointmentDateTime = new Date(`${selectedDate}T${selectedSlot.startTime}:00`);
      const response = await appointmentService.createAppointment({
        doctorId: id, clinicId: doctor.clinicId,
        appointmentDate: appointmentDateTime.toISOString(),
        notes: notes.trim() || undefined, patientProfileId: selectedProfileId,
      });
      setBookingMessage({ type: "success", text: "Đặt lịch thành công! Đang chuyển tới trang thanh toán..." });
      setSelectedSlot(null); setSelectedDate(""); setNotes(""); resetBooking();
      setTimeout(() => router.push(`/payment/${response.appointment.id}`), 1500);
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "message" in err ? String((err as any).message) : "Không thể đặt lịch. Vui lòng thử lại.";
      setBookingMessage({ type: "error", text: msg });
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return <div className="flex h-[80vh] items-center justify-center"><LoadingSpinner className="mx-auto h-10 w-10 text-teal-600" /></div>;
  if (error || !doctor) return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center">
      <Alert type="error" message={error || "Bác sĩ không tồn tại"} className="mb-6" />
      <Link href="/doctors"><Button variant="outline" className="rounded-xl inline-flex items-center gap-1.5"><ArrowLeft className="h-4 w-4" /> Quay lại danh sách</Button></Link>
    </div>
  );

  const avgRating = ratingStats.averageRating || 0;
  const sortedCerts = [...(doctor.certificates || [])].sort((a, b) => (b.issuedYear || 0) - (a.issuedYear || 0));
  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 5);

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Lightbox */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4" onClick={() => setLightboxUrl(null)}>
          <button className="absolute top-4 right-4 text-white hover:text-slate-300 transition-colors"><X className="w-8 h-8" /></button>
          <img src={lightboxUrl} alt="Certificate" className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()} />
        </div>
      )}

      {/* ─── HERO SECTION ─── */}
      <section className="bg-gradient-to-br from-teal-900 via-teal-800 to-slate-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'2\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'}} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
          <Link href="/doctors" className="inline-flex items-center gap-1.5 text-teal-200 hover:text-white transition-colors text-sm font-medium mb-6">
            <ArrowLeft className="h-4 w-4" /> Quay lại danh sách bác sĩ
          </Link>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-36 h-36 md:w-48 md:h-48 rounded-3xl overflow-hidden border-4 border-white/20 shadow-2xl bg-teal-700">
                {doctor.avatar ? (
                  <img src={doctor.avatar} alt={doctor.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-5xl font-bold">{doctor.name.charAt(0)}</div>
                )}
              </div>
              {doctor.isSystemVerified && (
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white rounded-xl px-2 py-1 text-xs font-bold flex items-center gap-1 shadow-lg border border-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" /> Bác sĩ đã xác minh
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-3 py-1 bg-teal-700/50 border border-teal-600/30 text-teal-200 rounded-full text-xs font-semibold flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5" /> {doctor.specialty?.name}
                </span>
                {doctor.status === 'APPROVED' && (
                  <span className="px-3 py-1 bg-green-700/50 border border-green-600/30 text-green-200 rounded-full text-xs font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Đang nhận lịch khám
                  </span>
                )}
              </div>
              
              <h1 className="text-3xl md:text-4xl font-black text-white leading-tight mb-2">{doctor.name}</h1>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-teal-200 mb-6">
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" />
                  <span>{doctor.clinic?.name || doctor.hospital}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Award className="w-4 h-4" />
                  <span>{doctor.experience} năm kinh nghiệm</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2 bg-white/10 rounded-2xl px-4 py-3">
                  <div>
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`w-4 h-4 ${s <= Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-teal-700'}`} />
                      ))}
                    </div>
                    <p className="text-xs text-teal-300 mt-1"><span className="font-bold text-white text-lg">{avgRating}</span> / 5 ({ratingStats.totalReviews} đánh giá)</p>
                  </div>
                </div>
                <div className="bg-white/10 rounded-2xl px-4 py-3">
                  <p className="text-2xl font-black text-white">{new Intl.NumberFormat('vi-VN', {style: 'currency', currency: 'VND'}).format(doctor.price || 0)}</p>
                  <p className="text-xs text-teal-300 mt-1">Phí khám / lượt</p>
                </div>
              </div>
            </div>

            {/* Sticky Book Button (desktop) */}
            <div className="hidden md:flex flex-col gap-3 shrink-0">
              <Link href={`/doctors/${id}/booking`} className="px-8 py-4 bg-white text-teal-700 font-bold text-base rounded-2xl hover:bg-teal-50 transition-colors shadow-2xl flex items-center gap-2 justify-center">
                <CalendarDays className="w-5 h-5" /> Đặt lịch ngay
              </Link>
              <Link href={`/messages?doctorId=${doctor.id}`} className="px-8 py-3 border-2 border-white/30 text-white font-semibold text-sm rounded-2xl hover:bg-white/10 transition-colors text-center flex items-center gap-2 justify-center">
                <MessageCircle className="w-4 h-4" /> Nhắn tin
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Sticky Booking Button */}
      <div className="md:hidden sticky top-0 z-40 bg-white border-b border-slate-100 px-4 py-3 flex gap-3">
        <Link href={`/doctors/${id}/booking`} className="flex-1 py-3 bg-teal-600 text-white font-bold rounded-xl flex items-center justify-center gap-2">
          <CalendarDays className="w-4 h-4" /> Đặt lịch ngay
        </Link>
        <Link href={`/messages?doctorId=${doctor.id}`} className="px-4 py-3 border border-slate-200 rounded-xl text-teal-600 font-semibold text-sm flex items-center gap-1">
          <MessageCircle className="w-4 h-4" />
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-4xl mx-auto space-y-8">
            <BookingProgress />

            {/* About Section */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-teal-600" /> Giới thiệu
              </h2>
              {doctor.description ? (
                <p className="text-slate-600 leading-relaxed text-sm">{doctor.description}</p>
              ) : (
                <p className="text-slate-400 italic text-sm">Bác sĩ chưa cập nhật phần giới thiệu.</p>
              )}
              
              {doctor.clinic && (
                <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-teal-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-800">{doctor.clinic.name}</p>
                    {doctor.clinic.address && <p className="text-sm text-slate-500 mt-1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {doctor.clinic.address}</p>}
                  </div>
                </div>
              )}
            </div>

            {/* Timeline Certificates */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Award className="w-5 h-5 text-teal-600" /> Chứng chỉ & Kinh nghiệm
              </h2>

              {sortedCerts.length === 0 ? (
                <p className="text-slate-400 italic text-sm">Bác sĩ chưa cập nhật chứng chỉ y khoa.</p>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-teal-500 via-teal-300 to-transparent" />
                  
                  <div className="space-y-6">
                    {sortedCerts.map((cert, idx) => (
                      <div key={cert.id} className="relative flex gap-5 pl-14">
                        {/* Timeline dot */}
                        <div className={`absolute left-[14px] top-2 w-4 h-4 rounded-full border-2 border-white shadow-md ${idx === 0 ? 'bg-teal-500' : 'bg-slate-300'}`} />
                        
                        <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-100 p-4 hover:border-teal-200 transition-colors group">
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                              <p className="font-bold text-slate-800">{cert.title}</p>
                              {cert.issuer && <p className="text-sm text-teal-600 font-medium mt-0.5">{cert.issuer}</p>}
                              {cert.description && <p className="text-xs text-slate-500 mt-2 leading-relaxed">{cert.description}</p>}
                            </div>
                            <div className="text-right shrink-0">
                              {cert.issuedYear && (
                                <span className="text-xs font-bold text-white bg-teal-500 px-2 py-1 rounded-lg">{cert.issuedYear}</span>
                              )}
                            </div>
                          </div>
                          
                          {cert.imageUrl && (
                            <div className="mt-3">
                              <button onClick={() => setLightboxUrl(cert.imageUrl!)} className="relative h-28 w-40 rounded-xl overflow-hidden border border-slate-200 block hover:opacity-90 transition-opacity">
                                <img src={cert.imageUrl} alt={cert.title} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
                                  Xem lớn
                                </div>
                              </button>
                            </div>
                          )}
                          {cert.fileUrl && !cert.imageUrl && (
                            <a href={cert.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-teal-600 hover:underline">
                              <FileText className="w-3.5 h-3.5" /> Xem tài liệu
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Reviews Section */}
            <div id="reviews" className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" /> Đánh giá từ bệnh nhân
              </h2>

              {reviewsLoading ? (
                <div className="flex justify-center p-8"><LoadingSpinner className="w-8 h-8 text-teal-600" /></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                  {/* Rating Summary */}
                  <div className="md:col-span-2 bg-gradient-to-br from-teal-50 to-slate-50 rounded-2xl p-6 flex flex-col items-center justify-center text-center border border-slate-100">
                    <span className="text-6xl font-black text-slate-900 leading-none">{avgRating}</span>
                    <div className="flex items-center gap-0.5 mt-3">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`w-5 h-5 ${s <= Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-2 font-medium">{ratingStats.totalReviews} lượt đánh giá</p>
                    
                    <div className="w-full mt-6 space-y-2">
                      {[5,4,3,2,1].map(star => {
                        const count = ratingStats.distribution[star] || 0;
                        const pct = ratingStats.totalReviews > 0 ? (count / ratingStats.totalReviews) * 100 : 0;
                        return (
                          <div key={star} className="flex items-center gap-2 text-xs">
                            <span className="w-10 text-right font-semibold text-slate-600">{star} ★</span>
                            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-400 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-6 text-left text-slate-400 font-medium">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Reviews List */}
                  <div className="md:col-span-3 space-y-4">
                    {reviews.length === 0 ? (
                      <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl">
                        <Star className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                        <p className="text-sm font-semibold text-slate-600">Chưa có đánh giá nào</p>
                        <p className="text-xs text-slate-400 mt-1">Bệnh nhân khám xong sẽ gửi nhận xét.</p>
                      </div>
                    ) : (
                      <>
                        {displayedReviews.map(review => {
                          const name = review.user?.fullName || "Bệnh nhân";
                          const maskedName = name.split(" ").map((w: string, i: number, arr: string[]) => (i === 0 || i === arr.length - 1) ? w : w[0] + ".").join(" ");
                          return (
                            <div key={review.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0 border border-slate-100">
                                  {review.user?.avatar ? (
                                    <img src={review.user.avatar} alt={name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">{name.charAt(0)}</div>
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-bold text-slate-800 text-sm">{maskedName}</p>
                                    <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5">
                                      <CheckCircle2 className="w-2.5 h-2.5" /> Đã xác minh
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    {[1,2,3,4,5].map(s => (
                                      <Star key={s} className={`w-3 h-3 ${s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                                    ))}
                                    <span className="text-[10px] text-slate-400 ml-1">{new Date(review.createdAt).toLocaleDateString("vi-VN")}</span>
                                  </div>
                                </div>
                              </div>
                              {review.comment && <p className="text-sm text-slate-600 leading-relaxed italic">"{review.comment}"</p>}
                            </div>
                          );
                        })}
                        {reviews.length > 5 && (
                          <button onClick={() => setShowAllReviews(!showAllReviews)} className="w-full py-3 border border-slate-200 text-slate-600 font-semibold text-sm rounded-2xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5">
                            {showAllReviews ? 'Thu gọn' : `Xem tất cả ${reviews.length} đánh giá`}
                            <ChevronRight className={`w-4 h-4 transition-transform ${showAllReviews ? 'rotate-90' : ''}`} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
        </div>
      </div>
    </div>
  );
}
