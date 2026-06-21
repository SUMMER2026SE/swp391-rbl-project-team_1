'use client';

import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { Search, ChevronRight, Mail, Clock, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/common/Button';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { handleError } from '@/utils/errorHandler';

interface StudentRow {
  id: string;
  fullName: string;
  email: string;
  learningGoal: string | null;
  totalFocusTime: number;
  currentRiskScore: number;
}

export default function SupervisedStudents() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/mentor/students');
      if (response.data.success) {
        setStudents(response.data.students);
      }
    } catch (_) {
      handleError('Không thể kết xuất danh sách học viên.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (student.learningGoal && student.learningGoal.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 min-h-screen text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-900 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
            Danh sách học viên quản lý
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Tổng quan tất cả sinh viên được phân bổ dưới sự quản lý học thuật của bạn.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm sinh viên, mục tiêu..."
            className="w-full bg-slate-950 border border-slate-850 pl-10 pr-4 py-2.5 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-emerald-500/50 transition-all placeholder-slate-700"
          />
        </div>
      </div>

      {/* Grid List */}
      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="py-20 bg-slate-900/20 border border-slate-800 rounded-3xl text-center text-slate-500">
          Không tìm thấy sinh viên nào.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((std) => (
            <div
              key={std.id}
              className="bg-slate-900/30 border border-slate-850 p-6 rounded-3xl flex flex-col justify-between hover:border-emerald-500/30 transition-all duration-300 group"
            >
              <div className="space-y-4">
                {/* Header info */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                      {std.fullName.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <h3 className="text-slate-200 font-bold text-sm group-hover:text-emerald-455 transition-colors">
                        {std.fullName}
                      </h3>
                      <p className="text-slate-500 text-[10px] flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3" />
                        <span className="truncate max-w-[120px]">{std.email}</span>
                      </p>
                    </div>
                  </div>

                  <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    std.currentRiskScore > 70
                      ? 'bg-rose-950/20 text-rose-455 border-rose-900/50'
                      : std.currentRiskScore > 40
                      ? 'bg-amber-950/20 text-amber-455 border-amber-900/50'
                      : 'bg-emerald-950/20 text-emerald-455 border-emerald-900/50'
                  }`}>
                    Risk: {std.currentRiskScore}%
                  </div>
                </div>

                {/* Progress & Goal */}
                <div className="space-y-3 text-left">
                  <div className="text-[10px] text-slate-400 font-medium">
                    <span className="text-slate-500 block uppercase font-bold text-[8px] tracking-wider mb-0.5">Mục tiêu cá nhân</span>
                    <p className="line-clamp-2 leading-relaxed bg-slate-950/40 p-2 rounded-lg border border-slate-850/50">
                      {std.learningGoal || 'Chưa định hướng mục tiêu học tập.'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] text-slate-500">
                      <span>Tiến độ học tập an toàn</span>
                      <span>{100 - std.currentRiskScore}%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
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

              {/* Footer CTA */}
              <div className="pt-4 mt-6 border-t border-slate-900 flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-650" />
                  <span>{parseFloat((std.totalFocusTime / 60).toFixed(1))} giờ tự học</span>
                </span>

                <Link href={`/mentor/students/${std.id}`}>
                  <Button className="bg-slate-950 hover:bg-emerald-600 hover:text-white transition-all text-[11px] font-bold py-1.5 px-3 rounded-xl border border-slate-800 flex items-center gap-1">
                    <span>Xem chi tiết</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
