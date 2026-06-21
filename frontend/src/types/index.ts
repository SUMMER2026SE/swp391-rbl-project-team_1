export type Role = 'STUDENT' | 'MENTOR' | 'ADMIN';

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'ARCHIVED';

export type QuizType = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE';

export type AlertType = 'RED_FLAG' | 'YELLOW_WARNING';

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  role: Role;
  studentId?: string;
  mentorId?: string;
  createdAt?: string;
  student?: {
    id: string;
    learningGoal?: string | null;
    preferredStudyTime?: string | null;
    learningStyle?: string | null;
    totalFocusTime: number;
    currentRiskScore: number;
    onboardingCompleted: boolean;
  };
}

export interface Student {
  id: string;
  userId: string;
  user?: User;
  learningGoal?: string | null;
  totalFocusTime: number;
  currentRiskScore: number;
  onboardingCompleted: boolean;
}

export interface Mentor {
  id: string;
  userId: string;
  user?: User;
}

export interface Skill {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  parent?: Skill | null;
  children?: Skill[];
}

export interface SkillMastery {
  id: string;
  studentId: string;
  skillId: string;
  skill: Skill;
  masteryLevel: number;
  pLearn: number;
  pForget: number;
  pGuess: number;
  pSlip: number;
  updatedAt: string;
}

export interface BKTHistory {
  id: string;
  masteryId: string;
  masteryBefore: number;
  masteryAfter: number;
  wasCorrect: boolean;
  createdAt: string;
}

export interface RiskHistory {
  id: string;
  studentId: string;
  riskScore: number;
  taskCompletionRate: number;
  avgQuizScore: number;
  totalTimeSpent: number;
  createdAt: string;
}

export interface Task {
  id: string;
  studentId: string;
  title: string;
  description?: string | null;
  skillId: string;
  skill: Skill;
  difficulty: Difficulty;
  deadline?: string | null;
  estimatedMinutes: number;
  status: TaskStatus;
  completedAt?: string | null;
  isAIGenerated: boolean;
  priorityScore?: number;
  createdAt: string;
}

export interface KnowledgeUnit {
  id: string;
  mentorId: string;
  mentor?: Mentor;
  title: string;
  content: string;
  skillId: string;
  skill: Skill;
  difficulty: Difficulty;
  isPublic: boolean;
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  mentorId?: string | null;
  skillId: string;
  skill: Skill;
  question: string;
  type: QuizType;
  options: { text: string; isCorrect?: boolean }[];
  explanation?: string | null;
  difficulty: Difficulty;
  createdAt: string;
}

export interface QuizAttempt {
  id: string;
  studentId: string;
  questionId: string;
  question: QuizQuestion;
  selectedOption: number;
  isCorrect: boolean;
  timeSpentSec: number;
  createdAt: string;
}

export interface PomodoroSession {
  id: string;
  studentId: string;
  taskId?: string | null;
  task?: Task | null;
  durationMin: number;
  completed: boolean;
  endedAt?: string | null;
  createdAt: string;
}

export interface Alert {
  id: string;
  studentId: string;
  type: AlertType;
  message: string;
  timestamp: string;
}
