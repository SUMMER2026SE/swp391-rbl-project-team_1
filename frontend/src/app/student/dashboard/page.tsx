'use client';

import React, { useState, useEffect } from 'react';
import useAuth from '../../../hooks/useAuth';
import useSocket from '../../../hooks/useSocket';
import api from '../../../services/api';
import { Task, SkillMastery } from '../../../types';
import RiskGauge from '../../../components/ui/RiskGauge';
import MasteryRadar from '../../../components/ui/MasteryRadar';
import RedFlagAlert from '../../../components/ui/RedFlagAlert';
import TaskCard from '../../../components/ui/TaskCard';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { Timer, ClipboardCheck, Sparkles, TrendingUp, BookOpen, X, Lightbulb, LayoutDashboard, RefreshCw } from 'lucide-react';
import Link from 'next/link';

// ─────────────────────────────────────────────
// Onboarding Banner Component
// ─────────────────────────────────────────────
function OnboardingBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="relative bg-gradient-to-r from-blue-950/60 via-indigo-950/60 to-purple-950/60 border border-blue-700/40 rounded-3xl p-6 overflow-hidden">
      {/* Decorative glow blobs */}
      <div className="absolute top-0 left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-40 h-40 bg-purple-500/8 rounded-full blur-3xl pointer-events-none" />

      <button
        onClick={onDismiss}
        className="absolute top-4 right-4 p-1.5 text-slate-500 hover:text-slate-200 bg-slate-900/60 rounded-lg transition-colors"
        aria-label="Đóng hướng dẫn"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="mb-3 flex items-center gap-2">
        <Lightbulb className="w-5 h-5 text-yellow-400 flex-shrink-0" />
        <span className="text-yellow-400 font-extrabold text-xs uppercase tracking-widest">
          Chào mừng bạn đến EduPath! 🎉
        </span>
      </div>

      <h3 className="text-slate-100 font-bold text-base mb-4 leading-relaxed">
        Lộ trình AI đã được tạo riêng cho bạn. Đây là 3 điều cần biết để bắt đầu:
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex gap-3 items-start bg-slate-950/40 border border-slate-800/60 rounded-2xl p-4">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-900/30 flex-shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <p className="text-slate-200 font-bold text-xs mb-1">Ưu tiên AI</p>
            <p className="text-slate-500 text-[11px] leading-relaxed font-medium">
              Phần "Việc quan trọng cần làm" bên dưới hiển thị các task AI đã sắp xếp theo độ ưu tiên dựa trên mức thành thạo và hạn chót.
            </p>
          </div>
        </div>

        <div className="flex gap-3 items-start bg-slate-950/40 border border-slate-800/60 rounded-2xl p-4">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-900/30 flex-shrink-0 mt-0.5">
            <LayoutDashboard className="w-4 h-4" />
          </div>
          <div>
            <p className="text-slate-200 font-bold text-xs mb-1">Bảng học tập</p>
            <p className="text-slate-500 text-[11px] leading-relaxed font-medium">
              Truy cập{' '}
              <Link href="/student/workspace" className="text-emerald-400 font-bold underline underline-offset-2">
                Bảng Kanban
              </Link>{' '}
              để quản lý toàn bộ task, bấm "Bắt đầu" làm Pomodoro và ghi nhận tiến độ mỗi ngày.
            </p>
          </div>
        </div>

        <div className="flex gap-3 items-start bg-slate-950/40 border border-slate-800/60 rounded-2xl p-4">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-900/30 flex-shrink-0 mt-0.5">
            <RefreshCw className="w-4 h-4" />
          </div>
          <div>
            <p className="text-slate-200 font-bold text-xs mb-1">Lộ trình cá nhân</p>
            <p className="text-slate-500 text-[11px] leading-relaxed font-medium">
              Vào{' '}
              <Link href="/student/roadmap" className="text-purple-400 font-bold underline underline-offset-2">
                Lộ trình cá nhân
              </Link>{' '}
              để xem toàn cảnh các giai đoạn học tập và chi tiết các đầu việc cần hoàn thành trên hành trình của bạn.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Dashboard Page
// ─────────────────────────────────────────────
export default function StudentDashboard() {
  const { user } = useAuth();
  const { on, off } = useSocket();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [priorityTasks, setPriorityTasks] = useState<Task[]>([]);
  const [masteries, setMasteries] = useState<SkillMastery[]>([]);
  const [riskScore, setRiskScore] = useState<number>(0);
  const [totalFocusTime, setTotalFocusTime] = useState<number>(0);
  const [goalText, setGoalText] = useState<string>('');

  const [tasksDoneCount, setTasksDoneCount] = useState<number>(0);
  const [quizStreak, setQuizStreak] = useState<number>(0);
  const [skillsCount, setSkillsCount] = useState<number>(0);

  // Onboarding banner state
  const [showBanner, setShowBanner] = useState<boolean>(false);

  useEffect(() => {
    // Check if we need to show the onboarding banner
    const shouldShow = localStorage.getItem('show_onboarding_banner') === 'true';
    if (shouldShow) {
      setShowBanner(true);
    }
  }, []);

  const handleDismissBanner = () => {
    setShowBanner(false);
    localStorage.removeItem('show_onboarding_banner');
  };

  // Real-time risk listener
  useEffect(() => {
    const handleRiskUpdate = (data: any) => {
      if (data && data.studentId === user?.studentId) {
        setRiskScore(data.riskScore);
      }
    };
    on('red-flag-alert', handleRiskUpdate);
    return () => {
      off('red-flag-alert', handleRiskUpdate);
    };
  }, [on, off, user]);

  useEffect(() => {
    async function loadDashboardData() {
      if (!user?.studentId) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);

        const masteriesRes = await api.get('/bkt/mastery');
        if (masteriesRes.data.success) {
          setMasteries(masteriesRes.data.masteries);
          setSkillsCount(masteriesRes.data.masteries.length);
        }

        const roadmapRes = await api.get('/roadmap');
        if (roadmapRes.data.success) {
          setPriorityTasks(roadmapRes.data.tasks.slice(0, 3));
          setTasksDoneCount(roadmapRes.data.progress?.completed || 0);
        }

        // Always fetch fresh user data from /auth/me to get up-to-date learningGoal
        // (avoids stale cached sessionStorage value right after onboarding)
        const meRes = await api.get('/auth/me');
        if (meRes.data.success) {
          const freshStudent = meRes.data.user?.student;
          setRiskScore(freshStudent?.currentRiskScore || 0);
          setTotalFocusTime(freshStudent?.totalFocusTime || 0);
          setGoalText(freshStudent?.learningGoal || '');
        }

        const leaderboardRes = await api.get('/leaderboard');
        if (leaderboardRes.data.success && leaderboardRes.data.myRank?.details) {
          setQuizStreak(leaderboardRes.data.myRank.details.streak || 0);
        }
      } catch (error) {
        console.error('Error fetching dashboard statistics:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, [user?.studentId]);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] w-full flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" />
        <p className="text-slate-500 text-sm font-semibold mt-4">Đang đồng bộ hóa dữ liệu học tập cá nhân...</p>
      </div>
    );
  }

  // Format mastery data for radar chart — use actual selected skills from BKT, not hardcoded
  const radarData = masteries
    .filter(m => m.masteryLevel !== undefined)
    .slice(0, 6)
    .map(m => ({
      skillName: m.skill.name,
      level: m.masteryLevel
    }));

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  // Parse goal display: separate description from study-hour metadata
  // Backend stores: "Thành thạo React (Mục tiêu học tập: 2 giờ/ngày trong 3 tháng)"
  // Defensive: also strips any leading comma/whitespace from malformed stored values
  const parseGoalText = (raw: string) => {
    if (!raw) return { description: '', metadata: '' };
    // Match the metadata suffix pattern (Mục tiêu học tập: ...)
    const match = raw.match(/^(.*)\s*\(Mục tiêu học tập:\s*(.+?)\)\s*$/);
    if (match) {
      // Strip any leading/trailing punctuation or commas from description (defensive against bad DB data)
      const description = match[1].trim().replace(/^[,;\s]+/, '').trim();
      const metadata = match[2].trim();
      // Only accept description if it contains at least one letter/number character
      const isValidDescription = /[\p{L}\d]/u.test(description);
      return { description: isValidDescription ? description : '', metadata };
    }
    // No metadata suffix — return raw trimmed (strip leading comma/punctuation defensively)
    const stripped = raw.trim().replace(/^[,;\s]+/, '').trim();
    return { description: stripped, metadata: '' };
  };

  const { description: goalDescription, metadata: goalMetadata } = parseGoalText(goalText);

  return (
    <div className="space-y-6">
      {/* Onboarding Welcome Banner */}
      {showBanner && <OnboardingBanner onDismiss={handleDismissBanner} />}

      {/* Real-time Alert Banner */}
      <RedFlagAlert riskScore={riskScore} />

      {/* Onboarding Goal summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] text-blue-400 font-extrabold uppercase tracking-widest bg-blue-950/40 border border-blue-900/30 px-2.5 py-1 rounded-md flex items-center gap-1 w-max">
              <span>🎯</span>
              <span>Mục tiêu của bạn</span>
            </span>
            <h3 className="text-slate-100 font-bold text-base md:text-lg mt-3 leading-relaxed">
              {goalDescription || 'Chưa thiết lập mục tiêu học tập.'}
            </h3>
            {goalMetadata && (
              <p className="text-slate-500 text-xs font-semibold mt-1">
                📅 Mục tiêu học tập: {goalMetadata}
              </p>
            )}
          </div>
          <Link
            href="/student/roadmap"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-slate-200 text-sm font-bold transition-all duration-300 self-start md:self-auto active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>AI Roadmap</span>
          </Link>
        </div>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-900/30">
            <Timer className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">Thời gian học</span>
            <span className="text-slate-100 font-extrabold text-lg mt-0.5 block">{formatTime(totalFocusTime)}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-900/30">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">Hoàn thành</span>
            <span className="text-slate-100 font-extrabold text-lg mt-0.5 block">{tasksDoneCount} Tasks</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-900/30">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">Học tập liên tục</span>
            <span className="text-slate-100 font-extrabold text-lg mt-0.5 block">{quizStreak} Ngày 🔥</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-900/30">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">Theo dõi kỹ năng</span>
            <span className="text-slate-100 font-extrabold text-lg mt-0.5 block">{skillsCount} Kỹ năng</span>
          </div>
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:col-span-7 flex flex-col justify-between">
          <div className="mb-4">
            <h4 className="text-slate-200 font-bold text-sm tracking-wide">Hồ sơ năng lực học tập</h4>
            <span className="text-slate-500 text-xs font-medium">
              Xác suất thành thạo dựa trên các kỹ năng bạn đang theo dõi (BKT)
            </span>
          </div>
          <MasteryRadar masteries={radarData} />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:col-span-5 flex flex-col justify-between items-center text-center">
          <div className="w-full text-left mb-4">
            <h4 className="text-slate-200 font-bold text-sm tracking-wide">Rủi ro trì trệ học tập</h4>
            <span className="text-slate-500 text-xs font-medium">Dự báo theo mô hình Logistic Regression</span>
          </div>
          <div className="my-auto py-4">
            <RiskGauge score={riskScore} size="lg" />
          </div>
          <p className="text-slate-500 text-xs px-4 mt-4 leading-relaxed font-semibold">
            Rủi ro tính từ tỉ lệ hoàn thành task đúng hạn, điểm quiz trung bình, và tổng giờ tự học trên lộ trình kỹ năng.
          </p>
        </div>
      </div>

      {/* Priority Tasks list */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div>
            <h4 className="text-slate-200 font-bold text-sm tracking-wide">Việc quan trọng cần làm</h4>
            <p className="text-slate-500 text-xs font-medium mt-0.5">
              Nhiệm vụ có điểm ưu tiên cao nhất do thuật toán sắp xếp
            </p>
          </div>
          <Link
            href="/student/workspace"
            className="text-xs text-blue-400 hover:text-blue-300 font-extrabold transition-colors hover:underline"
          >
            Vào bảng Kanban →
          </Link>
        </div>

        {priorityTasks.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-sm font-semibold border-2 border-dashed border-slate-800 rounded-2xl">
            Không có việc cần làm hôm nay. Tạo task mới trong Bảng học tập!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {priorityTasks.map(task => (
              <TaskCard key={task.id} task={task} compact={true} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
