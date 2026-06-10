"use client";

import Link from "next/link";
import type { SkillMastery } from "@/types/student";
import { getMasteryLabel, getMasteryColor, formatRelativeTime } from "@/hooks/useProfile";

interface SkillCardProps {
  skill: SkillMastery;
}

const TRACK_STYLE: Record<string, string> = {
  "Web Dev": "bg-blue-500/20 text-blue-400",
  "Data Science": "bg-purple-500/20 text-purple-400",
  Mobile: "bg-emerald-500/20 text-emerald-400",
};

const TRACK_ICON: Record<string, string> = {
  "Web Dev": "🌐",
  "Data Science": "📊",
  Mobile: "📱",
};

// Mini sparkline — 7 mock data points around masteryLevel
function MiniSparkline({ masteryLevel }: { masteryLevel: number }) {
  const base = masteryLevel * 100;
  const pts = [
    base - 8,
    base - 5,
    base - 3,
    base - 6,
    base - 2,
    base - 1,
    base,
  ].map((v) => Math.max(0, Math.min(100, v)));

  const W = 80;
  const H = 30;
  const step = W / (pts.length - 1);

  const pathD = pts
    .map((v, i) => {
      const x = i * step;
      const y = H - (v / 100) * H;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      <path d={pathD} fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" />
      <circle
        cx={(pts.length - 1) * step}
        cy={H - (pts[pts.length - 1] / 100) * H}
        r="2.5"
        fill="#10B981"
      />
    </svg>
  );
}

export default function SkillCard({ skill }: SkillCardProps) {
  const pct = Math.round(skill.masteryLevel * 100);
  const barColor = getMasteryColor(skill.masteryLevel);
  const label = getMasteryLabel(skill.masteryLevel);
  const isMastered = skill.masteryLevel >= 0.9;
  const trackStyle = TRACK_STYLE[skill.trackName] ?? "bg-slate-500/20 text-slate-400";
  const trackIcon = TRACK_ICON[skill.trackName] ?? "🔧";

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 hover:border-emerald-500/40 p-5 flex flex-col gap-3 transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/5">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{trackIcon}</span>
          <h3 className="font-bold text-white text-base leading-tight">
            {skill.skillName}
            {isMastered && <span className="ml-1.5">⭐</span>}
          </h3>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${trackStyle}`}>
          {skill.trackName}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">{label}</span>
          <span className="text-xl font-bold text-white">{pct}%</span>
        </div>
        <div className="w-full h-2.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-xs text-slate-500">
            Cập nhật: {formatRelativeTime(skill.updatedAt)}
          </p>
          <MiniSparkline masteryLevel={skill.masteryLevel} />
        </div>
        <Link
          href={`/student/quiz/${skill.skillSlug}`}
          className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
        >
          Làm quiz →
        </Link>
      </div>
    </div>
  );
}
