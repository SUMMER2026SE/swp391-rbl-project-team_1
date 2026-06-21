'use client';

import React from 'react';
import { Task, Difficulty } from '../../types';
import { Calendar, Clock, Zap, MoreVertical, Play, CheckCircle } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  compact?: boolean;
  onStatusChange?: (id: string, status: 'TODO' | 'IN_PROGRESS' | 'DONE') => void;
  onEdit?: (task: Task) => void;
  onDelete?: (id: string) => void;
  onStartPomodoro?: (task: Task) => void;
  onTakeQuiz?: (skillId: string) => void;
}

export function TaskCard({
  task,
  compact = false,
  onStatusChange,
  onEdit,
  onDelete,
  onStartPomodoro,
  onTakeQuiz
}: TaskCardProps) {
  // Determine color matching for difficulty
  const difficultyColors = {
    EASY: 'bg-emerald-500/10 text-emerald-400 border-emerald-950/50',
    MEDIUM: 'bg-amber-500/10 text-amber-400 border-amber-950/50',
    HARD: 'bg-orange-500/10 text-orange-400 border-orange-950/50',
    EXPERT: 'bg-rose-500/10 text-rose-400 border-rose-950/50'
  };

  // Remaining days formatted
  const getDeadlineText = () => {
    if (!task.deadline) return null;
    const diffTime = new Date(task.deadline).getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return <span className="text-rose-400 font-bold animate-pulse-slow">Hết hạn</span>;
    }
    if (diffDays === 0) {
      return <span className="text-rose-400 font-bold animate-pulse-slow">Hạn hôm nay</span>;
    }
    return <span className="text-slate-400">Còn {diffDays} ngày</span>;
  };

  return (
    <div
      className={`bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700/80 hover:bg-slate-900/80 transition-all duration-300 group flex flex-col justify-between ${
        compact ? 'gap-3' : 'min-h-[160px] gap-4'
      }`}
    >
      {/* Title & Actions */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[10px] bg-slate-950 text-blue-400 font-extrabold uppercase tracking-widest px-2 py-0.5 rounded border border-slate-900 mb-1.5 inline-block">
            {task.skill.name}
          </span>
          <h4 className="text-slate-100 font-bold text-sm tracking-wide leading-snug group-hover:text-white transition-colors truncate sm:normal-case sm:truncate-none">
            {task.title}
          </h4>
          {task.description && !compact && (
            <p className="text-slate-500 text-xs mt-1 line-clamp-2">
              {task.description}
            </p>
          )}
        </div>

        {/* Dropdown Menu trigger (Simple representation) */}
        {!compact && (onEdit || onDelete) && (
          <div className="relative group/menu">
            <button className="p-1 rounded-lg text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors">
              <MoreVertical className="w-4.5 h-4.5" />
            </button>
            
            {/* Popover action list */}
            <div className="absolute right-0 mt-1 w-36 bg-slate-950 border border-slate-800 rounded-xl shadow-xl overflow-hidden hidden group-hover/menu:block z-20">
              {onEdit && (
                <button
                  onClick={() => onEdit(task)}
                  className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-slate-100 transition-colors"
                >
                  Sửa Task
                </button>
              )}
              {onStartPomodoro && task.status !== 'DONE' && (
                <button
                  onClick={() => onStartPomodoro(task)}
                  className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-slate-100 transition-colors"
                >
                  Tập trung
                </button>
              )}
              {onStatusChange && task.status !== 'DONE' && (
                <button
                  onClick={() => onStatusChange(task.id, 'DONE')}
                  className="w-full px-4 py-2 text-left text-xs font-semibold text-emerald-400 hover:bg-emerald-950/20 transition-colors"
                >
                  Hoàn thành
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(task.id)}
                  className="w-full px-4 py-2 text-left text-xs font-semibold text-rose-400 hover:bg-rose-950/20 transition-colors"
                >
                  Xóa Task
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Metadata Indicators */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/60 pt-3.5 mt-auto">
        <div className="flex items-center gap-3">
          {/* Difficulty Badge */}
          <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full ${difficultyColors[task.difficulty]}`}>
            {task.difficulty}
          </span>

          {/* Time Estimate */}
          <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{task.estimatedMinutes}m</span>
          </span>

          {/* Deadline */}
          {task.deadline && (
            <span className="text-[10px] font-semibold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-600" />
              {getDeadlineText()}
            </span>
          )}
        </div>

        {/* Priority Score Zap Badge & Quiz Button */}
        <div className="flex items-center gap-2">
          {onTakeQuiz && (
            <button
              onClick={() => onTakeQuiz(task.skillId)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold shadow-lg shadow-blue-500/20 transition-colors"
            >
              Làm bài Test
            </button>
          )}
          {task.priorityScore !== undefined && (
            <div
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-950/20 text-blue-400 border border-blue-900/30 text-xs font-black select-none"
              title="Độ ưu tiên được tính toán bởi thuật toán Priority Scheduler"
            >
              <Zap className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />
              <span>⚡ {task.priorityScore.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TaskCard;
