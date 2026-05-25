import React from "react";
import { Activity } from "lucide-react";

export default function GlobalLoading() {
  return (
    <div className="min-h-[80vh] w-full flex flex-col items-center justify-center bg-slate-50/50 backdrop-blur-sm px-4">
      <div className="relative flex flex-col items-center space-y-6 max-w-sm text-center">
        {/* Animated outer ring */}
        <div className="relative flex items-center justify-center">
          <div className="absolute h-16 w-16 rounded-full border-4 border-teal-500/10" />
          <div className="absolute h-16 w-16 rounded-full border-4 border-t-teal-500 border-r-teal-500 animate-spin" />
          
          {/* Inner heartbeat icon */}
          <div className="h-10 w-10 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-600 animate-pulse">
            <Activity className="h-5 w-5" />
          </div>
        </div>

        {/* Loading messages */}
        <div className="space-y-2 animate-pulse">
          <h2 className="text-lg font-black text-slate-800 tracking-wide uppercase">MedBooking Portal</h2>
          <p className="text-xs font-semibold text-slate-500">
            Đang tải dữ liệu y khoa bảo mật...
          </p>
        </div>

        {/* Subtitle brand */}
        <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">
          Secure System
        </span>
      </div>
    </div>
  );
}
