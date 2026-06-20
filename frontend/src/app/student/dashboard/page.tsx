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
import { Timer, ClipboardCheck, Sparkles, TrendingUp, BookOpen, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function StudentDashboard() {
  const { user } = useAuth();
  const { on, off } = useSocket();

  // Component states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [priorityTasks, setPriorityTasks] = useState<Task[]>([]);
  const [masteries, setMasteries] = useState<SkillMastery[]>([]);
  const [riskScore, setRiskScore] = useState<number>(0);
  const [totalFocusTime, setTotalFocusTime] = useState<number>(0);
  const [goalText, setGoalText] = useState<string>('');

  // Daily totals
  const [tasksDoneCount, setTasksDoneCount] = useState<number>(0);
  const [quizStreak, setQuizStreak] = useState<number>(0);
  const [skillsCount, setSkillsCount] = useState<number>(0);

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
      if (!user?.studentId) return;
      try {
        setIsLoading(true);

        // 1. Fetch student masteries
        const masteriesRes = await api.get('/bkt/mastery');
        if (masteriesRes.data.success) {
          setMasteries(masteriesRes.data.masteries);
          setSkillsCount(masteriesRes.data.masteries.length);
        }

        // 2. Fetch scheduled roadmap tasks (Priority Scheduler sorted)
        const roadmapRes = await api.get('/roadmap');
        if (roadmapRes.data.success) {
          setPriorityTasks(roadmapRes.data.tasks.slice(0, 3)); // Top 3 priority
          setTasksDoneCount(roadmapRes.data.progress?.completed || 0);
        }

        // 3. Fetch current risk, study time, and goals from /auth/me
        const meRes = await api.get('/auth/me');
        if (meRes.data.success) {
          const detail = meRes.data.user;
          // Retrieve stats
          const studentProfile = await api.get(`/mentor/students/${user.studentId}`).catch(() => null);
          if (studentProfile?.data?.success) {
            const studentDetails = studentProfile.data.data;
            setRiskScore(studentDetails.student.currentRiskScore);
            setTotalFocusTime(studentDetails.student.totalFocusTime);
            setGoalText(studentDetails.student.learningGoal || '');
          } else {
            // Fallback from context/me
            setRiskScore(user.student?.currentRiskScore || 0);
            setGoalText(user.student?.learningGoal || '');
          }
        }

        // 4. Fetch leaderboard metrics for streak calculations
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
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] w-full flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" />
        <p className="text-slate-500 text-sm font-semibold mt-4">Đang đồng bộ hóa dữ liệu học tập cá nhân...</p>
      </div>
    );
  }

  // Format mastery data for radar chart rendering
  const radarData = masteries.map(m => ({
    skillName: m.skill.name,
    level: m.masteryLevel
  }));

  // Format hours spent
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Real-time Alert Banner */}
      <RedFlagAlert riskScore={riskScore} />

      {/* Onboarding Goal summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] text-blue-400 font-extrabold uppercase tracking-widest bg-blue-950/40 border border-blue-900/30 px-2.5 py-1 rounded-md">
              🎯 Mục tiêu của bạn
            </span>
            <h3 className="text-slate-100 font-bold text-base md:text-lg mt-3 leading-relaxed">
              {goalText || 'Chưa thiết lập mục tiêu học tập.'}
            </h3>
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
        {/* Stat 1: Study hours */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-900/30">
            <Timer className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">Thời gian học</span>
            <span className="text-slate-100 font-extrabold text-lg mt-0.5 block">
              {formatTime(totalFocusTime)}
            </span>
          </div>
        </div>

        {/* Stat 2: Tasks Done */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-900/30">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">Hoàn thành</span>
            <span className="text-slate-100 font-extrabold text-lg mt-0.5 block">
              {tasksDoneCount} Tasks
            </span>
          </div>
        </div>

        {/* Stat 3: Quiz streak */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-900/30">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">Học tập liên tục</span>
            <span className="text-slate-100 font-extrabold text-lg mt-0.5 block">
              {quizStreak} Ngày 🔥
            </span>
          </div>
        </div>

        {/* Stat 4: Skills tracking */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-900/30">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">Theo dõi kỹ năng</span>
            <span className="text-slate-100 font-extrabold text-lg mt-0.5 block">
              {skillsCount} Kỹ năng
            </span>
          </div>
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Mastery Radar */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:col-span-7 flex flex-col justify-between">
          <div className="mb-4">
            <h4 className="text-slate-200 font-bold text-sm tracking-wide">Hồ sơ năng lực học tập</h4>
            <span className="text-slate-500 text-xs font-medium">Xác suất thành thạo các kỹ năng cốt lõi (BKT)</span>
          </div>
          <MasteryRadar masteries={radarData} />
        </div>

        {/* Chart 2: Risk Gauge */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:col-span-5 flex flex-col justify-between items-center text-center">
          <div className="w-full text-left mb-4">
            <h4 className="text-slate-200 font-bold text-sm tracking-wide">Nguy cơ rớt môn học</h4>
            <span className="text-slate-500 text-xs font-medium">Dự báo theo mô hình Logistic Regression</span>
          </div>
          <div className="my-auto py-4">
            <RiskGauge score={riskScore} size="lg" />
          </div>
          <p className="text-slate-500 text-xs px-4 mt-4 leading-relaxed font-semibold">
            Rủi ro tính từ tỉ lệ làm task đúng hạn, điểm quiz trung bình, và tổng giờ tự học.
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
