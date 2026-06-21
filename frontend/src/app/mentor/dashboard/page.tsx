'use client';

import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import useSocket from '@/hooks/useSocket';
import { Button } from '@/components/common/Button';
import { 
  Users, AlertOctagon, ShieldAlert, Award, 
  TrendingUp, Clock, Mail, Search, ChevronRight, X, Sparkles, MessageCircleWarning
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface StudentRow {
  id: string;
  fullName: string;
  email: string;
  learningGoal: string | null;
  totalFocusTime: number;
  currentRiskScore: number;
}

interface MentorStats {
  totalStudents: number;
  redFlagsCount: number;
  avgRiskScore: number;
  completedTasksCount: number;
}

interface SocketAlert {
  id: string;
  studentId: string;
  studentName: string;
  riskScore: number;
  message: string;
  timestamp: string;
}

export default function MentorDashboard() {
  const { isConnected, on, off } = useSocket();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [stats, setStats] = useState<MentorStats>({
    totalStudents: 0,
    redFlagsCount: 0,
    avgRiskScore: 0,
    completedTasksCount: 0
  });
  const [alerts, setAlerts] = useState<SocketAlert[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch initial dashboard stats & students list
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Listen to Socket.IO red-flag-alert event
  useEffect(() => {
    const handleRedFlagAlert = (data: any) => {
      const newAlert: SocketAlert = {
        id: Math.random().toString(),
        studentId: data.studentId,
        studentName: data.studentName,
        riskScore: data.riskScore,
        message: data.message,
        timestamp: data.timestamp || new Date().toISOString()
      };
      // Prepend to alerts
      setAlerts(prev => [newAlert, ...prev]);
      
      // Update local count of red flags
      setStats(prev => ({
        ...prev,
        redFlagsCount: prev.redFlagsCount + 1
      }));

      // Update student's risk locally in list
      setStudents(prev => 
        prev.map(s => s.id === data.studentId ? { ...s, currentRiskScore: data.riskScore } : s)
      );

      toast(`🚨 Cảnh báo mới: Học viên ${data.studentName} có nguy cơ bỏ cuộc / chệch lộ trình (Rủi ro: ${data.riskScore}%)!`, {
        icon: '⚠️',
        duration: 5000,
        style: {
          background: '#991B1B',
          color: '#FEE2E2',
          border: '1px solid #7F1D1D'
        }
      });
    };

    on('red-flag-alert', handleRedFlagAlert);

    return () => {
      off('red-flag-alert', handleRedFlagAlert);
    };
  }, [on, off]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch overview stats
      const statsRes = await api.get('/mentor/stats/overview');
      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
      }

      // Fetch students list
      const studentsRes = await api.get('/mentor/students');
      if (studentsRes.data.success) {
        setStudents(studentsRes.data.students);
      }

      // Fetch pre-existing red-flags from DB
      const redFlagsRes = await api.get('/mentor/red-flags');
      if (redFlagsRes.data.success && redFlagsRes.data.redFlags) {
        const loadedAlerts: SocketAlert[] = redFlagsRes.data.redFlags.map((rf: any) => ({
          id: rf.id,
          studentId: rf.id,
          studentName: rf.fullName,
          riskScore: rf.riskScore,
          message: `⚠️ Học viên ${rf.fullName} có nguy cơ trì trệ / bỏ cuộc trên lộ trình kỹ năng (${rf.riskScore}%)`,
          timestamp: new Date().toISOString()
        }));
        setAlerts(loadedAlerts);
      }
    } catch (_) {
      toast.error('Không thể kết xuất dữ liệu quản lý.');
    } finally {
      setIsLoading(false);
    }
  };

  const dismissAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  // Filter students based on search
  const filteredStudents = students.filter(student =>
    student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (student.learningGoal && student.learningGoal.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 min-h-screen text-slate-100">
      {/* Header Row */}
      <div className="border-b border-slate-900 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
            Không gian kiểm soát Mentor
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Theo dõi, định lượng rủi ro học tập bằng AI và hỗ trợ sinh viên FPT kịp thời.
          </p>
        </div>

        {/* Real-time status */}
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold select-none border transition-all duration-300 ${
          isConnected
            ? 'bg-emerald-950/20 text-emerald-450 border-emerald-900/50'
            : 'bg-rose-950/20 text-rose-450 border-rose-900/50 animate-pulse'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          <span>{isConnected ? 'Realtime Connected' : 'Disconnected'}</span>
        </div>
      </div>

      {/* Grid Stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-900/40 rounded-2xl border border-slate-800" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-950/40 text-blue-500 flex items-center justify-center border border-blue-900/30">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Học viên quản lý</span>
              <h3 className="text-xl font-extrabold text-slate-200 mt-0.5">{stats.totalStudents}</h3>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-2xl flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
              stats.redFlagsCount > 0 
                ? 'bg-rose-950/40 text-rose-500 border-rose-900/30 animate-pulse' 
                : 'bg-slate-950/40 text-slate-500 border-slate-900/30'
            }`}>
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Trường hợp cảnh báo đỏ</span>
              <h3 className="text-xl font-extrabold text-slate-200 mt-0.5">{stats.redFlagsCount}</h3>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-950/40 text-emerald-500 flex items-center justify-center border border-emerald-900/30">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Mức rủi ro trung bình</span>
              <h3 className="text-xl font-extrabold text-slate-200 mt-0.5">{stats.avgRiskScore}%</h3>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-950/40 text-purple-500 flex items-center justify-center border border-purple-900/30">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Nhiệm vụ hoàn thành</span>
              <h3 className="text-xl font-extrabold text-slate-200 mt-0.5">{stats.completedTasksCount} Tasks</h3>
            </div>
          </div>
        </div>
      )}

      {/* Socket Notification Alerts Feed */}
      {alerts.length > 0 && (
        <div className="bg-rose-950/10 border border-rose-900/30 rounded-3xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
            <MessageCircleWarning className="w-5 h-5 text-rose-500 animate-bounce" />
            <span>CẢNH BÁO ĐỎ — HỌC VIÊN CÓ NGUY CƠ BỎ CUỘC (REALTIME)</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alerts.map((alert) => (
              <div 
                key={alert.id} 
                className="bg-slate-950/60 border border-rose-950/40 p-4 rounded-2xl flex items-center justify-between gap-4 hover:border-rose-900/30 transition-colors group"
              >
                <div className="space-y-1 text-left">
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-rose-500 bg-rose-950/20 px-2 py-0.5 rounded-full">
                    Rủi ro: {alert.riskScore}%
                  </span>
                  <p className="text-slate-250 text-xs font-semibold mt-1">
                    {alert.studentName}
                  </p>
                  <p className="text-slate-500 text-[10px] leading-relaxed max-w-sm line-clamp-1">
                    {alert.message}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Link href={`/mentor/students/${alert.studentId}`}>
                    <Button className="bg-slate-900 hover:bg-rose-900 hover:text-white transition-all duration-350 text-[10px] font-bold py-1.5 px-3 rounded-lg border border-slate-800">
                      Chi tiết
                    </Button>
                  </Link>
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="p-1 rounded-md text-slate-500 hover:bg-slate-900 hover:text-slate-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Supervised Students List */}
      <div className="bg-slate-900/30 border border-slate-850 rounded-3xl p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-900">
          <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-500" />
            <span>Sinh viên phụ trách học thuật</span>
          </h2>

          {/* Search box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm tên, mục tiêu học tập..."
              className="w-full bg-slate-950 border border-slate-850 pl-10 pr-4 py-2.5 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-emerald-500/50 transition-all placeholder-slate-700"
            />
          </div>
        </div>

        {/* Students list */}
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm">
            Không tìm thấy sinh viên phụ trách nào khớp với bộ lọc.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredStudents.map((std) => (
              <div
                key={std.id}
                className="bg-slate-950/40 border border-slate-900 p-5 rounded-2xl flex flex-col justify-between hover:border-emerald-500/30 transition-all duration-300 group"
              >
                <div className="space-y-4">
                  {/* Student Title / Risk badge */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                        {std.fullName.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="text-left">
                        <h3 className="text-slate-200 font-bold text-sm group-hover:text-emerald-450 transition-colors">
                          {std.fullName}
                        </h3>
                        <p className="text-slate-500 text-[10px] flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" />
                          <span>{std.email}</span>
                        </p>
                      </div>
                    </div>

                    {/* Risk indicator badge */}
                    <div className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                      std.currentRiskScore > 70
                        ? 'bg-rose-950/20 text-rose-400 border-rose-900/50 animate-pulse'
                        : std.currentRiskScore > 40
                        ? 'bg-amber-950/20 text-amber-400 border-amber-900/50'
                        : 'bg-emerald-950/20 text-emerald-400 border-emerald-900/50'
                    }`}>
                      Rủi ro: {std.currentRiskScore}%
                    </div>
                  </div>

                  {/* Goal & Study Hours */}
                  <div className="space-y-2 text-left">
                    <div className="text-[10px] font-medium text-slate-500">
                      Mục tiêu: <span className="text-slate-350">{std.learningGoal || 'Chưa thiết lập mục tiêu'}</span>
                    </div>
                    
                    {/* Progress Bar of Risk */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>Độ bền lộ trình (Stability Score)</span>
                        <span className="font-semibold">{100 - std.currentRiskScore}%</span>
                      </div>
                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            std.currentRiskScore > 70 ? 'bg-rose-600' :
                            std.currentRiskScore > 40 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${100 - std.currentRiskScore}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer details link */}
                <div className="pt-4 mt-4 border-t border-slate-900/80 flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Clock className="w-4 h-4 text-slate-650" />
                    <span>Tích lũy: {parseFloat((std.totalFocusTime / 60).toFixed(1))}h học</span>
                  </span>
                  
                  <Link href={`/mentor/students/${std.id}`}>
                    <Button className="bg-slate-900 hover:bg-emerald-600 hover:text-white transition-all text-xs font-bold py-1.5 px-4 rounded-xl border border-slate-800 flex items-center gap-1 group-hover:border-emerald-500/20">
                      <span>Theo dõi chi tiết</span>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
