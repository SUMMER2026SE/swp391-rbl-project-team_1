'use client';

import React, { useState, useEffect } from 'react';
import useAuth from '../../../../hooks/useAuth';
import api from '../../../../services/api';
import Avatar from '../../../../components/common/Avatar';
import LoadingSpinner from '../../../../components/common/LoadingSpinner';
import { Trophy, TrendingUp, Flame, Star, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

interface LeaderboardUser {
  studentId: string;
  fullName: string;
  email: string;
  currentRiskScore: number;
  avgMastery: number;
  learningVelocity: number;
  streak: number;
  trend: 'UP' | 'DOWN';
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  
  // States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [myRank, setMyRank] = useState<{ rank: number; details: LeaderboardUser | null }>({
    rank: -1,
    details: null
  });
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('week');

  useEffect(() => {
    loadLeaderboard();
  }, [user, period]);

  const loadLeaderboard = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/leaderboard?period=${period}&limit=10`);
      if (response.data.success) {
        setLeaderboard(response.data.leaderboard);
        setMyRank(response.data.myRank || { rank: -1, details: null });
      }
    } catch (_) {
      toast.error('Lỗi khi tải bảng xếp hạng.');
    } finally {
      setIsLoading(false);
    }
  };

  // Slice podium users
  const top1 = leaderboard[0];
  const top2 = leaderboard[1];
  const top3 = leaderboard[2];

  // Ranks 4 to 10
  const runnersUp = leaderboard.slice(3);

  const getPeriodLabel = () => {
    if (period === 'week') return 'Tuần này';
    if (period === 'month') return 'Tháng này';
    return 'Học kỳ này';
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans select-none">
      
      {/* HEADER BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-slate-100 font-bold text-lg">Bảng Xếp Hạng Học Tập</h2>
              <span className="text-slate-500 text-xs font-semibold">
                Xếp hạng dựa trên Tốc độ học tập (Learning Velocity) thay vì điểm tĩnh
              </span>
            </div>
          </div>

          {/* Period filter buttons */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800/80 self-start sm:self-auto font-bold text-[10px] tracking-wide uppercase">
            {(['week', 'month', 'all'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                  period === p
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-500/20'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {p === 'week' ? 'Tuần' : p === 'month' ? 'Tháng' : 'Học kỳ'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          {/* PODIUM OF TOP 3 */}
          {leaderboard.length > 0 ? (
            <div className="grid grid-cols-3 gap-3 bg-slate-900 border border-slate-800 rounded-3xl p-6 items-end min-h-[280px]">
              
              {/* Rank 2 (Left) */}
              {top2 ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <Avatar name={top2.fullName} size="lg" variant="purple" />
                    <span className="absolute -bottom-2 -right-1 w-6 h-6 rounded-full bg-slate-400 border-2 border-slate-900 text-slate-950 text-xs font-black flex items-center justify-center shadow">
                      2
                    </span>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-200 font-bold text-xs truncate max-w-[90px]">{top2.fullName}</p>
                    <span className="text-[10px] text-purple-400 font-bold">
                      +{top2.learningVelocity.toFixed(3)}
                    </span>
                  </div>
                  {/* Visual Stand */}
                  <div className="w-full bg-slate-950/40 border border-slate-850 h-24 rounded-t-xl flex items-center justify-center text-slate-500 font-black text-2xl">
                    🥈
                  </div>
                </div>
              ) : <div />}

              {/* Rank 1 (Center - Tallest) */}
              {top1 ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="relative scale-110">
                    <Avatar name={top1.fullName} size="xl" variant="amber" />
                    <span className="absolute -bottom-2 -right-1 w-7 h-7 rounded-full bg-amber-500 border-2 border-slate-900 text-slate-950 text-sm font-black flex items-center justify-center shadow">
                      1
                    </span>
                  </div>
                  <div className="text-center pt-2">
                    <p className="text-slate-100 font-black text-sm truncate max-w-[110px]">{top1.fullName}</p>
                    <span className="text-xs text-amber-400 font-black">
                      +{top1.learningVelocity.toFixed(3)}
                    </span>
                  </div>
                  {/* Visual Stand */}
                  <div className="w-full bg-slate-950/60 border border-slate-800 h-32 rounded-t-2xl flex items-center justify-center text-slate-400 font-black text-3xl shadow-lg relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 to-transparent pointer-events-none" />
                    🥇
                  </div>
                </div>
              ) : <div />}

              {/* Rank 3 (Right) */}
              {top3 ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <Avatar name={top3.fullName} size="lg" variant="emerald" />
                    <span className="absolute -bottom-2 -right-1 w-6 h-6 rounded-full bg-amber-700 border-2 border-slate-900 text-slate-950 text-xs font-black flex items-center justify-center shadow">
                      3
                    </span>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-200 font-bold text-xs truncate max-w-[90px]">{top3.fullName}</p>
                    <span className="text-[10px] text-emerald-400 font-bold">
                      +{top3.learningVelocity.toFixed(3)}
                    </span>
                  </div>
                  {/* Visual Stand */}
                  <div className="w-full bg-slate-950/40 border border-slate-850 h-16 rounded-t-xl flex items-center justify-center text-slate-500 font-black text-2xl">
                    🥉
                  </div>
                </div>
              ) : <div />}

            </div>
          ) : null}

          {/* TABLE RANKINGS (Ranks 4-10) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden mt-6">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/30 flex items-center justify-between">
              <span className="text-slate-200 font-bold text-sm">Xếp hạng các vị trí tiếp theo</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{getPeriodLabel()}</span>
            </div>

            {leaderboard.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm font-semibold border-2 border-dashed border-slate-800/50 m-6 rounded-2xl">
                Chưa có học viên nào ghi nhận hoạt động trong khoảng thời gian này.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {runnersUp.map((student, idx) => {
                  const rank = idx + 4;
                  return (
                    <div key={student.studentId} className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-800/10 transition-colors">
                      {/* Left Rank & Name */}
                      <div className="flex items-center gap-4 min-w-0">
                        <span className="w-5 text-center text-xs font-black text-slate-500">#{rank}</span>
                        <Avatar name={student.fullName} size="sm" />
                        <div className="min-w-0">
                          <p className="text-slate-200 text-xs font-bold truncate leading-none mb-1">{student.fullName}</p>
                          <p className="text-slate-500 text-[10px] truncate leading-none">{student.email}</p>
                        </div>
                      </div>

                      {/* Right stats */}
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Thành thạo TB</span>
                          <span className="text-slate-300 font-bold text-xs">{student.avgMastery}%</span>
                        </div>
                        
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Chuỗi học</span>
                          <span className="text-slate-300 font-bold text-xs flex items-center justify-end gap-1">
                            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            {student.streak}
                          </span>
                        </div>

                        <div className="text-right w-16">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Tốc độ</span>
                          <span className="text-xs font-black text-emerald-400 flex items-center justify-end gap-0.5">
                            {student.learningVelocity >= 0 ? (
                              <ChevronUp className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-rose-500" />
                            )}
                            +{Math.abs(student.learningVelocity).toFixed(3)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ACTIVE STUDENT'S PERSONAL RANK CARD */}
          {myRank.rank > 0 && myRank.details && (
            <div className="bg-gradient-to-r from-blue-950/20 to-indigo-950/20 border border-blue-900/40 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-black text-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                  #{myRank.rank}
                </div>
                <div>
                  <h4 className="text-slate-200 font-bold text-sm">Vị trí xếp hạng của bạn</h4>
                  <p className="text-slate-400 text-xs mt-0.5 font-semibold">
                    Đạt tốc độ tăng trưởng năng lực học tập +{myRank.details.learningVelocity.toFixed(3)} trong {getPeriodLabel().toLowerCase()}.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-center sm:text-right">
                  <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Thành thạo trung bình</span>
                  <span className="text-slate-100 font-extrabold text-sm">{myRank.details.avgMastery}%</span>
                </div>
                <div className="text-center sm:text-right">
                  <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Chuỗi streak</span>
                  <span className="text-slate-100 font-extrabold text-sm flex items-center justify-center sm:justify-end gap-1">
                    <Flame className="w-4.5 h-4.5 text-amber-500 fill-amber-500" />
                    {myRank.details.streak} ngày
                  </span>
                </div>
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
}
