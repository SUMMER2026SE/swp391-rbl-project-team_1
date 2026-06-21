'use client';

import React, { useState, useEffect } from 'react';
import useAuth from '../../../hooks/useAuth';
import api from '../../../services/api';
import { SkillMastery, PomodoroSession, QuizAttempt } from '../../../types';
import Button from '../../../components/common/Button';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import {
  Award,
  Flame,
  Zap,
  Clock,
  BookOpen,
  CheckSquare,
  Lock,
  Printer,
  ChevronDown,
  TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Badge {
  id: string;
  emoji: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export default function AchievementsPage() {
  const { user } = useAuth();
  
  // Loading states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [masteries, setMasteries] = useState<SkillMastery[]>([]);
  const [selectedSkillId, setSelectedSkillId] = useState<string>('');
  const [bktHistoryData, setBktHistoryData] = useState<any[]>([]);

  // Stats
  const [streakDays, setStreakDays] = useState<number>(0);
  const [tasksDone, setTasksDone] = useState<number>(0);
  const [quizzesTaken, setQuizzesTaken] = useState<number>(0);
  const [accuracyRate, setAccuracyRate] = useState<number>(0);
  const [totalFocusHours, setTotalFocusHours] = useState<number>(0);

  // Activity dates for GitHub contribution grid
  const [activityDates, setActivityDates] = useState<{ [date: string]: number }>({});

  useEffect(() => {
    loadAchievements();
  }, [user]);

  useEffect(() => {
    if (selectedSkillId) {
      loadBktHistory(selectedSkillId);
    }
  }, [selectedSkillId]);

  const loadAchievements = async () => {
    if (!user?.studentId) return;
    try {
      setIsLoading(true);

      // 1. Fetch skills and masteries
      const masteriesRes = await api.get('/bkt/mastery');
      if (masteriesRes.data.success) {
        const list = masteriesRes.data.masteries;
        setMasteries(list);
        if (list.length > 0) {
          setSelectedSkillId(list[0].skillId);
        }
      }

      // 2. Fetch stats from leaderboard
      const leaderboardRes = await api.get('/leaderboard');
      if (leaderboardRes.data.success && leaderboardRes.data.myRank?.details) {
        const details = leaderboardRes.data.myRank.details;
        setStreakDays(details.streak || 0);
      }

      // 3. Fetch completed tasks count
      const roadmapRes = await api.get('/roadmap');
      if (roadmapRes.data.success) {
        setTasksDone(roadmapRes.data.progress?.completed || 0);
      }

      // 4. Fetch quiz history to compute accuracy
      const quizRes = await api.get('/quiz/history?limit=100');
      if (quizRes.data.success) {
        const attempts: QuizAttempt[] = quizRes.data.attempts;
        setQuizzesTaken(attempts.length);
        const correct = attempts.filter(a => a.isCorrect).length;
        setAccuracyRate(attempts.length > 0 ? Math.round((correct / attempts.length) * 100) : 0);
      }

      // 5. Fetch Pomodoro sessions for focus hours and calendar grids
      const pomodoroRes = await api.get('/pomodoro/history');
      if (pomodoroRes.data.success) {
        const sessions: PomodoroSession[] = pomodoroRes.data.sessions;
        const totalMin = sessions.filter(s => s.completed).reduce((sum, s) => sum + s.durationMin, 0);
        setTotalFocusHours(parseFloat((totalMin / 60).toFixed(1)));

        // Compile activity counts per date (last 60 days)
        const datesMap: { [key: string]: number } = {};
        sessions.forEach(s => {
          const dStr = s.createdAt.split('T')[0];
          datesMap[dStr] = (datesMap[dStr] || 0) + 1;
        });
        setActivityDates(datesMap);
      }
    } catch (_) {
      toast.error('Lỗi khi tải thông tin thành tích.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadBktHistory = async (skillId: string) => {
    try {
      const response = await api.get(`/bkt/history/${skillId}`);
      if (response.data.success) {
        const formatted = response.data.history.map((h: any, idx: number) => ({
          name: `Lần ${idx + 1}`,
          mastery: Math.round(h.masteryAfter * 100)
        }));
        setBktHistoryData(formatted);
      }
    } catch (_) {}
  };

  // Gamified Achievement Badges list
  const badges: Badge[] = [
    {
      id: 'first_quiz',
      emoji: '🎯',
      name: 'First Quiz',
      description: 'Làm bài trắc nghiệm BKT lần đầu tiên',
      unlocked: quizzesTaken > 0
    },
    {
      id: 'week_warrior',
      emoji: '🔥',
      name: 'Week Warrior',
      description: 'Duy trì chuỗi học tập liên tiếp 7 ngày',
      unlocked: streakDays >= 7
    },
    {
      id: 'month_master',
      emoji: '🏆',
      name: 'Month Master',
      description: 'Duy trì chuỗi học tập liên tiếp 30 ngày',
      unlocked: streakDays >= 30
    },
    {
      id: 'skill_mastered',
      emoji: '⭐',
      name: 'Skill Mastered',
      description: 'Đạt tỉ lệ thành thạo >= 80% cho một kỹ năng',
      unlocked: masteries.some(m => m.masteryLevel >= 0.8)
    },
    {
      id: 'speed_learner',
      emoji: '🚀',
      name: 'Speed Learner',
      description: 'Đạt tốc độ hoàn thành công việc cao (Velocity > 0)',
      unlocked: streakDays > 0 // simple representation
    },
    {
      id: 'focus_champion',
      emoji: '🍅',
      name: 'Focus Champion',
      description: 'Hoàn thành 10 phiên Pomodoro tập trung',
      unlocked: totalFocusHours >= 4.1 // ~10 sessions
    },
    {
      id: 'knowledge_seeker',
      emoji: '📚',
      name: 'Knowledge Seeker',
      description: 'Tham gia học tập và giải phóng 3 kỹ năng mới',
      unlocked: masteries.length >= 3
    }
  ];

  // GitHub contribution grid calculations (last 6 weeks = 42 days)
  const getContributionGrid = () => {
    const cells = [];
    const now = new Date();
    
    for (let i = 41; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dStr = d.toISOString().split('T')[0];
      const count = activityDates[dStr] || 0;
      
      let intensityColor = 'bg-slate-900 border-slate-950/20'; // 0 count
      if (count > 0 && count <= 2) intensityColor = 'bg-blue-900 border-blue-950/20';
      if (count > 2 && count <= 4) intensityColor = 'bg-blue-700 border-blue-900/20';
      if (count > 4) intensityColor = 'bg-blue-500 border-blue-700/20';

      cells.push({
        date: dStr,
        intensityColor,
        count
      });
    }
    return cells;
  };

  const contributionCells = getContributionGrid();

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans">
      
      {/* STATS OVERVIEW HEADER */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative select-none">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-slate-100 font-bold text-lg">Báo Cáo Thành Tích Học Tập</h2>
              <span className="text-slate-500 text-xs font-semibold">
                Tổng hợp thành quả tự học cá nhân hóa thích ứng
              </span>
            </div>
          </div>

          <button
            onClick={() => window.print()}
            className="p-3 border border-slate-800 text-slate-400 hover:text-slate-200 bg-slate-950/20 hover:bg-slate-800 rounded-xl transition-all active:scale-95 text-xs font-bold flex items-center gap-2 self-start md:self-auto"
          >
            <Printer className="w-4 h-4" />
            <span>Xuất Báo Cáo</span>
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="space-y-1">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Lớp đã học</span>
            <div className="text-slate-200 font-black text-lg flex items-center gap-1.5">
              <CheckSquare className="w-4.5 h-4.5 text-blue-400" />
              <span>{tasksDone} Tasks</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Chuỗi Quiz</span>
            <div className="text-slate-200 font-black text-lg flex items-center gap-1.5">
              <Flame className="w-4.5 h-4.5 text-amber-500 fill-amber-500" />
              <span>{streakDays} Ngày</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Độ chính xác</span>
            <div className="text-slate-200 font-black text-lg flex items-center gap-1.5">
              <Zap className="w-4.5 h-4.5 text-emerald-400" />
              <span>{accuracyRate}%</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Giờ tập trung</span>
            <div className="text-slate-200 font-black text-lg flex items-center gap-1.5">
              <Clock className="w-4.5 h-4.5 text-purple-400" />
              <span>{totalFocusHours}h Focus</span>
            </div>
          </div>
        </div>
      </div>

      {/* STREAK CALENDAR (GITHUB STYLE) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 select-none">
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-4 mb-5">
          <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
          <h4 className="text-slate-200 font-bold text-sm tracking-wide">Nhật Ký Hoạt Động Tự Học</h4>
        </div>

        {/* Calendar Grid wrapper */}
        <div className="flex flex-wrap items-center gap-1.5 justify-center py-4 bg-slate-950/20 border border-slate-800/60 rounded-2xl">
          {contributionCells.map((cell, idx) => (
            <div
              key={idx}
              className={`w-8 h-8 rounded-lg border border-transparent transition-all duration-300 hover:scale-115 ${cell.intensityColor}`}
              title={`${cell.date}: ${cell.count} hoạt động`}
            />
          ))}
        </div>

        <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-4 px-2">
          <span>Học ít</span>
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-slate-900" />
            <div className="w-2.5 h-2.5 rounded bg-blue-900" />
            <div className="w-2.5 h-2.5 rounded bg-blue-700" />
            <div className="w-2.5 h-2.5 rounded bg-blue-500" />
          </div>
          <span>Học nhiều</span>
        </div>
      </div>

      {/* BADGES COLLECTION */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 select-none">
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-4 mb-5">
          <Award className="w-5 h-5 text-blue-400" />
          <h4 className="text-slate-200 font-bold text-sm tracking-wide">Bộ Sưu Tập Huy Hiệu</h4>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`p-5 rounded-2xl border flex flex-col items-center justify-between text-center relative overflow-hidden transition-all duration-300 group ${
                badge.unlocked
                  ? 'bg-slate-950/20 border-slate-800/80 hover:border-slate-700'
                  : 'bg-slate-950/40 border-slate-900/50 opacity-40 hover:opacity-60'
              }`}
            >
              {/* Locked icon overlay */}
              {!badge.unlocked && (
                <div className="absolute top-2.5 right-2.5 text-slate-700">
                  <Lock className="w-4 h-4" />
                </div>
              )}

              <span className={`text-4xl mb-4 transition-transform duration-500 group-hover:scale-120 ${!badge.unlocked ? 'grayscale filter' : ''}`}>
                {badge.emoji}
              </span>
              
              <div>
                <h5 className="text-slate-200 font-bold text-xs tracking-wide">{badge.name}</h5>
                <p className="text-[10px] text-slate-500 leading-snug mt-1 font-semibold">
                  {badge.description}
                </p>
              </div>

              <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full mt-4 border ${
                badge.unlocked 
                  ? 'bg-blue-950/20 border-blue-900/30 text-blue-400' 
                  : 'bg-slate-900 border-slate-800 text-slate-600'
              }`}>
                {badge.unlocked ? 'Đã Đạt' : 'Chưa Đạt'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* BKT HISTORICAL CURVE */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 select-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/80 pb-4 mb-5 gap-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <h4 className="text-slate-200 font-bold text-sm tracking-wide">Biểu Đồ Tăng Trưởng Năng Lực</h4>
          </div>

          {/* Skill Selector */}
          <select
            value={selectedSkillId}
            onChange={(e) => setSelectedSkillId(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-slate-300 text-xs focus:border-blue-500 transition-all outline-none font-semibold"
          >
            {masteries.map(m => (
              <option key={m.skillId} value={m.skillId}>{m.skill.name}</option>
            ))}
          </select>
        </div>

        {bktHistoryData.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-sm font-semibold border border-slate-850 rounded-2xl bg-slate-950/20">
            Hãy làm bài quiz kiểm tra kỹ năng để ghi nhận lịch sử tăng trưởng.
          </div>
        ) : (
          <div className="w-full h-56 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bktHistoryData}>
                <XAxis dataKey="name" stroke="#475569" fontSize={8} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#475569" fontSize={8} tickLine={false} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 10 }} />
                <Line
                  type="monotone"
                  dataKey="mastery"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 4, stroke: '#1d4ed8', fill: '#3b82f6', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

    </div>
  );
}
