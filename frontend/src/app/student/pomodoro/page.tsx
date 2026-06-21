'use client';

import React, { useState, useEffect, useRef } from 'react';
import usePomodoro, { PomodoroMode } from '../../../hooks/usePomodoro';
import useAuth from '../../../hooks/useAuth';
import api from '../../../services/api';
import { Task, PomodoroSession } from '../../../types';
import Button from '../../../components/common/Button';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { Play, Pause, RotateCcw, SkipForward, Timer, Clock, BarChart2, Calendar, Clipboard } from 'lucide-react';
import toast from 'react-hot-toast';
import { handleError } from '@/utils/errorHandler';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function PomodoroPage() {
  const { user } = useAuth();
  
  // Timer Hook
  const {
    timeLeft,
    isRunning,
    mode,
    sessionCount,
    start,
    pause,
    reset,
    skip
  } = usePomodoro();

  // Component state
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [history, setHistory] = useState<PomodoroSession[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isCompletingRef = useRef<boolean>(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  useEffect(() => {
    loadActiveTasks();
    loadSessionHistory();
  }, [user]);

  // Sync Timer start / completion with backend endpoints
  useEffect(() => {
    // When timer starts running, create a Pomodoro session in DB if not already created
    if (isRunning && !currentSessionId && mode === 'WORK') {
      startDBSession();
    }
  }, [isRunning, mode]);

  useEffect(() => {
    // When timeLeft hits 0, the hook calls handleSessionEnd internally.
    // If the mode transitions from WORK to BREAK, that means a WORK session has just completed!
    // We check if we have a currentSessionId to complete.
    if (timeLeft === 0 && mode === 'WORK' && currentSessionId) {
      completeDBSession();
    }
  }, [timeLeft, mode]);

  const loadActiveTasks = async () => {
    try {
      const response = await api.get('/workspace/tasks?status=IN_PROGRESS');
      if (response.data.success) {
        setActiveTasks(response.data.tasks);
        if (response.data.tasks.length > 0) {
          setSelectedTaskId(response.data.tasks[0].id);
        }
      }
    } catch (_) {}
  };

  const loadSessionHistory = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/pomodoro/history?week=current');
      if (response.data.success) {
        setHistory(response.data.sessions);
        formatChartData(response.data.sessions);
      }
    } catch (_) {
    } finally {
      setIsLoading(false);
    }
  };

  const startDBSession = async () => {
    try {
      const response = await api.post('/pomodoro/start', {
        taskId: selectedTaskId || undefined,
        durationMin: 25
      });
      if (response.data.success) {
        setCurrentSessionId(response.data.session.id);
      }
    } catch (_) {}
  };

  const completeDBSession = async () => {
    if (!currentSessionId || isCompletingRef.current) return;
    isCompletingRef.current = true;
    try {
      const response = await api.put(`/pomodoro/${currentSessionId}/complete`);
      if (response.data.success) {
        toast.success('🎉 Hoàn thành phiên Pomodoro học tập tập trung!');
        setCurrentSessionId(null);
        loadSessionHistory();
      }
    } catch (_) {
      handleError('Lỗi lưu kết quả Pomodoro.');
    } finally {
      isCompletingRef.current = false;
    }
  };

  const formatChartData = (sessions: PomodoroSession[]) => {
    const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const data = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = daysOfWeek[date.getDay()];

      const minutes = sessions
        .filter(s => s.completed && s.createdAt.split('T')[0] === dateStr)
        .reduce((sum, s) => sum + s.durationMin, 0);

      data.push({
        name: dayName.substring(0, 6),
        phút: minutes
      });
    }
    setChartData(data);
  };

  // Format timer text
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // Circular progress math
  const getModeDuration = () => {
    if (mode === 'WORK') return 25 * 60;
    if (mode === 'SHORT_BREAK') return 5 * 60;
    return 15 * 60;
  };

  const totalDuration = getModeDuration();
  const radius = 96;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (timeLeft / totalDuration) * circumference;

  const modeColors = {
    WORK: 'stroke-blue-500 text-blue-500',
    SHORT_BREAK: 'stroke-emerald-500 text-emerald-500',
    LONG_BREAK: 'stroke-purple-500 text-purple-500'
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 select-none font-sans">
      
      {/* LEFT PANEL: Focus Timer Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:col-span-7 flex flex-col items-center justify-between min-h-[480px]">
        {/* Mode Tabs */}
        <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800/80 w-full max-w-sm">
          {(['WORK', 'SHORT_BREAK', 'LONG_BREAK'] as PomodoroMode[]).map((m) => (
            <button
              key={m}
              onClick={() => reset(m)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                mode === m
                  ? m === 'WORK' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' :
                    m === 'SHORT_BREAK' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20' :
                    'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {m === 'WORK' ? 'Tập trung' : m === 'SHORT_BREAK' ? 'Nghỉ ngắn' : 'Nghỉ dài'}
            </button>
          ))}
        </div>

        {/* Circular Countdown Gauge */}
        <div className="relative my-6" style={{ width: radius * 2, height: radius * 2 }}>
          <svg className="-rotate-90 w-full h-full" width={radius * 2} height={radius * 2}>
            <circle
              className="stroke-slate-800/50 fill-transparent"
              strokeWidth={stroke}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
            <circle
              className={`${modeColors[mode].split(' ')[0]} fill-transparent transition-all duration-1000 ease-linear`}
              strokeWidth={stroke}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-mono font-bold tracking-tight text-slate-100">
              {formatTime(timeLeft)}
            </span>
            <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest mt-1">
              Phiên thứ {sessionCount + 1}
            </span>
          </div>
        </div>

        {/* Task Selector */}
        <div className="w-full max-w-md space-y-2 mb-6">
          <label className="text-slate-500 font-bold text-[10px] uppercase tracking-wider block text-center">
            Liên kết với Task đang thực hiện
          </label>
          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 text-xs focus:border-blue-500 transition-all outline-none font-semibold text-center"
          >
            <option value="">Không có liên kết Task cụ thể</option>
            {activeTasks.map(t => (
              <option key={t.id} value={t.id}>{t.title} ({t.skill.name})</option>
            ))}
          </select>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => reset()}
            className="p-3 border border-slate-800 text-slate-400 hover:text-slate-200 bg-slate-950/20 hover:bg-slate-800 rounded-xl transition-all active:scale-95"
            title="Reset Timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          
          <Button
            onClick={isRunning ? pause : start}
            variant={mode === 'WORK' ? 'primary' : mode === 'SHORT_BREAK' ? 'emerald' : 'purple'}
            className="px-8 py-3 rounded-xl flex items-center gap-2"
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5 fill-white" />
                <span>Tạm dừng</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-white" />
                <span>Bắt đầu</span>
              </>
            )}
          </Button>

          <button
            onClick={skip}
            className="p-3 border border-slate-800 text-slate-400 hover:text-slate-200 bg-slate-950/20 hover:bg-slate-800 rounded-xl transition-all active:scale-95"
            title="Bỏ qua"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* RIGHT PANEL: Chart & History */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Weekly focus AreaChart */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-4 mb-4">
            <BarChart2 className="w-5 h-5 text-blue-400" />
            <h4 className="text-slate-200 font-bold text-sm tracking-wide">Thời gian tự học trong tuần</h4>
          </div>

          <div className="w-full h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorMin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#475569" fontSize={8} tickLine={false} />
                <YAxis stroke="#475569" fontSize={8} tickLine={false} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 10 }} />
                <Area type="monotone" dataKey="phút" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorMin)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* History table */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 h-[220px] flex flex-col justify-between">
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-4 mb-3">
            <Clipboard className="w-5 h-5 text-blue-400" />
            <h4 className="text-slate-200 font-bold text-sm tracking-wide">Phiên học tập gần đây</h4>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 max-h-[120px] pr-1">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <LoadingSpinner size="sm" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center text-slate-500 text-xs py-8 font-semibold">
                Chưa có lịch sử học tập hôm nay.
              </div>
            ) : (
              history.map(session => (
                <div key={session.id} className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-800/60 rounded-xl text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-amber-500 text-sm">🍅</span>
                    <span className="text-slate-300 font-bold truncate">
                      {session.task?.title || 'Tự học tự do'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold">
                    <span className="text-slate-500">
                      {session.durationMin} phút
                    </span>
                    <span className={`px-2 py-0.5 rounded-full ${
                      session.completed ? 'bg-emerald-950/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {session.completed ? 'Hoàn thành' : 'Hủy'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
