// ─── EduPath Student Types ───────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  avatar: string | null;
  role: "STUDENT" | "MENTOR" | "ADMIN";
  createdAt: string;
  isActive: boolean;
}

export interface StudentStats {
  totalFocusTime: number; // minutes
  totalTasksDone: number;
  totalQuizAttempts: number;
  currentStreak: number; // days
  longestStreak: number; // days
  currentRiskScore: number; // 0-100
  learningVelocity: number; // delta mastery/day
  learningGoal: string | null;
  goalDeadlineDays: number | null;
}

export interface SkillMastery {
  skillName: string;
  skillSlug: string;
  trackName: string; // Web Dev / Data / Mobile
  masteryLevel: number; // 0-1
  updatedAt: string;
}

export type ActivityType = "QUIZ" | "TASK" | "POMODORO" | "BADGE";

export interface RecentActivity {
  id: string;
  type: ActivityType;
  description: string;
  detail: string;
  createdAt: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji
  condition: string;
  earnedAt: string | null; // null = not yet earned
}

export type ActiveTab = "overview" | "skills" | "badges" | "activity";

export type TrackName = "Web Dev" | "Data Science" | "Mobile";

export interface RiskLevel {
  label: string;
  color: string;
  bgColor: string;
}

export interface PasswordStrength {
  level: number; // 0-4
  label: string;
  color: string;
}
