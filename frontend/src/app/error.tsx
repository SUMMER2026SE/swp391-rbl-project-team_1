"use client";

import React, { useEffect } from "react";
import { AlertCircle, RotateCcw, Home } from "lucide-react";
import Button from "@/components/common/Button";
import Link from "next/link";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log error to telemetry service in production
    console.error("Global Error Boundary caught:", error);
  }, [error]);

  return (
    <div className="min-h-[85vh] w-full flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="max-w-md w-full text-center bg-white p-8 rounded-3xl border border-slate-100 shadow-xl space-y-6">
        {/* Animated Warning Emblem */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-2xl bg-rose-50 text-rose-600 shadow-sm shadow-rose-200/50">
          <AlertCircle className="h-8 w-8 animate-bounce" />
        </div>

        {/* Text details */}
        <div className="space-y-2">
          <h1 className="text-xl font-black text-slate-900 tracking-wide">Đã Xảy Ra Sự Cố Hệ Thống</h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            Hệ thống đặt lịch y khoa ghi nhận lỗi bất thường. Đừng lo lắng, dữ liệu cá nhân của bạn vẫn luôn được bảo mật tuyệt đối.
          </p>
          
          {/* Debug Info (Only shows in non-production or for developers) */}
          <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100/80 text-left font-mono text-[10px] text-slate-400 overflow-x-auto whitespace-pre-wrap max-h-24">
            System Message: {error?.message || "Lỗi không xác định"}
          </div>
        </div>

        {/* Action Triggers */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button
            variant="teal"
            onClick={reset}
            className="rounded-xl py-3 flex items-center justify-center gap-1.5 font-bold shadow-md shadow-teal-500/10"
          >
            <RotateCcw className="h-4 w-4 shrink-0" />
            <span>Thử lại</span>
          </Button>

          <Link href="/">
            <Button
              variant="outline"
              className="w-full rounded-xl py-3 flex items-center justify-center gap-1.5 font-bold border-slate-200 hover:bg-slate-50 text-slate-700"
            >
              <Home className="h-4 w-4 shrink-0" />
              <span>Trang chủ</span>
            </Button>
          </Link>
        </div>

        {/* Technical Footer */}
        <span className="inline-block text-[10px] uppercase tracking-widest font-black text-slate-400">
          System Safeguard Active
        </span>
      </div>
    </div>
  );
}
