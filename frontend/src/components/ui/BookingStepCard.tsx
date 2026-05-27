import React from "react";
import { Check } from "lucide-react";

interface BookingStepCardProps {
  step: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  isActive: boolean;
  isCompleted: boolean;
  onClick: () => void;
}

export default function BookingStepCard({
  step,
  title,
  description,
  icon,
  isActive,
  isCompleted,
  onClick,
}: BookingStepCardProps) {
  return (
    <div
      onClick={onClick}
      className={`group relative bg-white border rounded-3xl p-6 transition-all duration-300 shadow-sm hover:shadow-xl cursor-pointer select-none flex flex-col justify-between h-full overflow-hidden ${
        isActive
          ? "border-teal-500 ring-2 ring-teal-500/10 bg-gradient-to-br from-white to-teal-50/20 scale-[1.02]"
          : isCompleted
          ? "border-emerald-200 bg-emerald-50/10"
          : "border-slate-100 hover:border-teal-200"
      }`}
    >
      {/* Decorative backdrop glow */}
      {isActive && (
        <div className="absolute -right-16 -top-16 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
      )}
      
      <div>
        <div className="flex justify-between items-start mb-6">
          <div
            className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-colors ${
              isActive
                ? "bg-teal-600 text-white shadow-lg shadow-teal-600/20"
                : isCompleted
                ? "bg-emerald-100 text-emerald-600"
                : "bg-slate-50 text-slate-500 group-hover:bg-teal-50 group-hover:text-teal-600"
            }`}
          >
            {isCompleted ? <Check className="h-5 w-5 stroke-[3]" /> : icon}
          </div>
          <span
            className={`text-3xl font-black transition-colors ${
              isActive
                ? "text-teal-600/20"
                : isCompleted
                ? "text-emerald-600/20"
                : "text-slate-100 group-hover:text-teal-600/10"
            }`}
          >
            {step}
          </span>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            {title}
            {isCompleted && (
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Xong
              </span>
            )}
            {isActive && (
              <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Đang ở đây
              </span>
            )}
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
        </div>
      </div>

      {/* Interactive Micro-action indicator */}
      <div className="mt-6 pt-4 border-t border-slate-50 flex items-center text-xs font-semibold text-teal-600 transition-transform group-hover:translate-x-1">
        <span>{isCompleted ? "Xem lại bước này" : "Bắt đầu bước này"}</span>
        <span className="ml-1">➔</span>
      </div>
    </div>
  );
}
