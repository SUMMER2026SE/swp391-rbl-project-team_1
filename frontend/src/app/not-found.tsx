import React from "react";
import { Compass, Home, Search } from "lucide-react";
import Button from "@/components/common/Button";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[85vh] w-full flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="max-w-md w-full text-center bg-white p-8 rounded-3xl border border-slate-100 shadow-xl space-y-6">
        {/* Animated Compass Emblem */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-2xl bg-teal-50 text-teal-600 shadow-sm shadow-teal-200/50">
          <Compass className="h-8 w-8 animate-spin" style={{ animationDuration: "10s" }} />
        </div>

        {/* Text details */}
        <div className="space-y-2">
          <h1 className="text-5xl font-black text-slate-900 tracking-tight">404</h1>
          <h2 className="text-xl font-bold text-slate-800">Không Tìm Thấy Trang</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Đường dẫn bạn yêu cầu không tồn tại hoặc đã được thay đổi địa chỉ. Hãy sử dụng các liên kết nhanh dưới đây để tìm đúng điểm khám chữa bệnh.
          </p>
        </div>

        {/* Action Triggers */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Link href="/doctors">
            <Button
              variant="teal"
              className="w-full rounded-xl py-3 flex items-center justify-center gap-1.5 font-bold shadow-md shadow-teal-500/10"
            >
              <Search className="h-4 w-4 shrink-0" />
              <span>Tìm bác sĩ</span>
            </Button>
          </Link>

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

        {/* Security brand */}
        <span className="inline-block text-[10px] uppercase tracking-widest font-black text-slate-400">
          MedBooking Navigation
        </span>
      </div>
    </div>
  );
}
