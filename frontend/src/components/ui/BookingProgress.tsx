"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useBooking } from "@/hooks/useBooking";
import { Search, Clock, ClipboardCheck, Check } from "lucide-react";

export default function BookingProgress() {
  const pathname = usePathname();
  const router = useRouter();
  const { selectedDoctor } = useBooking();

  // Determine current active step based on path
  let currentStep = 1;
  if (pathname.startsWith("/doctors/")) {
    currentStep = 2;
  } else if (pathname === "/my-appointments") {
    currentStep = 3;
  }

  const steps = [
    {
      id: 1,
      title: "Tìm kiếm bác sĩ",
      url: "/doctors",
      icon: <Search className="h-4 w-4" />,
    },
    {
      id: 2,
      title: "Chọn khung giờ khám",
      url: selectedDoctor ? `/doctors/${selectedDoctor.id}` : "/doctors",
      icon: <Clock className="h-4 w-4" />,
    },
    {
      id: 3,
      title: "Đặt lịch & Hoàn thành",
      url: "/my-appointments",
      icon: <ClipboardCheck className="h-4 w-4" />,
    },
  ];

  const handleStepClick = (stepId: number, url: string) => {
    if (stepId === 2 && !selectedDoctor) {
      router.push("/doctors");
      return;
    }
    router.push(url);
  };

  return (
    <div className="max-w-4xl mx-auto w-full bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 shadow-sm mb-8">
      <div className="relative flex items-center justify-between">
        {/* Progress Connector Lines */}
        <div className="absolute left-[30px] right-[30px] top-[20px] h-1 bg-slate-100 -translate-y-1/2 z-0">
          <div
            className="h-full bg-teal-600 transition-all duration-500 ease-out"
            style={{
              width:
                currentStep === 1
                  ? "0%"
                  : currentStep === 2
                  ? "50%"
                  : "100%",
            }}
          />
        </div>

        {/* Steps */}
        {steps.map((step) => {
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;

          return (
            <div
              key={step.id}
              onClick={() => handleStepClick(step.id, step.url)}
              className="flex flex-col items-center relative z-10 shrink-0 cursor-pointer group"
            >
              {/* Step Circle */}
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isCompleted
                    ? "bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-600/10"
                    : isActive
                    ? "bg-white border-teal-600 text-teal-600 ring-4 ring-teal-500/10 scale-105"
                    : "bg-white border-slate-200 text-slate-400 group-hover:border-teal-500 group-hover:text-teal-600"
                }`}
              >
                {isCompleted ? (
                  <Check className="h-4.5 w-4.5 stroke-[3] animate-fade-in" />
                ) : (
                  step.icon
                )}
              </div>

              {/* Step Title */}
              <span
                className={`text-[10px] sm:text-xs font-bold mt-2.5 transition-colors duration-300 ${
                  isActive
                    ? "text-teal-600"
                    : isCompleted
                    ? "text-slate-800"
                    : "text-slate-400 group-hover:text-teal-600"
                }`}
              >
                {step.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
