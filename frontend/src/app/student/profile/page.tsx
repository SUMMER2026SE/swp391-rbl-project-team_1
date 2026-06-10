"use client";

import { useState, useEffect } from "react";
import {
  Pencil,
  ChevronDown,
  Eye,
  EyeOff,
  Download,
  Target,
  Loader2,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import type { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import ProfileHeader from "@/components/student/ProfileHeader";
import SkillCard from "@/components/student/SkillCard";
import BadgeCard from "@/components/student/BadgeCard";
import ActivityTimeline from "@/components/student/ActivityTimeline";

import {
  useProfile,
  getPasswordStrength,
  getMasteryLabel,
} from "@/hooks/useProfile";

import {
  studentService,
  MOCK_PROFILE,
  MOCK_STATS,
  MOCK_MASTERIES,
  MOCK_BADGES,
  MOCK_ACTIVITIES,
} from "@/services/student.service";

import type { ActiveTab } from "@/types/student";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-slate-700 rounded-lg ${className ?? ""}`} />
  );
}

// ─── Tab Nav ──────────────────────────────────────────────────────────────────

const TABS: Array<{ key: ActiveTab; label: string }> = [
  { key: "overview", label: "Tổng Quan" },
  { key: "skills", label: "Kỹ Năng" },
  { key: "badges", label: "Huy Hiệu" },
  { key: "activity", label: "Hoạt Động" },
];

// ─── Page Component ───────────────────────────────────────────────────────────

export default function StudentProfilePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");

  const {
    profile,
    stats,
    masteries,
    badges,
    activities,
    isLoading,
    error,
    avatarPreview,
    isUploadingAvatar,
    updateProfile,
    changePassword,
    uploadAvatar,
    downloadReport,
    loadMore,
    refresh,
  } = useProfile(
    MOCK_PROFILE,
    MOCK_STATS,
    MOCK_MASTERIES,
    MOCK_BADGES,
    MOCK_ACTIVITIES
  );

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Edit profile state ──
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editGoal, setEditGoal] = useState("");
  const [editDeadline, setEditDeadline] = useState<string>("3");
  const [isSaving, setIsSaving] = useState(false);

  const startEdit = () => {
    setEditName(profile?.fullName ?? "");
    setEditGoal(stats?.learningGoal ?? "");
    setEditDeadline(String(stats?.goalDeadlineDays ?? "3"));
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      toast.error("Họ và tên không được để trống");
      return;
    }
    setIsSaving(true);
    try {
      await updateProfile({
        fullName: editName.trim(),
        learningGoal: editGoal.trim() || undefined,
        goalDeadlineDays: editDeadline ? Number(editDeadline) : undefined,
      });
      setIsEditing(false);
    } catch {
      toast.error("❌ Cập nhật thất bại. Thử lại sau.");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Password state ──
  const [pwOpen, setPwOpen] = useState(false);
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSavingPw, setIsSavingPw] = useState(false);

  const strength = getPasswordStrength(pwNew);

  const handleChangePassword = async () => {
    if (!pwCurrent) return toast.error("Nhập mật khẩu hiện tại");
    if (pwNew.length < 8) return toast.error("Mật khẩu mới phải ≥ 8 ký tự");
    if (pwNew !== pwConfirm) return toast.error("Mật khẩu xác nhận không khớp");
    setIsSavingPw(true);
    try {
      await changePassword({ currentPassword: pwCurrent, newPassword: pwNew });
      setPwCurrent("");
      setPwNew("");
      setPwConfirm("");
      setPwOpen(false);
    } catch {
      toast.error("❌ Đổi mật khẩu thất bại. Kiểm tra mật khẩu hiện tại.");
    } finally {
      setIsSavingPw(false);
    }
  };

  // ── Loading skeleton ──
  if (isLoading && !profile) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-10 w-80" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (error && !profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Không thể tải dữ liệu</h2>
          <p className="text-slate-400 text-sm">{error}</p>
          <button
            onClick={refresh}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!profile || !stats) return null;

  // ─── Skill Radar data ─────────────────────────────────────────────────
  const radarData = masteries.map((m) => ({
    skill: m.skillName,
    value: Math.round(m.masteryLevel * 100),
  }));

  // ─── Activity chart data (7 days) ────────────────────────────────────
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const label = `${d.getDate()}/${d.getMonth() + 1}`;
    const dayActivities = activities.filter((a) => {
      const ad = new Date(a.createdAt);
      return ad.toDateString() === d.toDateString();
    });
    return {
      date: label,
      total: dayActivities.length,
      quiz: dayActivities.filter((a) => a.type === "QUIZ").length,
      task: dayActivities.filter((a) => a.type === "TASK").length,
      pomodoro: dayActivities.filter((a) => a.type === "POMODORO").length,
    };
  });

  // ─── Skill summary ───────────────────────────────────────────────────
  const masteredCount = masteries.filter((m) => m.masteryLevel >= 0.8).length;
  const needsWork = masteries.filter((m) => m.masteryLevel < 0.4).length;
  const avgMastery =
    masteries.length > 0
      ? Math.round(
          (masteries.reduce((s, m) => s + m.masteryLevel, 0) / masteries.length) * 100
        )
      : 0;

  // ─── Badge summary ───────────────────────────────────────────────────
  const earnedBadges = badges.filter((b) => b.earnedAt !== null);
  const nextBadge = badges.find((b) => b.earnedAt === null);

  // ─── Goal progress ───────────────────────────────────────────────────
  const goalPct = Math.min(100, Math.round((stats.totalTasksDone / 40) * 100));
  const onTrack = stats.goalDeadlineDays !== null && stats.goalDeadlineDays > 10;

  return (
    <div className="max-w-6xl mx-auto space-y-0">
      {/* Page title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Hồ Sơ Học Viên</h1>
        <p className="text-slate-400 text-sm mt-1">
          Quản lý thông tin và theo dõi tiến trình học tập của bạn
        </p>
      </div>

      {/* Header Card */}
      <ProfileHeader
        profile={profile}
        stats={stats}
        avatarPreview={avatarPreview}
        isUploadingAvatar={isUploadingAvatar}
        onAvatarChange={uploadAvatar}
      />

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-slate-700 mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-3 text-sm font-semibold whitespace-nowrap transition-all duration-150 border-b-2 -mb-px ${
              activeTab === tab.key
                ? "border-emerald-500 text-white"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── TAB: TỔNG QUAN ──────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Section A — Personal Info */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Thông tin cá nhân</h2>
              {!isEditing && (
                <button
                  onClick={startEdit}
                  className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Chỉnh sửa
                </button>
              )}
            </div>

            {isEditing ? (
              /* Edit form */
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                    Họ và tên <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-white text-sm outline-none transition-colors"
                    placeholder="Nhập họ và tên"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-500 text-sm cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-600 mt-1">Email không thể thay đổi</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                    Mục tiêu học tập
                  </label>
                  <textarea
                    value={editGoal}
                    onChange={(e) => setEditGoal(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-900 border border-slate-600 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-white text-sm outline-none transition-colors resize-none"
                    placeholder="Ví dụ: Thành thạo React trong 3 tháng"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                    Thời gian hoàn thành
                  </label>
                  <select
                    value={editDeadline}
                    onChange={(e) => setEditDeadline(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-white text-sm outline-none transition-colors"
                  >
                    <option value="30">1 tháng (30 ngày)</option>
                    <option value="90">3 tháng (90 ngày)</option>
                    <option value="180">6 tháng (180 ngày)</option>
                    <option value={editDeadline}>Tự chọn ({editDeadline} ngày)</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white rounded-xl font-medium text-sm transition-colors"
                  >
                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                    Lưu thay đổi
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl font-medium text-sm transition-colors"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              /* View mode */
              <dl className="space-y-3">
                {[
                  { label: "Họ và tên", value: profile.fullName },
                  { label: "Email", value: profile.email },
                  {
                    label: "Mục tiêu",
                    value: stats.learningGoal ?? "Chưa đặt mục tiêu",
                  },
                  {
                    label: "Thời hạn",
                    value: stats.goalDeadlineDays
                      ? `Còn ${stats.goalDeadlineDays} ngày`
                      : "Không đặt",
                  },
                  {
                    label: "Ngày tham gia",
                    value: new Date(profile.createdAt).toLocaleDateString(
                      "vi-VN",
                      { day: "2-digit", month: "long", year: "numeric" }
                    ),
                  },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4"
                  >
                    <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wider w-32 flex-shrink-0">
                      {label}
                    </dt>
                    <dd className="text-sm text-slate-200">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          {/* Section B — Password */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
            <button
              onClick={() => setPwOpen(!pwOpen)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-700/50 transition-colors"
            >
              <h2 className="text-lg font-bold text-white">Bảo mật tài khoản</h2>
              <ChevronDown
                className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                  pwOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {pwOpen && (
              <div className="px-6 pb-6 space-y-4 border-t border-slate-700 pt-4">
                {/* Current password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                    Mật khẩu hiện tại
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrent ? "text" : "password"}
                      value={pwCurrent}
                      onChange={(e) => setPwCurrent(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-600 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-white text-sm outline-none transition-colors pr-10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                    Mật khẩu mới
                  </label>
                  <div className="relative">
                    <input
                      type={showNew ? "text" : "password"}
                      value={pwNew}
                      onChange={(e) => setPwNew(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-600 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-white text-sm outline-none transition-colors pr-10"
                      placeholder="Tối thiểu 8 ký tự"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Strength bar */}
                  {pwNew.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                              i <= strength.level ? strength.color : "bg-slate-700"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-slate-400">{strength.label}</p>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                    Xác nhận mật khẩu mới
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={pwConfirm}
                      onChange={(e) => setPwConfirm(e.target.value)}
                      className={`w-full bg-slate-900 border rounded-xl px-4 py-2.5 text-white text-sm outline-none transition-colors pr-10 ${
                        pwConfirm && pwConfirm !== pwNew
                          ? "border-red-500"
                          : "border-slate-600 focus:border-emerald-500"
                      }`}
                      placeholder="Nhập lại mật khẩu mới"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {pwConfirm && pwConfirm !== pwNew && (
                    <p className="text-xs text-red-400 mt-1">Mật khẩu không khớp</p>
                  )}
                </div>

                <button
                  onClick={handleChangePassword}
                  disabled={isSavingPw}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white rounded-xl font-medium text-sm transition-colors"
                >
                  {isSavingPw && <Loader2 className="w-4 h-4 animate-spin" />}
                  Đổi mật khẩu
                </button>
              </div>
            )}
          </div>

          {/* Section C — Goal Progress */}
          <div className="bg-gradient-to-br from-emerald-500/10 to-slate-800 rounded-2xl border border-emerald-500/20 p-6">
            {stats.learningGoal ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎯</span>
                  <div>
                    <h2 className="text-lg font-bold text-white">{stats.learningGoal}</h2>
                    {stats.goalDeadlineDays !== null && (
                      <p className="text-sm text-slate-400">
                        Còn {stats.goalDeadlineDays} ngày để hoàn thành
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Tiến độ tổng thể</span>
                    <span className="font-bold text-white">{goalPct}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700"
                      style={{ width: `${goalPct}%` }}
                    />
                  </div>
                </div>

                <p
                  className={`text-sm font-medium ${
                    onTrack ? "text-emerald-400" : "text-yellow-400"
                  }`}
                >
                  {onTrack
                    ? "✅ Bạn đang đúng tiến độ!"
                    : "⚠️ Bạn đang chậm tiến độ. Hãy cố gắng hơn!"}
                </p>
              </div>
            ) : (
              <div className="text-center py-4 space-y-3">
                <Target className="w-10 h-10 text-slate-500 mx-auto" />
                <p className="text-slate-400">Bạn chưa đặt mục tiêu học tập</p>
                <button
                  onClick={startEdit}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  Đặt mục tiêu ngay
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB: KỸ NĂNG ────────────────────────────────────────────────── */}
      {activeTab === "skills" && (
        <div className="space-y-6">
          {/* Skill summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Đang học", value: masteries.length, color: "text-blue-400" },
              { label: "Đã thành thạo", value: masteredCount, color: "text-emerald-400" },
              { label: "Cần cải thiện", value: needsWork, color: "text-red-400" },
              { label: "Mastery TB", value: `${avgMastery}%`, color: "text-yellow-400" },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-slate-800 rounded-xl border border-slate-700 p-4 text-center"
              >
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Radar Chart */}
          {masteries.length > 0 && (
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
              <h2 className="text-lg font-bold text-white mb-4">
                Bản đồ kỹ năng tổng quan
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis
                    dataKey="skill"
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                  />
                  <Radar
                    name="Mastery"
                    dataKey="value"
                    stroke="#10B981"
                    fill="rgba(16,185,129,0.2)"
                    strokeWidth={2}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: 8,
                      color: "#f1f5f9",
                      fontSize: 12,
                    }}
                    formatter={(value: ValueType | undefined) => [`${value ?? 0}%`, "Mastery"]}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Skill Cards */}
          {masteries.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              Chưa có dữ liệu kỹ năng. Hãy bắt đầu làm quiz!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {masteries.map((m) => (
                <SkillCard key={m.skillSlug} skill={m} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB: HUY HIỆU ───────────────────────────────────────────────── */}
      {activeTab === "badges" && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div>
                <p className="text-3xl font-bold text-white">
                  {earnedBadges.length}
                  <span className="text-slate-500 text-xl font-normal">
                    {" "}
                    / {badges.length}
                  </span>
                </p>
                <p className="text-sm text-slate-400">huy hiệu đã đạt</p>
              </div>
              {nextBadge && (
                <div className="sm:ml-auto flex items-center gap-2 bg-slate-700 rounded-xl px-4 py-2">
                  <span className="text-xl">{nextBadge.icon}</span>
                  <div>
                    <p className="text-xs text-slate-400">Gần đạt nhất</p>
                    <p className="text-sm font-semibold text-white">{nextBadge.name}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-500 to-emerald-400 rounded-full transition-all duration-700"
                style={{ width: `${(earnedBadges.length / badges.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Badge Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {badges.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} />
            ))}
          </div>

          {/* Sắp đạt được (Badge mới nhất) */}
          <div className="space-y-4 pt-4 border-t border-slate-700">
            <h3 className="text-base font-bold text-white">Sắp đạt được</h3>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
              {badges
                .filter((b) => b.earnedAt === null)
                .slice(0, 3)
                .map((badge) => (
                  <div
                    key={`next-${badge.id}`}
                    className="min-w-[250px] bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center gap-4 relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                    <div className="text-4xl grayscale opacity-50">{badge.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-200 truncate">{badge.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{badge.condition}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB: HOẠT ĐỘNG ──────────────────────────────────────────────── */}
      {activeTab === "activity" && (
        <div className="space-y-6">
          {/* Activity chart */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
            <h2 className="text-lg font-bold text-white mb-4">
              Biểu đồ hoạt động 7 ngày
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: 8,
                    color: "#f1f5f9",
                    fontSize: 12,
                  }}
                  formatter={(value: ValueType | undefined, name: NameType | undefined) => {
                    const labels: Record<string, string> = {
                      total: "Tổng",
                      quiz: "Quiz",
                      task: "Task",
                      pomodoro: "Pomodoro",
                    };
                    const key = String(name ?? "");
                    return [value ?? 0, labels[key] ?? key];
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#10B981"
                  strokeWidth={2}
                  fill="url(#actGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Timeline */}
          <ActivityTimeline activities={activities} onLoadMore={loadMore} />

          {/* Export report */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                📄 Báo cáo học tập
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                Xuất toàn bộ tiến độ học tập ra file PDF để lưu trữ hoặc chia sẻ
              </p>
            </div>
            <button
              onClick={downloadReport}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium text-sm transition-colors flex-shrink-0"
            >
              <Download className="w-4 h-4" />
              Xuất PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
