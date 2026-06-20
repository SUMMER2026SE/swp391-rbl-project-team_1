'use client';

import React from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';

interface RiskGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function RiskGauge({ score, size = 'md', showLabel = true }: RiskGaugeProps) {
  // Bound score
  const s = Math.min(Math.max(score, 0), 100);

  // SVG dimensions based on size
  const dims = {
    sm: { width: 90, strokeWidth: 8, r: 35, fontSize: 'text-lg' },
    md: { width: 150, strokeWidth: 12, r: 60, fontSize: 'text-2xl' },
    lg: { width: 220, strokeWidth: 16, r: 90, fontSize: 'text-4xl' }
  };

  const current = dims[size];
  const center = current.width / 2;
  const circumference = 2 * Math.PI * current.r;
  const strokeDashoffset = circumference - (s / 100) * circumference;

  // Determine classification and colors
  let color = 'text-emerald-500 stroke-emerald-500';
  let gradientId = 'grad-safe';
  let label = 'An toàn';
  let Icon = ShieldCheck;

  if (s >= 40 && s <= 70) {
    color = 'text-amber-500 stroke-amber-500';
    gradientId = 'grad-warn';
    label = 'Chú ý';
    Icon = AlertTriangle;
  } else if (s > 70) {
    color = 'text-rose-500 stroke-rose-500';
    gradientId = 'grad-danger';
    label = 'Nguy hiểm';
    Icon = ShieldAlert;
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 select-none">
      <div className="relative" style={{ width: current.width, height: current.width }}>
        
        {/* SVG Circular Gauge */}
        <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${current.width} ${current.width}`}>
          <defs>
            <linearGradient id="grad-safe" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="grad-warn" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            <linearGradient id="grad-danger" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#e11d48" />
            </linearGradient>
          </defs>

          {/* Background Track */}
          <circle
            cx={center}
            cy={center}
            r={current.r}
            className="stroke-slate-800 fill-transparent"
            strokeWidth={current.strokeWidth}
          />

          {/* Progress Indicator ring */}
          <circle
            cx={center}
            cy={center}
            r={current.r}
            className="fill-transparent transition-all duration-1000 ease-out"
            stroke={`url(#${gradientId})`}
            strokeWidth={current.strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>

        {/* Centered Score */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-black tracking-tight text-slate-100 ${current.fontSize}`}>
            {s}%
          </span>
          {size !== 'sm' && (
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
              Rủi ro
            </span>
          )}
        </div>
      </div>

      {showLabel && size !== 'sm' && (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full">
          <Icon className={`w-4 h-4 ${color.split(' ')[0]}`} />
          <span className={`text-xs font-bold ${color.split(' ')[0]}`}>{label}</span>
        </div>
      )}
    </div>
  );
}

export default RiskGauge;
