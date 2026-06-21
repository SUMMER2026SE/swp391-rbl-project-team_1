'use client';

import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { 
  Users, Activity, FileCheck2, ShieldAlert,
  Server, Cpu, ShieldCheck, PieChart as PieIcon,
  HardDrive, Database, ShieldAlert as WarningIcon
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import toast from 'react-hot-toast';

interface SystemStats {
  totalUsers: number;
  activeToday: number;
  totalQuizAttempts: number;
  avgRiskScore: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // System Health state mock values
  const systemHealth = {
    cpu: 18,
    memory: 42,
    disk: 55,
    dbConnections: 12
  };

  useEffect(() => {
    fetchSystemStats();
  }, []);

  const fetchSystemStats = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/admin/stats');
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (_) {
      toast.error('Không thể tải thống kê hệ thống.');
    } finally {
      setIsLoading(false);
    }
  };

  // Activity Mock Data for charts
  const activityData = [
    { hour: '08:00', 'Tải hệ thống': 10, 'Yêu cầu API': 120 },
    { hour: '10:00', 'Tải hệ thống': 35, 'Yêu cầu API': 350 },
    { hour: '12:00', 'Tải hệ thống': 25, 'Yêu cầu API': 280 },
    { hour: '14:00', 'Tải hệ thống': 55, 'Yêu cầu API': 610 },
    { hour: '16:00', 'Tải hệ thống': 80, 'Yêu cầu API': 980 },
    { hour: '18:00', 'Tải hệ thống': 45, 'Yêu cầu API': 410 },
    { hour: '20:00', 'Tải hệ thống': 70, 'Yêu cầu API': 830 },
  ];

  if (isLoading || !stats) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 min-h-screen text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-900 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
            Giám sát Hệ thống Admin
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Quản trị hoạt động, theo dõi hiệu năng hệ thống EduPath.
          </p>
        </div>

        {/* Global status badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/20 text-emerald-400 border border-emerald-900/50">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Hệ thống hoạt động bình thường</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 text-left">
          <div className="w-12 h-12 rounded-xl bg-purple-950/40 text-purple-500 flex items-center justify-center border border-purple-900/30">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Tổng người dùng</span>
            <h3 className="text-xl font-extrabold text-slate-200 mt-0.5">{stats.totalUsers}</h3>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 text-left">
          <div className="w-12 h-12 rounded-xl bg-blue-950/40 text-blue-500 flex items-center justify-center border border-blue-900/30">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Hoạt động hôm nay</span>
            <h3 className="text-xl font-extrabold text-slate-200 mt-0.5">{stats.activeToday}</h3>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 text-left">
          <div className="w-12 h-12 rounded-xl bg-emerald-950/40 text-emerald-500 flex items-center justify-center border border-emerald-900/30">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Lượt làm Quiz</span>
            <h3 className="text-xl font-extrabold text-slate-200 mt-0.5">{stats.totalQuizAttempts}</h3>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 text-left">
          <div className="w-12 h-12 rounded-xl bg-rose-950/40 text-rose-500 flex items-center justify-center border border-rose-900/30">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Rủi ro trung bình</span>
            <h3 className="text-xl font-extrabold text-slate-200 mt-0.5">{stats.avgRiskScore}%</h3>
          </div>
        </div>
      </div>

      {/* Grid: Health indicators & System charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* API load chart */}
        <div className="lg:col-span-8 bg-slate-900/30 border border-slate-850 p-6 rounded-3xl space-y-4">
          <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2 uppercase tracking-wider text-left">
            <Activity className="w-4 h-4 text-purple-500" />
            <span>Phân tích tải API mạng</span>
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="colorApi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="hour" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="Yêu cầu API" stroke="#8B5CF6" strokeWidth={2} fillOpacity={1} fill="url(#colorApi)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System Health Monitor */}
        <div className="lg:col-span-4 bg-slate-900/30 border border-slate-850 p-6 rounded-3xl space-y-5 text-left">
          <h2 className="text-sm font-bold text-slate-350 flex items-center gap-2 uppercase tracking-wider">
            <Server className="w-4 h-4 text-blue-500" />
            <span>Tài nguyên Máy chủ (VPS)</span>
          </h2>

          <div className="space-y-4">
            {/* CPU */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-slate-500" /> CPU Load
                </span>
                <span className="text-slate-200">{systemHealth.cpu}%</span>
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${systemHealth.cpu}%` }} />
              </div>
            </div>

            {/* Memory */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-slate-500" /> RAM Memory
                </span>
                <span className="text-slate-200">{systemHealth.memory}%</span>
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${systemHealth.memory}%` }} />
              </div>
            </div>

            {/* Disk */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-slate-500" /> Ổ đĩa SSD
                </span>
                <span className="text-slate-200">{systemHealth.disk}%</span>
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${systemHealth.disk}%` }} />
              </div>
            </div>

            {/* Database Connections */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-slate-500" /> DB Pool Active
                </span>
                <span className="text-slate-200">{systemHealth.dbConnections} / 50</span>
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(systemHealth.dbConnections / 50) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
