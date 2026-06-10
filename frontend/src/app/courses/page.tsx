import Link from "next/link";
import { Route } from "lucide-react";

export default function CoursesPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="text-center max-w-md mx-auto px-6">
        
        {/* Icon */}
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Route className="w-10 h-10 text-emerald-400" />
        </div>
        
        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-3">
          Lộ Trình Học Tập Của Bạn
        </h1>
        
        {/* Description */}
        <p className="text-slate-400 mb-8 leading-relaxed">
          AI tự động sắp xếp các kỹ năng theo đúng thứ tự ưu tiên dựa trên năng lực hiện tại của bạn
        </p>
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-full text-sm mb-8">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"/>
          Đang phát triển — Sắp ra mắt
        </div>
        
        {/* Button */}
        <div>
          <Link href="/register">
            <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              Khám phá ngay
            </button>
          </Link>
        </div>
        
      </div>
    </div>
  );
}
