"use client";

import { useRef } from "react";
import { Camera, Mail, Calendar, Target } from "lucide-react";
import type { UserProfile, StudentStats } from "@/types/student";
import {
  formatFocusTime,
  formatDate,
  getRiskLevel,
} from "@/hooks/useProfile";

interface ProfileHeaderProps {
  profile: UserProfile;
  stats: StudentStats;
  avatarPreview: string | null;
  isUploadingAvatar: boolean;
  onAvatarChange: (file: File) => void;
}

export default function ProfileHeader({
  profile,
  stats,
  avatarPreview,
  isUploadingAvatar,
  onAvatarChange,
}: ProfileHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayAvatar = avatarPreview || profile.avatar;
  const initials = (profile.fullName || profile.email)
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const roleStyle =
    profile.role === "STUDENT"
      ? "bg-emerald-500/20 text-emerald-400"
      : profile.role === "MENTOR"
      ? "bg-blue-500/20 text-blue-400"
      : "bg-red-500/20 text-red-400";

  const roleLabel =
    profile.role === "STUDENT" ? "STUDENT" : profile.role === "MENTOR" ? "MENTOR" : "ADMIN";

  const risk = getRiskLevel(stats.currentRiskScore);

  const quickStats = [
    {
      icon: "🕐",
      value: formatFocusTime(stats.totalFocusTime),
      label: "Tổng thời gian focus",
      sub: null,
    },
    {
      icon: "✅",
      value: String(stats.totalTasksDone),
      label: "Tasks hoàn thành",
      sub: null,
    },
    {
      icon: "🔥",
      value: `${stats.currentStreak} ngày`,
      label: "Chuỗi ngày học",
      sub: `Dài nhất: ${stats.longestStreak} ngày`,
    },
    {
      icon: "⚡",
      value: String(stats.currentRiskScore),
      label: "Nguy cơ học tập",
      sub: risk.label,
      valueClass: risk.color,
    },
  ];

  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 lg:p-8 mb-6">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left: Avatar + Info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 flex-1">
          {/* Avatar */}
          <div className="relative group flex-shrink-0">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-emerald-500/30 relative">
              {displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt={profile.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-emerald-500/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-emerald-400">
                    {initials}
                  </span>
                </div>
              )}

              {/* Upload overlay */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer"
                aria-label="Thay đổi ảnh đại diện"
              >
                {isUploadingAvatar ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-6 h-6 text-white" />
                )}
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onAvatarChange(file);
                e.target.value = "";
              }}
            />
          </div>

          {/* Info */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{profile.fullName}</h1>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${roleStyle}`}>
                {roleLabel}
              </span>
              {profile.isActive && (
                <span className="flex items-center gap-1 text-xs text-emerald-400">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  Hoạt động
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Mail className="w-4 h-4 flex-shrink-0" />
              <span>{profile.email}</span>
            </div>

            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span>Tham gia từ: {formatDate(profile.createdAt)}</span>
            </div>

            {stats.learningGoal && (
              <div className="flex items-center gap-2 text-slate-300 text-sm">
                <Target className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="italic">Mục tiêu: {stats.learningGoal}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Quick Stats 2x2 */}
        <div className="grid grid-cols-2 gap-3 lg:w-80 flex-shrink-0">
          {quickStats.map((s, i) => (
            <div
              key={i}
              className="bg-slate-900/60 rounded-xl border border-slate-700 p-4 flex flex-col gap-1"
            >
              <div className="text-xl mb-1">{s.icon}</div>
              <p className={`text-xl font-bold leading-tight ${s.valueClass ?? "text-white"}`}>
                {s.value}
              </p>
              <p className="text-xs text-slate-500 leading-tight">{s.label}</p>
              {s.sub && (
                <p className={`text-xs leading-tight ${s.valueClass ? s.valueClass : "text-slate-500"}`}>
                  {s.sub}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
