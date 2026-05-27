"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useBooking } from "@/hooks/useBooking";
import BookingStepCard from "./BookingStepCard";
import { Search, Clock, ClipboardCheck, AlertCircle } from "lucide-react";

export default function BookingSteps() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { selectedDoctor } = useBooking();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleStepClick = (stepIndex: number) => {
    setErrorMessage(null);

    if (stepIndex === 1) {
      router.push("/doctors");
    } else if (stepIndex === 2) {
      if (!selectedDoctor) {
        setErrorMessage("Vui lòng chọn một bác sĩ trước khi chọn khung giờ khám!");
        setTimeout(() => setErrorMessage(null), 4500);
        
        // Redirect to doctors list automatically in 1.5s
        setTimeout(() => {
          router.push("/doctors");
        }, 1500);
      } else {
        router.push(`/doctors/${selectedDoctor.id}`);
      }
    } else if (stepIndex === 3) {
      if (!isAuthenticated) {
        router.push("/login?redirect=/my-appointments");
      } else {
        router.push("/my-appointments");
      }
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Custom Inline Notification toast */}
      {errorMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-white border border-rose-100 text-slate-800 px-5 py-4 rounded-2xl shadow-2xl animate-fade-in max-w-sm">
          <div className="h-8 w-8 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
            <AlertCircle className="h-5 w-5 text-rose-500" />
          </div>
          <div className="text-xs leading-relaxed">
            <p className="font-bold text-slate-900 mb-0.5">Yêu cầu chọn bác sĩ</p>
            <p className="text-slate-500 font-medium">{errorMessage}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <BookingStepCard
          step="01"
          title="Tìm Kiếm Bác Sĩ"
          description="Dễ dàng tìm kiếm bác sĩ theo chuyên môn, bệnh viện hoặc lọc theo chuyên khoa động phù hợp."
          icon={<Search className="h-5 w-5" />}
          isActive={!selectedDoctor}
          isCompleted={!!selectedDoctor}
          onClick={() => handleStepClick(1)}
        />
        <BookingStepCard
          step="02"
          title="Chọn Khung Giờ"
          description="Xem lịch làm việc chi tiết và chọn ngày khám, khung giờ rảnh trực tiếp trên hồ sơ bác sĩ."
          icon={<Clock className="h-5 w-5" />}
          isActive={!!selectedDoctor}
          isCompleted={false}
          onClick={() => handleStepClick(2)}
        />
        <BookingStepCard
          step="03"
          title="Xác Nhận & Đặt Lịch"
          description="Đăng nhập tài khoản bệnh nhân, nhập triệu chứng lâm sàng và hoàn thành lịch đặt chỉ trong vài giây."
          icon={<ClipboardCheck className="h-5 w-5" />}
          isActive={false}
          isCompleted={false}
          onClick={() => handleStepClick(3)}
        />
      </div>
    </div>
  );
}
