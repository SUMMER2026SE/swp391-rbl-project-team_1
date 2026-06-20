'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/services/api';
import { Button } from '@/components/common/Button';
import { 
  ArrowLeft, Clock, Award, ShieldAlert, AlertTriangle, 
  MessageCircle, BarChart3, TrendingUp, History, Sparkles, BookOpen, Send 
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import toast from 'react-hot-toast';

interface StudentDetails {
  student: {
    id: string;
    fullName: string;
    email: string;
    currentRiskScore: number;
    totalFocusTime: number;
    learningGoal: string | null;
  };
  skillMasteries: {
    id: string;
    skill: {
      name: string;
    };
    masteryLevel: number;
    pLearn: number;
    pForget: number;
    pGuess: number;
    pSlip: number;
  }[];
  riskHistory: {
    createdAt: string;
    riskScore: number;
  }[];
  taskStats: {
    todo: number;
    inProgress: number;
    done: number;
  };
  recentQuizAttempts: {
    id: string;
    question: {
      question: string;
      skill: { name: string };
    };
    isCorrect: boolean;
    timeSpentSec: number;
    createdAt: string;
  }[];
  pomodoroByDay: {
    date: string;
    totalMinutes: number;
  }[];
}

export default function StudentDetailAnalytics() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;

  const [data, setData] = useState<StudentDetails | null>(null);
  const [activeTab, setActiveTab] = useState<'bkt' | 'quizzes' | 'alert'>('bkt');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Alert form state
  const [alertType, setAlertType] = useState<'RED_FLAG' | 'YELLOW_WARNING'>('YELLOW_WARNING');
  const [alertMessage, setAlertMessage] = useState<string>('');
  const [isSendingAlert, setIsSendingAlert] = useState<boolean>(false);

  useEffect(() => {
    if (studentId) {
      fetchStudentDetails();
    }
  }, [studentId]);

  const fetchStudentDetails = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/mentor/students/${studentId}`);
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (_) {
      toast.error('Không thể tải chi tiết học viên.');
      router.push('/mentor/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendManualAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertMessage.trim()) {
      toast.error('Vui lòng nhập nội dung cảnh báo.');
      return;
    }

    setIsSendingAlert(true);
    try {
      const response = await api.post('/mentor/alerts', {
        studentId,
        type: alertType,
        message: alertMessage
      });
      if (response.data.success) {
        toast.success('Gửi cảnh báo thời gian thực thành công! 🔔');
        setAlertMessage('');
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Gửi cảnh báo thất bại.';
      toast.error(msg);
    } finally {
      setIsSendingAlert(false);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const { student, skillMasteries, riskHistory, taskStats, recentQuizAttempts, pomodoroByDay } = data;

  // Chart configuration
  const riskChartData = riskHistory.map(r => ({
    date: new Date(r.createdAt).toLocaleDateString('vi-VN', { month: 'numeric', day: 'numeric' }),
    'Rủi ro': r.riskScore
  }));

  const pomodoroChartData = pomodoroByDay.map(p => {
    const formattedDate = new Date(p.date).toLocaleDateString('vi-VN', { weekday: 'short' });
    return {
      name: formattedDate,
      'Số phút': p.totalMinutes
    };
  });

  const taskPieData = [
    { name: 'Đang chuẩn bị (Todo)', value: taskStats.todo, color: '#64748B' },
    { name: 'Đang học (In Progress)', value: taskStats.inProgress, color: '#3B82F6' },
    { name: 'Đã hoàn thành (Done)', value: taskStats.done, color: '#10B981' }
  ].filter(t => t.value > 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 min-h-screen text-slate-100">
      {/* Back Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
              <span>Học viên: {student.fullName}</span>
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">Mục tiêu: {student.learningGoal || 'Chưa thiết lập'}</p>
          </div>
        </div>

        {/* Global risk status */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-sm font-extrabold uppercase ${
          student.currentRiskScore > 70
            ? 'bg-rose-950/20 text-rose-400 border-rose-900/50'
            : student.currentRiskScore > 40
            ? 'bg-amber-950/20 text-amber-400 border-amber-900/50'
            : 'bg-emerald-950/20 text-emerald-400 border-emerald-900/50'
        }`}>
          <ShieldAlert className="w-5 h-5 animate-pulse" />
          <span>Điểm rủi ro: {student.currentRiskScore}%</span>
        </div>
      </div>

      {/* Grid: 3 Main Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Time */}
        <div className="bg-slate-900/30 border border-slate-850 p-5 rounded-3xl flex items-center gap-4 text-left">
          <div className="w-12 h-12 rounded-xl bg-blue-950/40 text-blue-500 flex items-center justify-center border border-blue-900/30 animate-spin-slow">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Thời gian học tích lũy</span>
            <h3 className="text-xl font-extrabold text-slate-250 mt-0.5">
              {parseFloat((student.totalFocusTime / 60).toFixed(1))} Giờ
            </h3>
          </div>
        </div>

        {/* Tasks Stats */}
        <div className="bg-slate-900/30 border border-slate-850 p-5 rounded-3xl flex items-center gap-4 text-left">
          <div className="w-12 h-12 rounded-xl bg-emerald-950/40 text-emerald-500 flex items-center justify-center border border-emerald-900/30">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Nhiệm vụ (Task)</span>
            <h3 className="text-xl font-extrabold text-slate-250 mt-0.5">
              {taskStats.done} / {taskStats.todo + taskStats.inProgress + taskStats.done} Đã xong
            </h3>
          </div>
        </div>

        {/* Status Category */}
        <div className="bg-slate-900/30 border border-slate-850 p-5 rounded-3xl flex items-center gap-4 text-left">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
            student.currentRiskScore > 70 ? 'bg-rose-950/40 text-rose-500 border-rose-900/30 animate-pulse' :
            student.currentRiskScore > 40 ? 'bg-amber-950/40 text-amber-500 border-amber-900/30' :
            'bg-emerald-950/40 text-emerald-500 border-emerald-900/30'
          }`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Trạng thái an toàn</span>
            <h3 className="text-xl font-extrabold text-slate-250 mt-0.5">
              {student.currentRiskScore > 70 ? 'Cảnh báo Nguy cơ' :
               student.currentRiskScore > 40 ? 'Cần cải thiện' : 'An toàn học thuật'}
            </h3>
          </div>
        </div>
      </div>

      {/* Grid: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Risk Trend Chart */}
        <div className="lg:col-span-8 bg-slate-900/30 border border-slate-850 p-6 rounded-3xl space-y-4">
          <h2 className="text-sm font-bold text-slate-350 flex items-center gap-2 uppercase tracking-wider">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span>Biến động điểm rủi ro học tập (Risk Score Trend)</span>
          </h2>
          <div className="h-64">
            {riskChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                Chưa có dữ liệu biến động rủi ro.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={riskChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="date" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', borderRadius: '12px' }} />
                  <Line type="monotone" dataKey="Rủi ro" stroke="#3B82F6" strokeWidth={3} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Task ratio / Pomodoro velocity */}
        <div className="lg:col-span-4 bg-slate-900/30 border border-slate-850 p-6 rounded-3xl flex flex-col justify-between space-y-4">
          <h2 className="text-sm font-bold text-slate-350 flex items-center gap-2 uppercase tracking-wider">
            <BarChart3 className="w-4 h-4 text-purple-500" />
            <span>Tỷ lệ hoàn thành nhiệm vụ</span>
          </h2>
          <div className="h-44 flex items-center justify-center relative">
            {taskPieData.length === 0 ? (
              <div className="text-slate-500 text-xs">Chưa khởi tạo nhiệm vụ.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {taskPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', borderRadius: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
            {/* Center label */}
            <div className="absolute flex flex-col items-center">
              <span className="text-xl font-extrabold text-white">
                {taskStats.done}
              </span>
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Done</span>
            </div>
          </div>
          
          {/* Legend Grid */}
          <div className="space-y-1.5 pt-2">
            {taskPieData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-400">{item.name}</span>
                </div>
                <span className="font-bold text-slate-200">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-slate-900">
        <button
          onClick={() => setActiveTab('bkt')}
          className={`px-6 py-3 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'bkt'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Độ phủ BKT (Mastery Level)
        </button>
        <button
          onClick={() => setActiveTab('quizzes')}
          className={`px-6 py-3 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'quizzes'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Lịch sử Quiz
        </button>
        <button
          onClick={() => setActiveTab('alert')}
          className={`px-6 py-3 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'alert'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Gửi cảnh báo học thuật
        </button>
      </div>

      {/* Tab Panels */}
      <div className="bg-slate-900/30 border border-slate-850 rounded-3xl p-6">
        {/* Tab 1: Bayesian Knowledge Tracing (BKT) Mastery */}
        {activeTab === 'bkt' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center pb-2 border-b border-slate-900">
              <h3 className="text-sm font-bold text-slate-300">Thông số BKT hiện tại của sinh viên</h3>
              <span className="text-[10px] text-slate-500">Heuristics optimized: $P(Learn)=0.4, P(Forget)=0.1, P(Guess)=0.2, P(Slip)=0.1$</span>
            </div>

            {skillMasteries.length === 0 ? (
              <p className="text-slate-500 text-xs py-8 text-center">Sinh viên chưa chọn kỹ năng học tập nào.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-900 text-slate-500">
                      <th className="py-3 font-bold uppercase tracking-wider">Kỹ năng (Skill)</th>
                      <th className="py-3 font-bold uppercase tracking-wider">Xác suất làm chủ (Mastery)</th>
                      <th className="py-3 font-bold uppercase tracking-wider text-center">P(Learn)</th>
                      <th className="py-3 font-bold uppercase tracking-wider text-center">P(Forget)</th>
                      <th className="py-3 font-bold uppercase tracking-wider text-center">P(Guess)</th>
                      <th className="py-3 font-bold uppercase tracking-wider text-center">P(Slip)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 text-slate-300">
                    {skillMasteries.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-900/10">
                        <td className="py-3.5 font-semibold text-slate-200">{m.skill.name}</td>
                        <td className="py-3.5 flex items-center gap-3">
                          <div className="w-32 bg-slate-950 h-2 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${m.masteryLevel > 0.7 ? 'bg-emerald-500' : m.masteryLevel > 0.4 ? 'bg-amber-500' : 'bg-rose-500'}`}
                              style={{ width: `${m.masteryLevel * 100}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold">{Math.round(m.masteryLevel * 100)}%</span>
                        </td>
                        <td className="py-3.5 text-center font-mono text-slate-450">{m.pLearn}</td>
                        <td className="py-3.5 text-center font-mono text-slate-450">{m.pForget}</td>
                        <td className="py-3.5 text-center font-mono text-slate-450">{m.pGuess}</td>
                        <td className="py-3.5 text-center font-mono text-slate-450">{m.pSlip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Quiz Attempts */}
        {activeTab === 'quizzes' && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-slate-350 pb-2 border-b border-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-500" />
              <span>Lịch sử nộp bài kiểm tra gần đây</span>
            </h3>

            {recentQuizAttempts.length === 0 ? (
              <p className="text-slate-500 text-xs py-8 text-center">Sinh viên chưa tham gia quiz nào.</p>
            ) : (
              <div className="space-y-3">
                {recentQuizAttempts.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 text-left">
                      <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-450 bg-emerald-950/40 px-2 py-0.5 rounded-full">
                        {attempt.question.skill.name}
                      </span>
                      <p className="text-slate-200 text-xs font-semibold leading-relaxed">
                        {attempt.question.question}
                      </p>
                      <span className="text-[10px] text-slate-500 block">
                        Ngày làm: {new Date(attempt.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-left md:text-right">
                        <span className="text-slate-500 text-[10px] block">Thời gian</span>
                        <span className="text-slate-300 text-xs font-mono">{attempt.timeSpentSec} giây</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                        attempt.isCorrect 
                          ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-900/50' 
                          : 'bg-rose-950/20 text-rose-400 border border-rose-900/50'
                      }`}>
                        {attempt.isCorrect ? 'Chính xác' : 'Sai'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Manual warning alerts dispatcher */}
        {activeTab === 'alert' && (
          <form onSubmit={handleSendManualAlert} className="space-y-6 max-w-xl text-left">
            <div className="space-y-1">
              <h3 className="text-slate-200 font-bold text-sm">Gửi tin nhắn cảnh báo học tập tức thì</h3>
              <p className="text-slate-550 text-[11px] leading-relaxed">
                Tin nhắn này sẽ được đẩy trực tiếp lên màn hình học tập của sinh viên qua WebSocket và ghi nhận vào lịch sử học tập.
              </p>
            </div>

            {/* Type selection */}
            <div className="space-y-2">
              <label className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Mức độ cảnh báo</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer bg-slate-950/50 px-4 py-2.5 rounded-xl border border-slate-850 text-xs">
                  <input
                    type="radio"
                    name="alertType"
                    value="YELLOW_WARNING"
                    checked={alertType === 'YELLOW_WARNING'}
                    onChange={() => setAlertType('YELLOW_WARNING')}
                    className="accent-amber-500"
                  />
                  <span className="text-amber-400 font-bold">⚠️ Cảnh báo vàng (Nhắc nhở nhẹ)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer bg-slate-950/50 px-4 py-2.5 rounded-xl border border-slate-850 text-xs">
                  <input
                    type="radio"
                    name="alertType"
                    value="RED_FLAG"
                    checked={alertType === 'RED_FLAG'}
                    onChange={() => setAlertType('RED_FLAG')}
                    className="accent-rose-500"
                  />
                  <span className="text-rose-455 font-bold">🚨 Cảnh báo đỏ (Nghiêm trọng)</span>
                </label>
              </div>
            </div>

            {/* Message input */}
            <div className="space-y-2">
              <label className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Nội dung cảnh báo</label>
              <textarea
                rows={4}
                value={alertMessage}
                onChange={(e) => setAlertMessage(e.target.value)}
                placeholder="Nhập nội dung cảnh báo chi tiết gửi sinh viên (ví dụ: Bạn đang có 3 task trễ hạn deadline, hãy hoàn thiện hoặc trao đổi trực tiếp với Mentor)..."
                className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-slate-200 text-xs focus:outline-none focus:border-emerald-500/50 transition-all placeholder-slate-700"
              />
            </div>

            <Button
              type="submit"
              disabled={isSendingAlert}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 text-xs"
            >
              {isSendingAlert ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Đang gửi...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Gửi tin nhắn cảnh báo</span>
                </>
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
