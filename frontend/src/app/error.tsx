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
  <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
    <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl text-center">

      {/* Animated Warning Emblem */}
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
        <AlertCircle className="h-10 w-10 text-red-500" />
      </div>

      {/* Text details */}
      <div className="space-y-2">
        <h1 className="text-xl font-black text-slate-900 tracking-wide">
          Đã Xảy Ra Sự Cố Hệ Thống
        </h1>

        <p className="text-sm text-slate-500 leading-relaxed">
          Hệ thống đặt lịch y khoa ghi nhận lỗi bất thường. Đừng lo lắng, dữ liệu cá nhân của bạn vẫn luôn được bảo mật tuyệt đối.
        </p>
      </div>

      {/* Debug Info */}
      <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100/80 text-left font-mono text-[10px] text-slate-400 overflow-x-auto whitespace-pre-wrap max-h-24">
        <p>System Message: {error?.message || "Lỗi không xác định"}</p>

        {error.digest && (
          <p className="mt-2">
            Error ID:{" "}
            <span className="font-semibold">{error.digest}</span>
          </p>
        )}
      </div>

      {/* Action Triggers */}
      <div className="grid grid-cols-2 gap-3 pt-6">
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
      <p className="mt-5 text-xs text-slate-500">
        Cảm ơn bạn đã kiên nhẫn. Chúng tôi đang nỗ lực khắc phục sự cố để mang đến trải nghiệm tốt hơn.
      </p>

    </div>
  </div>
);}