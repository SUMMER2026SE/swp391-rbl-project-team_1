"use client";

import { Lock } from "lucide-react";
import type { Badge } from "@/types/student";

interface BadgeCardProps {
  badge: Badge;
}

export default function BadgeCard({ badge }: BadgeCardProps) {
  const earned = badge.earnedAt !== null;

  const earnedDate = earned
    ? new Date(badge.earnedAt!).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null;

  return (
    <div
      className={`relative rounded-xl border p-5 flex flex-col items-center text-center gap-3 transition-all duration-200 group cursor-default
        ${
          earned
            ? "bg-slate-700 border-emerald-500/30 hover:border-emerald-400/60 hover:shadow-lg hover:shadow-emerald-500/10 hover:scale-[1.02]"
            : "bg-slate-800 border-slate-600 hover:scale-[1.02]"
        }
      `}
    >
      {/* Lock for unearned */}
      {!earned && (
        <div className="absolute top-3 right-3">
          <Lock className="w-4 h-4 text-slate-600" />
        </div>
      )}

      {/* Earned glow ring */}
      {earned && (
        <div className="absolute inset-0 rounded-xl ring-1 ring-emerald-500/20 pointer-events-none" />
      )}

      {/* Icon */}
      <div
        className={`text-5xl leading-none transition-all duration-200 ${
          earned ? "" : "grayscale opacity-40"
        }`}
      >
        {badge.icon}
      </div>

      {/* Name */}
      <h3
        className={`font-bold text-sm leading-tight ${
          earned ? "text-white" : "text-slate-500"
        }`}
      >
        {badge.name}
      </h3>

      {/* Description */}
      <p className={`text-xs leading-relaxed ${earned ? "text-slate-400" : "text-slate-600"}`}>
        {badge.description}
      </p>

      {/* Status */}
      {earned ? (
        <p className="text-xs text-emerald-400 font-medium">Đạt ngày: {earnedDate}</p>
      ) : (
        <p className="text-xs text-slate-600 italic">{badge.condition}</p>
      )}
    </div>
  );
}
