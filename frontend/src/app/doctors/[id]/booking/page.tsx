"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { appointmentService } from "@/services/appointment.service";
import { doctorService } from "@/services/doctor.service";
import { Doctor, DoctorSchedule, TimeSlot } from "@/types/doctor";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import {
  ArrowLeft, CalendarDays, Clock, Stethoscope, Building2,
  Award, ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { patientProfileService, PatientProfile } from "@/services/patient-profile.service";
import BookingProgress from "@/components/ui/BookingProgress";
import { useBooking } from "@/hooks/useBooking";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function DoctorBookingPage({ params }: PageProps) {
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

  // Patient Profiles
  const [profiles, setProfiles] = useState<PatientProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);
  const [bookingErrors, setBookingErrors] = useState<Record<string, string>>({});
  const [newProfileData, setNewProfileData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    gender: "Nam",
    dateOfBirth: "",
    cccd: "",
    province: "",
    ward: "",
    address: ""
  });

  // Booking states
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [availableTimeSlots, setAvailableTimeSlots] = useState<(TimeSlot & { isTooClose?: boolean; isBooked?: boolean; remaining?: number })[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [notes, setNotes] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingMessage, setBookingMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const validateBookingForm = (data: typeof newProfileData): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!data.fullName.trim()) errors.fullName = "Họ và tên không được để trống.";
    else if (!/^[\p{L}\s]+$/u.test(data.fullName.trim())) errors.fullName = "Họ và tên không được chứa số hoặc ký hiệu đặc biệt.";
    else if (data.fullName.trim().length < 2) errors.fullName = "Họ và tên phải có ít nhất 2 ký tự.";
    if (!data.email.trim()) errors.email = "Email không được để trống.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) errors.email = "Email không hợp lệ.";
    if (!data.phoneNumber.trim()) errors.phoneNumber = "Số điện thoại không được để trống.";
    else if (!/^0[0-9]{9}$/.test(data.phoneNumber.trim())) errors.phoneNumber = "Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0).";
    if (!data.dateOfBirth) errors.dateOfBirth = "Ngày sinh không được để trống.";
    else {
      const dob = new Date(data.dateOfBirth);
      const minDate = new Date(); minDate.setFullYear(new Date().getFullYear() - 120);
      if (isNaN(dob.getTime())) errors.dateOfBirth = "Ngày sinh không hợp lệ.";
      else if (dob > new Date()) errors.dateOfBirth = "Không được chọn ngày tương lai.";
      else if (dob < minDate) errors.dateOfBirth = "Tuổi tối đa là 120.";
    }
    if (!data.gender) errors.gender = "Vui lòng chọn giới tính.";
    if (data.cccd && data.cccd.trim() && !/^[0-9]{9}$|^[0-9]{12}$/.test(data.cccd.trim())) errors.cccd = "CCCD/CMND không hợp lệ (9 hoặc 12 số).";
    return errors;
  };

  const handleAutofill = (p: PatientProfile) => {
    setSelectedProfileId(p.id);
    setNewProfileData(prev => ({
      ...prev,
      fullName: p.fullName || "",
      phoneNumber: p.phoneNumber || "",
      gender: p.gender || "Nam",
      dateOfBirth: p.dateOfBirth ? p.dateOfBirth.split('T')[0] : "",
      cccd: p.cccd || ""
    }));
  };

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const detailRes = await doctorService.getDoctor(id);
        setDoctor(detailRes.doctor);
        setGlobalDoctor(detailRes.doctor);
        const scheduleRes = await doctorService.listSchedules(id);
        setSchedules(scheduleRes.schedules);
        if (scheduleRes.bookedCounts) setBookedCounts(scheduleRes.bookedCounts);

        if (isAuthenticated && user?.role === "USER") {
          const myProfiles = await patientProfileService.getMyProfiles();
          setProfiles(myProfiles);
          const primary = myProfiles.find(p => p.isPrimary);
          if (primary) setSelectedProfileId(primary.id);
          else if (myProfiles.length > 0) setSelectedProfileId(myProfiles[0].id);
        }
      } catch (err: unknown) {
        const msg = err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Không thể tải thông tin bác sĩ.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, isAuthenticated, user]);

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
    setGlobalDate(dateString);
    setSelectedSlot(null);
    setGlobalSlot(null);
    setBookingMessage(null);
    const slotsForDay = schedules.filter(sch => sch.dayOfWeek === dayOfWeek && sch.isAvailable);
    const isQuick = doctor?.specialty?.name?.toLowerCase().includes("mắt") || false;
    const capacity = isQuick ? 3 : 1;
    const hourlySlots = generateHourlySlots(slotsForDay);
    const now = new Date();
    const mappedSlots = hourlySlots.map(slot => {
      const slotDateTime = new Date(`${dateString}T${slot.startTime}:00`);
      const isTooClose = slotDateTime.getTime() <= now.getTime() + 2 * 60 * 60 * 1000;
      const count = bookedCounts[slotDateTime.toISOString()] || 0;
      return { ...slot, isBooked: count >= capacity, isTooClose, remaining: capacity - count, capacity };
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
    const bErrors = validateBookingForm(newProfileData);
    setBookingErrors(bErrors);
    if (Object.keys(bErrors).length > 0) {
      setBookingMessage({ type: "error", text: "Vui lòng kiểm tra lại thông tin người đi khám." });
      return;
    }
    if (!agreedToPolicy) {
      setBookingMessage({ type: "error", text: "Vui lòng đồng ý với chính sách bảo mật để tiếp tục." });
      return;
    }
    if (!selectedDate || !selectedSlot) {
      setBookingMessage({ type: "error", text: "Vui lòng chọn ngày và khung giờ khám bệnh." });
      return;
    }
    if (!doctor?.clinicId) {
      setBookingMessage({ type: "error", text: "Không tìm thấy thông tin bệnh viện." });
      return;
    }

    setBookingLoading(true);
    setBookingMessage(null);
    try {
      const appointmentDateTime = new Date(`${selectedDate}T${selectedSlot.startTime}:00`);
      const response = await appointmentService.createAppointment({
        doctorId: id,
        clinicId: doctor.clinicId,
        appointmentDate: appointmentDateTime.toISOString(),
        notes: notes.trim() || undefined,
        patientProfileId: selectedProfileId || undefined,
        newPatientProfile: !selectedProfileId ? { ...newProfileData, isTemporary: true } : undefined,
      });
      setBookingMessage({ type: "success", text: "Đặt lịch thành công! Đang chuyển tới trang thanh toán..." });
      resetBooking();
      setTimeout(() => {
        router.push(`/payment/${response.appointment.id}`);
        router.refresh();
      }, 1500);
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "message" in err
        ? String((err as { message: unknown }).message)
        : "Không thể đặt lịch. Vui lòng thử lại.";
      setBookingMessage({ type: "error", text: msg });
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return <div className="flex h-[80vh] items-center justify-center bg-slate-50"><LoadingSpinner /></div>;
  if (error || !doctor) return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center">
      <Alert type="error" message={error || "Bác sĩ không tồn tại"} className="mb-6" />
      <Link href="/doctors"><Button variant="outline" className="rounded-xl inline-flex items-center gap-1.5"><ArrowLeft className="h-4 w-4" /> Quay lại danh sách</Button></Link>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow">
      <Link href={`/doctors/${id}`} className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors text-sm font-semibold mb-8">
        <ArrowLeft className="h-4 w-4" /> Quay lại trang bác sĩ
      </Link>

      <BookingProgress />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Doctor Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative">
                <div className="w-28 h-28 rounded-3xl overflow-hidden border-4 border-teal-50 shadow-md bg-teal-100">
                  {doctor.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={doctor.avatar} alt={doctor.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-teal-600 text-4xl font-black">
                      {doctor.name.charAt(0)}
                    </div>
                  )}
                </div>
                {doctor.isSystemVerified && (
                  <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white rounded-xl px-2 py-1 text-xs font-bold flex items-center gap-1 shadow-lg">
                    <ShieldCheck className="w-3 h-3" /> Đã xác minh
                  </div>
                )}
              </div>

              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-950">{doctor.name}</h1>
                <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 bg-teal-50 border border-teal-100/50 rounded-lg px-3 py-1.5 mt-2.5">
                  <Stethoscope className="w-4 h-4" />
                  <span>{doctor.specialty?.name}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3 border-t border-slate-100 pt-5">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Building2 className="w-4 h-4 text-teal-500 shrink-0" />
                <span>{doctor.clinic?.name || doctor.hospital || "Chưa cập nhật"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Award className="w-4 h-4 text-teal-500 shrink-0" />
                <span>{doctor.experience} năm kinh nghiệm</span>
              </div>
              <div className="mt-4 p-4 bg-teal-50 rounded-2xl border border-teal-100 text-center">
                <p className="text-xs text-teal-600 font-semibold mb-1">Phí khám / lượt</p>
                <p className="text-2xl font-black text-teal-700">
                  {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(doctor.price || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Booking Form */}
        <div className="lg:col-span-7 bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2 mb-6">
            <CalendarDays className="h-5 w-5 text-teal-600" />
            Đặt Lịch Khám Bệnh
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

              {/* Bước 1: Thông tin người đi khám */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-bold text-slate-800">
                    Bước 1: Thông tin người đi khám
                  </label>
                </div>

                {/* Quick-select profile chips */}
                {profiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-teal-50/70 border border-teal-100">
                    <span className="text-xs font-semibold text-slate-500 my-auto mr-1 shrink-0">Chọn nhanh từ hồ sơ:</span>
                    {profiles.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleAutofill(p)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${selectedProfileId === p.id ? 'bg-teal-600 text-white border-teal-600 shadow-sm' : 'bg-white text-slate-600 border-slate-300 hover:border-teal-400 hover:text-teal-700'}`}
                      >
                        {p.fullName}
                      </button>
                    ))}
                    <Link href="/profile/patients" className="ml-auto text-xs font-semibold text-teal-600 hover:underline my-auto whitespace-nowrap">
                      Quản lý hồ sơ
                    </Link>
                  </div>
                )}

                {/* Detail form */}
                <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50/40">
                  {/* Họ và tên */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Họ và tên <span className="text-red-500">*</span></label>
                    <Input
                      value={newProfileData.fullName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setNewProfileData({...newProfileData, fullName: e.target.value}); setBookingErrors(prev => ({...prev, fullName: ""})); setSelectedProfileId(""); }}
                      placeholder="Nguyễn Văn An"
                      className={`!py-2.5 !text-sm ${bookingErrors.fullName ? '!border-red-400' : ''}`}
                    />
                    {bookingErrors.fullName && <p className="text-xs text-red-500 mt-1">{bookingErrors.fullName}</p>}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email <span className="text-red-500">*</span></label>
                    <Input
                      type="email"
                      value={newProfileData.email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setNewProfileData({...newProfileData, email: e.target.value}); setBookingErrors(prev => ({...prev, email: ""})); setSelectedProfileId(""); }}
                      placeholder="example@gmail.com"
                      className={`!py-2.5 !text-sm ${bookingErrors.email ? '!border-red-400' : ''}`}
                    />
                    {bookingErrors.email && <p className="text-xs text-red-500 mt-1">{bookingErrors.email}</p>}
                  </div>

                  {/* Số điện thoại */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Số điện thoại <span className="text-red-500">*</span></label>
                    <Input
                      value={newProfileData.phoneNumber}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setNewProfileData({...newProfileData, phoneNumber: val});
                        setBookingErrors(prev => ({...prev, phoneNumber: ""}));
                        setSelectedProfileId("");
                      }}
                      placeholder="0987654321"
                      maxLength={10}
                      className={`!py-2.5 !text-sm ${bookingErrors.phoneNumber ? '!border-red-400' : ''}`}
                    />
                    {bookingErrors.phoneNumber && <p className="text-xs text-red-500 mt-1">{bookingErrors.phoneNumber}</p>}
                  </div>

                  {/* Ngày sinh + Giới tính */}
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Ngày sinh <span className="text-red-500">*</span></label>
                      <Input
                        type="date"
                        value={newProfileData.dateOfBirth}
                        max={new Date().toISOString().split('T')[0]}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setNewProfileData({...newProfileData, dateOfBirth: e.target.value}); setBookingErrors(prev => ({...prev, dateOfBirth: ""})); setSelectedProfileId(""); }}
                        className={`!py-2.5 !text-sm ${bookingErrors.dateOfBirth ? '!border-red-400' : ''}`}
                      />
                      {bookingErrors.dateOfBirth && <p className="text-xs text-red-500 mt-1">{bookingErrors.dateOfBirth}</p>}
                    </div>
                    <div className="flex items-center gap-4 pb-2.5">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" name="doctor_booking_gender" value="Nam" checked={newProfileData.gender === "Nam"} onChange={() => { setNewProfileData({...newProfileData, gender: "Nam"}); setSelectedProfileId(""); }} className="accent-teal-600 w-4 h-4" />
                        <span className="text-sm font-medium text-slate-700">Nam</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" name="doctor_booking_gender" value="Nữ" checked={newProfileData.gender === "Nữ"} onChange={() => { setNewProfileData({...newProfileData, gender: "Nữ"}); setSelectedProfileId(""); }} className="accent-teal-600 w-4 h-4" />
                        <span className="text-sm font-medium text-slate-700">Nữ</span>
                      </label>
                    </div>
                  </div>

                  {/* CCCD */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">CCCD/CMND</label>
                    <Input
                      value={newProfileData.cccd}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setNewProfileData({...newProfileData, cccd: val});
                        setBookingErrors(prev => ({...prev, cccd: ""}));
                        setSelectedProfileId("");
                      }}
                      maxLength={12}
                      placeholder="9 hoặc 12 chữ số"
                      className={`!py-2.5 !text-sm ${bookingErrors.cccd ? '!border-red-400' : ''}`}
                    />
                    {bookingErrors.cccd && <p className="text-xs text-red-500 mt-1">{bookingErrors.cccd}</p>}
                  </div>

                  {/* Tỉnh thành + Phường/Xã */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tỉnh/Thành phố</label>
                      <select
                        className="w-full border border-slate-200 px-3 py-2.5 rounded-xl text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                        value={newProfileData.province}
                        onChange={e => { setNewProfileData({...newProfileData, province: e.target.value, ward: ""}); setSelectedProfileId(""); }}
                      >
                        <option value="">Chọn tỉnh thành</option>
                        <option value="Hà Nội">Hà Nội</option>
                        <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                        <option value="Đà Nẵng">Đà Nẵng</option>
                        <option value="Cần Thơ">Cần Thơ</option>
                        <option value="Hải Phòng">Hải Phòng</option>
                        <option value="Bình Dương">Bình Dương</option>
                        <option value="Đồng Nai">Đồng Nai</option>
                        <option value="Khánh Hòa">Khánh Hòa</option>
                        <option value="Thừa Thiên Huế">Thừa Thiên Huế</option>
                        <option value="Quảng Nam">Quảng Nam</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Phường/Xã</label>
                      <Input
                        value={newProfileData.ward}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setNewProfileData({...newProfileData, ward: e.target.value}); setSelectedProfileId(""); }}
                        placeholder="Nhập phường/xã"
                        className="!py-2.5 !text-sm"
                      />
                    </div>
                  </div>

                  {/* Địa chỉ */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Địa chỉ</label>
                    <Input
                      value={newProfileData.address}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setNewProfileData({...newProfileData, address: e.target.value}); setSelectedProfileId(""); }}
                      placeholder="Số nhà, tên đường..."
                      className="!py-2.5 !text-sm"
                    />
                  </div>

                  {/* Policy checkbox */}
                  <div className="pt-1">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreedToPolicy}
                        onChange={e => setAgreedToPolicy(e.target.checked)}
                        className="mt-0.5 accent-teal-600 w-4 h-4 shrink-0"
                      />
                      <span className="text-xs text-slate-500 leading-relaxed">
                        Tôi xác nhận đã đọc và đồng ý với{" "}
                        <Link href="/privacy" className="text-teal-600 font-semibold hover:underline">
                          chính sách bảo mật.
                        </Link>
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Bước 2: Chọn ngày */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-800">
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

              {/* Bước 3: Chọn giờ */}
              {selectedDate && (
                <div className="space-y-3 pt-2">
                  <label className="block text-sm font-bold text-slate-800">
                    Bước 3: Chọn khung giờ khám
                  </label>
                  {availableTimeSlots.length === 0 ? (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 text-xs text-amber-800">
                      Bác sĩ không có lịch làm việc vào ngày này. Vui lòng chọn ngày khác!
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
                                : "bg-teal-50 border-teal-200 text-teal-700 hover:border-teal-400 hover:bg-teal-100 hover:shadow-md"
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-4 w-4 shrink-0" />
                              <span>{slot.startTime} - {slot.endTime}</span>
                            </div>
                            {isDisabled ? (
                              <span className="text-[10px] font-bold opacity-80 uppercase tracking-widest">
                                {slot.isTooClose ? "Quá gần" : "Đã kín chỗ"}
                              </span>
                            ) : (slot.capacity || 0) > 1 ? (
                              <span className="text-[10px] opacity-90">
                                Còn {slot.remaining} chỗ
                              </span>
                            ) : null}
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
                  <label htmlFor="dr_notes" className="block text-sm font-bold text-slate-800">
                    Bước 4: Triệu chứng / Ghi chú (tùy chọn)
                  </label>
                  <textarea
                    id="dr_notes"
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Mô tả triệu chứng, lý do khám để bác sĩ chuẩn bị trước..."
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
