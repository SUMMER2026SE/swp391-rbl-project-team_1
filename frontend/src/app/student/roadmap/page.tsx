'use client';

import React, { useState, useEffect } from 'react';
import useAuth from '../../../hooks/useAuth';
import api from '../../../services/api';
import { Task } from '../../../types';
import Button from '../../../components/common/Button';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import {
  Sparkles,
  Printer,
  Calendar as CalendarIcon,
  CheckCircle,
  Clock,
  Compass,
  Star,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import toast from 'react-hot-toast';

import { useRouter } from 'next/navigation';

export default function RoadmapPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  // Component states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [progress, setProgress] = useState<{ completed: number; total: number; percent: number }>({
    completed: 0,
    total: 0,
    percent: 0
  });

  // Toggle views
  const [viewMode, setViewMode] = useState<'timeline' | 'calendar'>('timeline');
  
  // Toggle individual skill details inside timeline
  const [expandedSkillId, setExpandedSkillId] = useState<string | null>(null);

  useEffect(() => {
    loadRoadmap();
  }, [user]);

  const loadRoadmap = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/roadmap');
      if (response.data.success) {
        setTasks(response.data.tasks);
        setProgress(response.data.progress || { completed: 0, total: 0, percent: 0 });
      }
    } catch (_) {
      toast.error('Lỗi khi tải thông tin lộ trình.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateRoadmap = async () => {
    if (!window.confirm('Lộ trình cũ sẽ được sắp xếp lại dựa trên mức độ thành thạo và thời hạn chót mới của bạn. Tiếp tục?')) return;
    
    try {
      setIsRegenerating(true);
      toast.loading('AI đang phân tích và tái thiết kế lộ trình học tập...', { id: 'regenerate' });
      
      const response = await api.post('/roadmap/generate');
      if (response.data.success) {
        toast.success('Đã làm mới lộ trình học tập thành công! 🎉', { id: 'regenerate' });
        loadRoadmap();
      }
    } catch (_) {
      toast.error('AI thiết lập lộ trình học tập thất bại.', { id: 'regenerate' });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  // Group tasks by skill for hierarchical display in timeline
  const groupedTasks: { [key: string]: { skillName: string; tasks: Task[]; masteryLevel: number } } = {};
  
  tasks.forEach((t) => {
    if (!groupedTasks[t.skillId]) {
      groupedTasks[t.skillId] = {
        skillName: t.skill.name,
        tasks: [],
        masteryLevel: (t as any).masteryLevel || 0.3
      };
    }
    groupedTasks[t.skillId].tasks.push(t);
  });

  const skillsList = Object.keys(groupedTasks).map((id) => ({
    id,
    ...groupedTasks[id]
  }));

  // Calendar View helper variables
  const daysInMonth = 28; // 4 weeks representation
  const calendarGrid = Array(daysInMonth).fill(null);

  // Distribute tasks onto calendar grid based on deadline offsets
  tasks.forEach((t) => {
    if (t.deadline) {
      const diffTime = new Date(t.deadline).getTime() - new Date().getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < daysInMonth) {
        if (!calendarGrid[diffDays]) calendarGrid[diffDays] = [];
        calendarGrid[diffDays].push(t);
      }
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans">
      
      {/* HEADER SECTION */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative select-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1 space-y-3">
            <h2 className="text-slate-100 font-bold text-lg flex items-center gap-2">
              <Compass className="w-5 h-5 text-blue-500 animate-spin-slow" />
              <span>Lộ Trình Học Tập Thích Ứng Cá Nhân</span>
            </h2>
            
            {/* Progress Bar */}
            <div className="space-y-1.5 max-w-md">
              <div className="flex justify-between text-xs font-bold text-slate-500 uppercase">
                <span>Tiến độ hoàn thành</span>
                <span>{progress.completed}/{progress.total} Tasks ({progress.percent}%)</span>
              </div>
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode(viewMode === 'timeline' ? 'calendar' : 'timeline')}
              className="p-3 border border-slate-800 text-slate-400 hover:text-slate-200 bg-slate-950/20 hover:bg-slate-800 rounded-xl transition-all active:scale-95 text-xs font-bold flex items-center gap-2"
            >
              <CalendarIcon className="w-4 h-4 text-blue-400" />
              <span>{viewMode === 'timeline' ? 'Xem Lịch' : 'Xem Timeline'}</span>
            </button>

            <button
              onClick={handleExportPDF}
              className="p-3 border border-slate-800 text-slate-400 hover:text-slate-200 bg-slate-950/20 hover:bg-slate-800 rounded-xl transition-all active:scale-95 text-xs font-bold flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Xuất PDF</span>
            </button>

            <Button
              variant="primary"
              className="text-xs font-bold flex items-center gap-2"
              onClick={handleRegenerateRoadmap}
              disabled={isRegenerating}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tạo Lại Lộ Trình</span>
            </Button>
          </div>
        </div>
      </div>

      {isRegenerating ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-sm font-semibold select-none">
          <LoadingSpinner size="lg" />
          <p className="mt-4">AI đang phân tích BKT mastery và tái lập tiến độ...</p>
        </div>
      ) : viewMode === 'timeline' ? (
        /* TIMELINE VIEW */
        <div className="space-y-6 relative pl-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800 select-none">
          {skillsList.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm font-semibold border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
              Không có task nào trong lộ trình hiện tại.
            </div>
          ) : (
            skillsList.map((skill, idx) => {
              const isExpanded = expandedSkillId === skill.id;
              const isMastered = skill.masteryLevel >= 0.8;
              
              // Color mapping for timeline nodes
              let nodeStyle = 'border-slate-800 bg-slate-950 text-slate-500';
              if (idx === 0) nodeStyle = 'border-blue-500 bg-blue-950 text-blue-400 shadow-lg shadow-blue-500/20 ring-4 ring-blue-500/10 animate-pulse-slow';
              if (isMastered) nodeStyle = 'border-emerald-500 bg-emerald-950 text-emerald-400';

              return (
                <div key={skill.id} className="relative group/timeline">
                  {/* Timeline Dot Indicator */}
                  <div className={`absolute -left-[27px] top-4 w-6 h-6 rounded-full border-2 flex items-center justify-center font-bold text-[10px] z-10 ${nodeStyle}`}>
                    {isMastered ? '✓' : idx + 1}
                  </div>

                  {/* Skill Card */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700/80 transition-all duration-300">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2.5">
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-slate-100 font-bold text-sm tracking-wide">
                            {skill.skillName}
                          </h3>
                          {isMastered && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/20 text-emerald-400 border border-emerald-900/30 text-[9px] font-black uppercase">
                              <Star className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                              <span>Thành thạo</span>
                            </span>
                          )}
                        </div>

                        {/* Mastery level progress */}
                        <div className="flex items-center gap-3 max-w-sm">
                          <div className="h-1.5 flex-1 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ${
                                isMastered ? 'bg-emerald-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${Math.round(skill.masteryLevel * 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-500 font-extrabold uppercase">
                            {Math.round(skill.masteryLevel * 100)}%
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); router.push('/student/quiz/' + skill.id); }}
                          className="px-3 py-1.5 border border-blue-600 bg-blue-600/20 hover:bg-blue-600 hover:text-white text-blue-400 rounded-xl transition-all font-bold text-xs shadow-lg shadow-blue-500/10 flex items-center gap-1.5"
                        >
                          Làm bài Test
                        </button>
                        <button
                          onClick={() => setExpandedSkillId(isExpanded ? null : skill.id)}
                          className="p-2 border border-slate-800 bg-slate-950/20 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl transition-all"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Task Checklist expansion */}
                    {isExpanded && (
                      <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-2.5 animate-slide-down">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2.5">Danh sách các bài học</span>
                        {skill.tasks.map((task) => (
                          <div
                            key={task.id}
                            className={`flex items-center justify-between p-3.5 rounded-xl border text-xs font-semibold ${
                              task.status === 'DONE'
                                ? 'bg-emerald-950/5 border-emerald-950/50 text-slate-500'
                                : task.status === 'IN_PROGRESS'
                                ? 'bg-blue-950/5 border-blue-950/40 text-slate-200'
                                : 'bg-slate-950/30 border-slate-900 text-slate-400'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-sm">
                                {task.status === 'DONE' ? '✅' : task.status === 'IN_PROGRESS' ? '🔵' : '⚪'}
                              </span>
                              <span className="truncate leading-none">{task.title}</span>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] font-bold">
                              <span className="text-slate-500 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{task.estimatedMinutes}m</span>
                              </span>
                              <span className={`px-2 py-0.5 rounded-full uppercase text-[9px] ${
                                task.status === 'DONE' ? 'bg-emerald-950/30 text-emerald-400' :
                                task.status === 'IN_PROGRESS' ? 'bg-blue-950/30 text-blue-400' :
                                'bg-slate-800 text-slate-500'
                              }`}>
                                {task.status === 'DONE' ? 'Xong' : task.status === 'IN_PROGRESS' ? 'Đang Làm' : 'Chờ'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* CALENDAR GRID VIEW */
        <div className="space-y-4 select-none">
          <div className="grid grid-cols-7 gap-2 border border-slate-800 rounded-3xl p-5 bg-slate-900/20">
            {/* Weekday headers */}
            {['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'].map(day => (
              <span key={day} className="text-center text-[10px] text-slate-500 font-extrabold uppercase tracking-wider pb-2 border-b border-slate-800/80">
                {day}
              </span>
            ))}

            {/* Calendar grid cells */}
            {calendarGrid.map((dayTasks, idx) => {
              const hasTasks = dayTasks && dayTasks.length > 0;
              return (
                <div
                  key={idx}
                  className={`min-h-[72px] border rounded-xl p-2 flex flex-col justify-between transition-colors ${
                    hasTasks
                      ? 'border-blue-900/50 bg-blue-950/5'
                      : 'border-slate-800/50 bg-slate-950/40 hover:bg-slate-900/20'
                  }`}
                >
                  <span className={`text-[10px] font-bold ${hasTasks ? 'text-blue-400' : 'text-slate-600'}`}>
                    Ngày {idx + 1}
                  </span>
                  
                  {/* Task counts or indicators inside calendar cells */}
                  {hasTasks && (
                    <div className="flex flex-col gap-1 mt-1">
                      {dayTasks.map((t: Task) => (
                        <span
                          key={t.id}
                          className="px-1.5 py-0.5 rounded bg-blue-600/20 border border-blue-900/30 text-[8px] font-bold text-blue-300 truncate block"
                          title={t.title}
                        >
                          {t.title}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-4 select-none">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-800" />
              <span>Không có Task</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <span>Có Task hoàn thành</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
