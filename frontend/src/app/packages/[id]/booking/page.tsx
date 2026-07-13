"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { appointmentService } from "@/services/appointment.service";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import { ArrowLeft, CalendarDays, Clock, Package, UserCircle2 } from "lucide-react";
import Link from "next/link";
import { packageService, MedicalPackage } from "@/services/package.service";
import { patientProfileService, PatientProfile } from "@/services/patient-profile.service";
import BookingProgress from "@/components/ui/BookingProgress";
import { useBooking } from "@/hooks/useBooking";

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  isTooClose?: boolean;
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
  const [bookedCounts, setBookedCounts] = useState<Record<string, number>>({});

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

  const validateBookingForm = (data: typeof newProfileData): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!data.fullName.trim()) errors.fullName = "Họ và tên không được để trống.";
    else if (!/^[\p{L}\s]+$/u.test(data.fullName.trim())) errors.fullName = "Họ và tên không được chứa số hoặc ký hiệu đặc biệt.";
    else if (data.fullName.trim().length < 2) errors.fullName = "Họ và tên phải có ít nhất 2 ký tự.";
    if (!data.email.trim()) errors.email = "Email không được để trống.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) errors.email = "Email không hợp lệ.";
    if (!data.phoneNumber.trim()) errors.phoneNumber = "Số điện thoại không được để trống.";
    else if (!/^0[0-9]{9}$/.test(data.phoneNumber.trim())) errors.phoneNumber = "Số điện thoại không hợp lệ.";
    if (!data.dateOfBirth) errors.dateOfBirth = "Ngày sinh không được để trống.";
    else {
      const dob = new Date(data.dateOfBirth);
      const minDate = new Date(); minDate.setFullYear(new Date().getFullYear() - 120);
      if (isNaN(dob.getTime())) errors.dateOfBirth = "Ngày sinh không hợp lệ.";
      else if (dob > new Date()) errors.dateOfBirth = "Không được chọn ngày tương lai.";
      else if (dob < minDate) errors.dateOfBirth = "Tuổi tối đa là 120.";
    }
    if (!data.gender) errors.gender = "Vui lòng chọn giới tính.";
    if (data.cccd && data.cccd.trim() && !/^[0-9]{9}$|^[0-9]{12}$/.test(data.cccd.trim())) errors.cccd = "CCCD/CMND không hợp lệ.";
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

  // Booking Flow States
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [availableTimeSlots, setAvailableTimeSlots] = useState<(TimeSlot & { isTooClose?: boolean; isBooked?: boolean; remaining?: number })[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [notes, setNotes] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingMessage, setBookingMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch package & profiles on mount
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        const detailRes = await packageService.getPackageById(id);
        if (detailRes) {
           setPkg(detailRes);
           // Fetch booked slots for package
           try {
              const slotsRes = await packageService.getBookedSlots(id);
              if (slotsRes.bookedCounts) {
                 setBookedCounts(slotsRes.bookedCounts);
              }
           } catch (slotErr) {
              console.error("Failed to load booked slots for package", slotErr);
           }
        } else {
           setError("Không thể tải chi tiết gói khám.");
        }

        if (isAuthenticated && user?.role === "USER") {
           const myProfiles = await patientProfileService.getMyProfiles();
           setProfiles(myProfiles);
           const primary = myProfiles.find(p => p.isPrimary);
           if (primary) setSelectedProfileId(primary.id);
           else if (myProfiles.length > 0) setSelectedProfileId(myProfiles[0].id);
        }
      } catch (err: unknown) {
        const errorMsg =
          err && typeof err === "object" && "message" in err
            ? String((err as { message: unknown }).message)
            : "Lỗi tải dữ liệu";
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id, isAuthenticated, user]);

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
        dayOfWeek: date.getDay(),
        displayDay: weekdays[date.getDay()],
        displayDate: `${dd}/${mm}`,
      });
    }
    return days;
  };

  const next7Days = getNext7Days();

  // Helper to generate slots
  const generateHourlySlots = () => {
    const startHour = 8;
    const endHour = 17; 
    const slots: TimeSlot[] = [];
    let slotId = 1;
    for (let h = startHour; h < endHour; h++) {
      if (h === 12) continue; // skip 12:00 - 13:00 break
      const start = h.toString().padStart(2, "0") + ":00";
      const end = (h + 1).toString().padStart(2, "0") + ":00";
      slots.push({ id: `slot_${slotId++}`, startTime: start, endTime: end });
    }
    return slots;
  };

  const handleDateChange = (dateString: string, dayOfWeek: number) => {
    setSelectedDate(dateString);
    setGlobalDate(dateString);
    setSelectedSlot(null);
    setGlobalSlot(null);
    setBookingMessage(null);
    
    // For packages, assume they are available 8-17. Real logic would fetch availability.
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
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
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
      setBookingMessage({ type: "error", text: "Vui lòng xác nhận đồng ý với chính sách bảo mật để tiếp tục." });
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
        patientProfileId: selectedProfileId || undefined,
        newPatientProfile: !selectedProfileId ? { ...newProfileData, isTemporary: true } : undefined,
      });

      setBookingMessage({ type: "success", text: "Đặt lịch thành công! Chuyển hướng..." });
      
      resetBooking();

      setTimeout(() => {
        router.push(`/payment/${response.appointment.id}`);
        router.refresh();
      }, 1500);

      setBookingMessage({ type: "success", text: "Đặt lịch thành công! Chuyển hướng..." });
      
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
      setBookingMessage({ type: "error", text: errorMsg });
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return <div className="flex h-[80vh] items-center justify-center bg-slate-50"><LoadingSpinner /></div>;
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
      <Link href={`/packages/${pkg.id}`} className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors text-sm font-semibold mb-8">
        <ArrowLeft className="h-4 w-4" /> Quay lại chi tiết gói khám
      </Link>

      <BookingProgress />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
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
                  <span className="text-lg">{pkg.price.toLocaleString("vi-VN")} VND</span>
                </div>
              </div>
            </div>
          </div>
        </div>

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
              
              {/* Step 0: Patient Info Form */}
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
                    <Link href="/profile" className="ml-auto text-xs font-semibold text-teal-600 hover:underline my-auto whitespace-nowrap">
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
                      onChange={(e: any) => { setNewProfileData({...newProfileData, fullName: e.target.value}); setBookingErrors(prev => ({...prev, fullName: ""})); setSelectedProfileId(""); }}
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
                      onChange={(e: any) => { setNewProfileData({...newProfileData, email: e.target.value}); setBookingErrors(prev => ({...prev, email: ""})); setSelectedProfileId(""); }}
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
                      onChange={(e: any) => { 
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
                        onChange={(e: any) => { setNewProfileData({...newProfileData, dateOfBirth: e.target.value}); setBookingErrors(prev => ({...prev, dateOfBirth: ""})); setSelectedProfileId(""); }}
                        className={`!py-2.5 !text-sm ${bookingErrors.dateOfBirth ? '!border-red-400' : ''}`}
                      />
                      {bookingErrors.dateOfBirth && <p className="text-xs text-red-500 mt-1">{bookingErrors.dateOfBirth}</p>}
                    </div>
                    <div className="flex items-center gap-4 pb-2.5">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="booking_gender"
                          value="Nam"
                          checked={newProfileData.gender === "Nam"}
                          onChange={() => { setNewProfileData({...newProfileData, gender: "Nam"}); setSelectedProfileId(""); }}
                          className="accent-teal-600 w-4 h-4"
                        />
                        <span className="text-sm font-medium text-slate-700">Nam</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="booking_gender"
                          value="Nữ"
                          checked={newProfileData.gender === "Nữ"}
                          onChange={() => { setNewProfileData({...newProfileData, gender: "Nữ"}); setSelectedProfileId(""); }}
                          className="accent-teal-600 w-4 h-4"
                        />
                        <span className="text-sm font-medium text-slate-700">Nữ</span>
                      </label>
                    </div>
                  </div>

                  {/* CCCD */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">CCCD/CMND</label>
                    <Input
                      value={newProfileData.cccd}
                      onChange={(e: any) => { 
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
                        onChange={(e: any) => { setNewProfileData({...newProfileData, ward: e.target.value}); setSelectedProfileId(""); }}
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
                      onChange={(e: any) => { setNewProfileData({...newProfileData, address: e.target.value}); setSelectedProfileId(""); }}
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
                      Cơ sở y tế không có lịch làm việc vào ngày này. Vui lòng chọn ngày khác!
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
                          title={slot.isTooClose ? "Slot quá gần (cách hiện tại < 2 tiếng), vui lòng chọn giờ khác" : slot.isBooked ? "Đã hết chỗ" : undefined}
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
                              {slot.isTooClose ? "Quá gần" : slot.isBooked ? "Hết chỗ" : `Còn ${slot.remaining} chỗ`}
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
                    Bước 4: Nhập ghi chú thêm (tùy chọn)
                  </label>
                  <textarea
                    id="notes"
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-sm resize-none"
                  />
                </div>
              )}

              {bookingMessage && (
                <Alert type={bookingMessage.type} message={bookingMessage.text} className="mt-4" />
              )}

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
