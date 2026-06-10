import api from "./api";
import type {
  UserProfile,
  StudentStats,
  SkillMastery,
  RecentActivity,
  Badge,
} from "@/types/student";

// ─── Mock Data ────────────────────────────────────────────────────────────────

export const MOCK_PROFILE: UserProfile = {
  id: "u001",
  fullName: "Nguyễn Văn An",
  email: "student01@edupath.dev",
  avatar: null,
  role: "STUDENT",
  createdAt: "2025-01-15T00:00:00Z",
  isActive: true,
};

export const MOCK_STATS: StudentStats = {
  totalFocusTime: 1240,
  totalTasksDone: 28,
  totalQuizAttempts: 95,
  currentStreak: 12,
  longestStreak: 21,
  currentRiskScore: 42,
  learningVelocity: 0.034,
  learningGoal: "Thành thạo React trong 3 tháng",
  goalDeadlineDays: 45,
};

export const MOCK_MASTERIES: SkillMastery[] = [
  {
    skillName: "React",
    skillSlug: "react",
    trackName: "Web Dev",
    masteryLevel: 0.72,
    updatedAt: "2025-06-08T10:00:00Z",
  },
  {
    skillName: "TypeScript",
    skillSlug: "typescript",
    trackName: "Web Dev",
    masteryLevel: 0.58,
    updatedAt: "2025-06-07T09:00:00Z",
  },
  {
    skillName: "Node.js",
    skillSlug: "nodejs",
    trackName: "Web Dev",
    masteryLevel: 0.65,
    updatedAt: "2025-06-06T08:00:00Z",
  },
  {
    skillName: "CSS",
    skillSlug: "css",
    trackName: "Web Dev",
    masteryLevel: 0.8,
    updatedAt: "2025-06-05T07:00:00Z",
  },
  {
    skillName: "Python",
    skillSlug: "python",
    trackName: "Data Science",
    masteryLevel: 0.45,
    updatedAt: "2025-06-04T06:00:00Z",
  },
  {
    skillName: "Flutter",
    skillSlug: "flutter",
    trackName: "Mobile",
    masteryLevel: 0.3,
    updatedAt: "2025-06-03T05:00:00Z",
  },
];

export const MOCK_BADGES: Badge[] = [
  {
    id: "b1",
    name: "First Quiz",
    icon: "🎯",
    description: "Làm quiz lần đầu tiên",
    condition: "Hoàn thành 1 quiz",
    earnedAt: "2025-01-16T00:00:00Z",
  },
  {
    id: "b2",
    name: "Week Warrior",
    icon: "🔥",
    description: "Học liên tục 7 ngày",
    condition: "Streak đạt 7 ngày",
    earnedAt: "2025-01-22T00:00:00Z",
  },
  {
    id: "b3",
    name: "Focus Champion",
    icon: "🍅",
    description: "Hoàn thành 10 phiên Pomodoro",
    condition: "10 Pomodoro sessions",
    earnedAt: "2025-02-01T00:00:00Z",
  },
  {
    id: "b4",
    name: "Skill Mastered",
    icon: "⭐",
    description: "Thành thạo 1 kỹ năng",
    condition: "Mastery ≥ 80% cho 1 skill",
    earnedAt: "2025-02-10T00:00:00Z",
  },
  {
    id: "b5",
    name: "Month Master",
    icon: "🏆",
    description: "Streak 30 ngày liên tiếp",
    condition: "Streak đạt 30 ngày",
    earnedAt: null,
  },
  {
    id: "b6",
    name: "Speed Learner",
    icon: "🚀",
    description: "Cải thiện 20% mastery trong 1 tuần",
    condition: "Tăng mastery 20% trong 7 ngày",
    earnedAt: null,
  },
  {
    id: "b7",
    name: "Knowledge Seeker",
    icon: "📚",
    description: "Clone 3 lộ trình từ cộng đồng",
    condition: "Clone 3 roadmap",
    earnedAt: null,
  },
  {
    id: "b8",
    name: "Quiz Master",
    icon: "📝",
    description: "Làm 100 câu quiz",
    condition: "Tổng 100 quiz attempts",
    earnedAt: null,
  },
];

export const MOCK_ACTIVITIES: RecentActivity[] = [
  {
    id: "a1",
    type: "QUIZ",
    description: "Làm quiz React Hooks",
    detail: "8/10 câu đúng — Mastery 65%→72%",
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: "a2",
    type: "TASK",
    description: "Hoàn thành Build REST API",
    detail: "Node.js · HARD · 120 phút",
    createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
  {
    id: "a3",
    type: "POMODORO",
    description: "Focus session hoàn thành",
    detail: "25 phút · CSS Flexbox",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "a4",
    type: "BADGE",
    description: "Huy hiệu mới: Skill Mastered ⭐",
    detail: "CSS đạt 80% mastery",
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "a5",
    type: "QUIZ",
    description: "Làm quiz TypeScript",
    detail: "6/10 câu đúng — Mastery 52%→58%",
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

// ─── API Service ──────────────────────────────────────────────────────────────

interface UpdateProfilePayload {
  fullName: string;
  learningGoal?: string;
  goalDeadlineDays?: number;
}

interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const studentService = {
  async getProfile(): Promise<UserProfile> {
    try {
      const res = await api.get<{ user: UserProfile }>("/auth/me");
      return res.data.user;
    } catch {
      return MOCK_PROFILE;
    }
  },

  async getStats(): Promise<StudentStats> {
    try {
      const res = await api.get<StudentStats>("/student/stats");
      return res.data;
    } catch {
      return MOCK_STATS;
    }
  },

  async getMasteries(): Promise<SkillMastery[]> {
    try {
      const res = await api.get<SkillMastery[]>("/bkt/mastery");
      return res.data;
    } catch {
      return MOCK_MASTERIES;
    }
  },

  async getActivities(page = 1): Promise<RecentActivity[]> {
    try {
      const res = await api.get<RecentActivity[]>(`/student/activities?page=${page}`);
      return res.data;
    } catch {
      return MOCK_ACTIVITIES;
    }
  },

  async getBadges(): Promise<Badge[]> {
    try {
      const res = await api.get<Badge[]>("/student/badges");
      return res.data;
    } catch {
      return MOCK_BADGES;
    }
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<UserProfile> {
    const res = await api.put<{ user: UserProfile }>("/auth/profile", payload);
    return res.data.user;
  },

  async changePassword(payload: ChangePasswordPayload): Promise<void> {
    await api.put("/auth/change-password", payload);
  },

  async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append("avatar", file);
    const res = await api.post<{ avatarUrl: string }>("/auth/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  async downloadReport(): Promise<Blob> {
    const res = await api.get("/student/report/pdf", { responseType: "blob" });
    return res.data as Blob;
  },
};
