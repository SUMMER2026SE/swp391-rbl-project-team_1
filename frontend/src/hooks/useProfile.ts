"use client";

import { useState, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import type {
  UserProfile,
  StudentStats,
  SkillMastery,
  RecentActivity,
  Badge,
  PasswordStrength,
} from "@/types/student";
import { studentService } from "@/services/student.service";

// ─── Format Helpers ───────────────────────────────────────────────────────────

export function formatFocusTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 60) return `${mins} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days < 7) return `${days} ngày trước`;

  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${d.getFullYear()}`;
}

export function getMasteryLabel(level: number): string {
  if (level < 0.4) return "Cần cải thiện";
  if (level < 0.7) return "Đang học";
  if (level < 0.9) return "Khá tốt";
  return "Thành thạo";
}

export function getMasteryColor(level: number): string {
  if (level < 0.4) return "bg-red-500";
  if (level < 0.7) return "bg-yellow-500";
  if (level < 0.9) return "bg-emerald-500";
  return "bg-emerald-400";
}

export function getRiskLevel(score: number): {
  label: string;
  color: string;
  bgColor: string;
} {
  if (score <= 40)
    return {
      label: "An toàn",
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/20",
    };
  if (score <= 70)
    return {
      label: "Cần chú ý",
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/20",
    };
  return {
    label: "Nguy hiểm",
    color: "text-red-400",
    bgColor: "bg-red-500/20",
  };
}

export function getPasswordStrength(password: string): PasswordStrength {
  if (password.length === 0) return { level: 0, label: "", color: "bg-slate-600" };
  if (password.length < 8) return { level: 1, label: "Quá ngắn", color: "bg-red-500" };

  let level = 1;
  if (/[0-9]/.test(password)) level++;
  if (/[^a-zA-Z0-9]/.test(password)) level++;
  if (password.length >= 12) level++;

  const map: Record<number, { label: string; color: string }> = {
    1: { label: "Yếu", color: "bg-orange-500" },
    2: { label: "Trung bình", color: "bg-yellow-500" },
    3: { label: "Mạnh", color: "bg-emerald-500" },
    4: { label: "Rất mạnh", color: "bg-emerald-400" },
  };

  return { level, ...map[Math.min(level, 4)] };
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// ─── useProfile Hook ──────────────────────────────────────────────────────────

interface UseProfileState {
  profile: UserProfile | null;
  stats: StudentStats | null;
  masteries: SkillMastery[];
  badges: Badge[];
  activities: RecentActivity[];
  isLoading: boolean;
  error: string | null;
}

interface UseProfileReturn extends UseProfileState {
  avatarPreview: string | null;
  isUploadingAvatar: boolean;
  updateProfile: (payload: {
    fullName: string;
    learningGoal?: string;
    goalDeadlineDays?: number;
  }) => Promise<void>;
  changePassword: (payload: {
    currentPassword: string;
    newPassword: string;
  }) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  downloadReport: () => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useProfile(
  initialProfile: UserProfile | null,
  initialStats: StudentStats | null,
  initialMasteries: SkillMastery[],
  initialBadges: Badge[],
  initialActivities: RecentActivity[]
): UseProfileReturn {
  const [state, setState] = useState<UseProfileState>({
    profile: initialProfile,
    stats: initialStats,
    masteries: initialMasteries,
    badges: initialBadges,
    activities: initialActivities,
    isLoading: false,
    error: null,
  });

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const activityPage = useRef(1);

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const [profile, stats, masteries, badges, activities] = await Promise.all([
        studentService.getProfile(),
        studentService.getStats(),
        studentService.getMasteries(),
        studentService.getBadges(),
        studentService.getActivities(1),
      ]);
      activityPage.current = 1;
      setState({ profile, stats, masteries, badges, activities, isLoading: false, error: null });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Lỗi tải dữ liệu";
      setState((s) => ({ ...s, isLoading: false, error: msg }));
    }
  }, []);

  const updateProfile = useCallback(
    async (payload: {
      fullName: string;
      learningGoal?: string;
      goalDeadlineDays?: number;
    }) => {
      const updated = await studentService.updateProfile(payload);
      setState((s) => ({ ...s, profile: updated }));
      toast.success("✅ Cập nhật thành công");
    },
    []
  );

  const changePassword = useCallback(
    async (payload: { currentPassword: string; newPassword: string }) => {
      await studentService.changePassword(payload);
      toast.success("✅ Đổi mật khẩu thành công");
    },
    []
  );

  const uploadAvatar = useCallback(async (file: File) => {
    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

    if (!ALLOWED.includes(file.type)) {
      toast.error("❌ Chỉ chấp nhận file JPG, PNG hoặc WebP");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("❌ File quá lớn (tối đa 2MB)");
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setIsUploadingAvatar(true);
    try {
      const { avatarUrl } = await studentService.uploadAvatar(file);
      setState((s) =>
        s.profile ? { ...s, profile: { ...s.profile, avatar: avatarUrl } } : s
      );
      toast.success("✅ Ảnh đại diện đã cập nhật");
    } catch {
      toast.error("❌ Không thể tải ảnh lên. Thử lại sau.");
      setAvatarPreview(null);
    } finally {
      setIsUploadingAvatar(false);
    }
  }, []);

  const downloadReport = useCallback(async () => {
    const toastId = toast.loading("Đang tạo báo cáo...");
    try {
      const blob = await studentService.downloadReport();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "bao-cao-hoc-tap-edupath.pdf";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("✅ Báo cáo đã được tải xuống", { id: toastId });
    } catch {
      toast.error("❌ Không thể tạo báo cáo", { id: toastId });
    }
  }, []);

  const loadMore = useCallback(async () => {
    activityPage.current += 1;
    try {
      const more = await studentService.getActivities(activityPage.current);
      setState((s) => ({ ...s, activities: [...s.activities, ...more] }));
    } catch {
      toast.error("Không thể tải thêm hoạt động");
    }
  }, []);

  return {
    ...state,
    avatarPreview,
    isUploadingAvatar,
    updateProfile,
    changePassword,
    uploadAvatar,
    downloadReport,
    loadMore,
    refresh,
  };
}
