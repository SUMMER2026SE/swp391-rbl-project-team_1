'use client';

import React, { useState } from 'react';
import { AlertTriangle, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface RedFlagAlertProps {
  riskScore: number;
}

export function RedFlagAlert({ riskScore }: RedFlagAlertProps) {
  const [visible, setVisible] = useState<boolean>(true);

  if (!visible || riskScore <= 70) return null;

  return (
    <div className="bg-rose-950/20 border border-rose-900/60 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 z-10 animate-pulse-slow">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-900/50 mt-0.5 sm:mt-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-slate-100 font-bold text-sm">Cảnh báo: Nguy cơ bỏ cuộc / chệch lộ trình!</h4>
          <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">
            Chỉ số rủi ro trì trệ học tập của bạn đang ở mức báo động (<span className="text-rose-400 font-extrabold">{riskScore}%</span>). 
            Vui lòng củng cố các kỹ năng yếu trong lộ trình hoặc chủ động thảo luận cùng Mentor.
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
        <Link
          href="/student/roadmap"
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all duration-300 shadow-md shadow-rose-500/20 active:scale-95"
        >
          <span>Xem lộ trình khắc phục</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <button
          onClick={() => setVisible(false)}
          className="p-2 border border-rose-900/40 text-rose-400 hover:bg-rose-950/40 rounded-xl transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default RedFlagAlert;
