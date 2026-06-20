'use client';

import React, { useState, useEffect } from 'react';
import useAuth from '../../../hooks/useAuth';
import api from '../../../services/api';
import { Task, Skill, Difficulty } from '../../../types';
import Button from '../../../components/common/Button';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import Input from '../../../components/common/Input';
import Modal from '../../../components/common/Modal';
import {
  Sparkles,
  Printer,
  Calendar as CalendarIcon,
  Compass,
  Star,
  Plus,
  Clock,
  Trash2,
  Edit2,
  GripVertical
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

  const [skills, setSkills] = useState<Skill[]>([]);

  // Toggle views
  const [viewMode, setViewMode] = useState<'timeline' | 'calendar'>('timeline');
  
  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formSkillId, setFormSkillId] = useState<string>('');
  const [formDifficulty, setFormDifficulty] = useState<Difficulty>('EASY');
  const [formDeadline, setFormDeadline] = useState<string>('');
  const [formEstimatedMinutes, setFormEstimatedMinutes] = useState<number>(25);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    })
  );

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [roadmapRes, skillsRes] = await Promise.all([
        api.get('/roadmap'),
        api.get('/auth/skills')
      ]);

      if (roadmapRes.data.success) {
        setTasks(roadmapRes.data.tasks);
        setProgress(roadmapRes.data.progress || { completed: 0, total: 0, percent: 0 });
      }

      if (skillsRes.data.success) {
        const flatList: Skill[] = [];
        skillsRes.data.skills.forEach((parent: Skill) => {
          if (parent.children) {
            flatList.push(...parent.children);
          } else {
            flatList.push(parent);
          }
        });
        setSkills(flatList);
      }
    } catch (_) {
      toast.error('Lỗi khi tải thông tin lộ trình.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateRoadmap = async () => {
    const hasManualOverrides = tasks.some(t => (t as any).isManualOverride);
    const msg = hasManualOverrides 
      ? 'Một số bước bạn đã tự chỉnh sẽ được giữ nguyên, nhưng các bước do AI tạo có thể bị AI sắp xếp lại dựa trên tiến độ mới. Tiếp tục?' 
      : 'Lộ trình cũ sẽ được AI sắp xếp lại dựa trên mức độ thành thạo và thời hạn chót mới của bạn. Tiếp tục?';
    
    if (!window.confirm(msg)) return;
    
    try {
      setIsRegenerating(true);
      toast.loading('AI đang phân tích và tái thiết kế lộ trình học tập...', { id: 'regenerate' });
      
      const response = await api.post('/roadmap/generate');
      if (response.data.success) {
        toast.success('Đã làm mới lộ trình học tập thành công! 🎉', { id: 'regenerate' });
        loadData();
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = tasks.findIndex((t) => t.id === active.id);
    const newIndex = tasks.findIndex((t) => t.id === over.id);

    const newTasks = arrayMove(tasks, oldIndex, newIndex);
    setTasks(newTasks);

    const taskIds = newTasks.map((t) => t.id);

    try {
      await api.put('/roadmap/reorder', { taskIds });
      toast.success('Đã cập nhật thứ tự lộ trình.');
    } catch (error) {
      toast.error('Lỗi khi cập nhật thứ tự.');
      loadData(); // revert
    }
  };

  const resetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormSkillId('');
    setFormDifficulty('EASY');
    setFormDeadline('');
    setFormEstimatedMinutes(25);
    setCurrentTask(null);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formSkillId) {
      toast.error('Vui lòng điền tiêu đề và kỹ năng.');
      return;
    }

    try {
      const payload: any = {
        title: formTitle,
        description: formDescription,
        skillId: formSkillId,
        difficulty: formDifficulty,
        estimatedMinutes: formEstimatedMinutes
      };
      if (formDeadline) payload.deadline = formDeadline;

      const response = await api.post('/workspace/tasks', payload);
      if (response.data.success) {
        toast.success('Đã thêm bước mới thành công!');
        setIsCreateModalOpen(false);
        resetForm();
        loadData();
      }
    } catch (error) {
      toast.error('Lỗi khi thêm bước.');
    }
  };

  const handleEditClick = (task: Task) => {
    setCurrentTask(task);
    setFormTitle(task.title);
    setFormDescription(task.description || '');
    setFormSkillId(task.skillId);
    setFormDifficulty(task.difficulty);
    setFormDeadline(task.deadline ? task.deadline.split('T')[0] : '');
    setFormEstimatedMinutes(task.estimatedMinutes);
    setIsEditModalOpen(true);
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTask) return;

    try {
      const payload: any = {
        title: formTitle,
        description: formDescription,
        skillId: formSkillId,
        difficulty: formDifficulty,
        estimatedMinutes: formEstimatedMinutes,
        deadline: formDeadline || null
      };

      const response = await api.put(`/workspace/tasks/${currentTask.id}`, payload);
      if (response.data.success) {
        toast.success('Đã cập nhật thành công!');
        setIsEditModalOpen(false);
        resetForm();
        loadData();
      }
    } catch (error) {
      toast.error('Lỗi khi cập nhật bước.');
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bước này khỏi lộ trình?')) return;
    try {
      const response = await api.delete(`/workspace/tasks/${id}`);
      if (response.data.success) {
        toast.success('Đã xóa thành công.');
        loadData();
      }
    } catch (error) {
      toast.error('Lỗi khi xóa bước.');
    }
  };

  // Calendar View helper variables
  const daysInMonth = 28;
  const calendarGrid = Array(daysInMonth).fill(null);
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
    <div className="space-y-6 max-w-4xl mx-auto font-sans pb-10">
      
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
          <div className="flex flex-wrap items-center gap-3">
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
              variant="secondary"
              className="text-xs font-bold flex items-center gap-2"
              onClick={() => { resetForm(); setIsCreateModalOpen(true); }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm bước</span>
            </Button>

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
        /* TIMELINE VIEW (FLAT TASK LIST) */
        <div className="space-y-4 relative pl-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
          {tasks.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm font-semibold border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
              Không có task nào trong lộ trình hiện tại.
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                {tasks.map((task, idx) => (
                  <SortableTaskItem 
                    key={task.id} 
                    task={task} 
                    idx={idx} 
                    onEdit={() => handleEditClick(task)}
                    onDelete={() => handleDeleteTask(task.id)}
                  />
                ))}
              </SortableContext>
            </DndContext>
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
        </div>
      )}

      {/* CREATE/EDIT MODALS */}
      <Modal
        isOpen={isCreateModalOpen || isEditModalOpen}
        onClose={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false); }}
        title={isEditModalOpen ? "Chỉnh Sửa Bước Học Tập" : "Thêm Bước Mới"}
        size="md"
      >
        <form onSubmit={isEditModalOpen ? handleUpdateTask : handleCreateTask} className="space-y-4">
          <Input
            label="Tiêu đề"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            placeholder="Ví dụ: Luyện viết kanji N5..."
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-slate-300 font-semibold text-xs uppercase tracking-wider">Mô tả chi tiết</label>
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Ghi chú thêm về yêu cầu công việc hoặc các bước thực hiện..."
              rows={3}
              className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm focus:border-blue-500 transition-all outline-none resize-none font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-300 font-semibold text-xs uppercase tracking-wider">Kỹ năng liên quan</label>
              <select
                value={formSkillId}
                onChange={(e) => setFormSkillId(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 text-sm focus:border-blue-500 transition-all outline-none font-semibold"
                required
              >
                <option value="">Chọn kỹ năng...</option>
                {skills.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-slate-300 font-semibold text-xs uppercase tracking-wider">Mức độ khó</label>
              <select
                value={formDifficulty}
                onChange={(e) => setFormDifficulty(e.target.value as Difficulty)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 text-sm focus:border-blue-500 transition-all outline-none font-semibold"
              >
                <option value="EASY">Dễ (EASY)</option>
                <option value="MEDIUM">Trung bình (MEDIUM)</option>
                <option value="HARD">Khó (HARD)</option>
                <option value="EXPERT">Rất khó (EXPERT)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Hạn chót hoàn thành"
              type="date"
              value={formDeadline}
              onChange={(e) => setFormDeadline(e.target.value)}
              icon={<CalendarIcon className="w-5 h-5 text-slate-600" />}
            />

            <Input
              label="Thời gian (phút)"
              type="number"
              value={formEstimatedMinutes}
              onChange={(e) => setFormEstimatedMinutes(parseInt(e.target.value, 10))}
              icon={<Clock className="w-5 h-5 text-slate-600" />}
              min={5}
              required
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-800 pt-4 mt-6">
            <Button type="button" variant="secondary" onClick={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false); }}>Hủy</Button>
            <Button type="submit" variant="primary">{isEditModalOpen ? "Lưu thay đổi" : "Thêm Bước"}</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}

// Sortable Item Component
function SortableTaskItem({ task, idx, onEdit, onDelete }: { task: Task; idx: number; onEdit: () => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  const isMastered = (task as any).masteryLevel >= 0.8;
  const isOverride = (task as any).isManualOverride;

  let nodeStyle = 'border-slate-800 bg-slate-950 text-slate-500';
  if (idx === 0) nodeStyle = 'border-blue-500 bg-blue-950 text-blue-400 shadow-lg shadow-blue-500/20 ring-4 ring-blue-500/10 animate-pulse-slow';
  if (isMastered) nodeStyle = 'border-emerald-500 bg-emerald-950 text-emerald-400';

  return (
    <div ref={setNodeRef} style={style} className="relative group/timeline">
      {/* Timeline Dot Indicator */}
      <div className={`absolute -left-[27px] top-5 w-6 h-6 rounded-full border-2 flex items-center justify-center font-bold text-[10px] z-10 ${nodeStyle}`}>
        {task.status === 'DONE' ? '✓' : idx + 1}
      </div>

      {/* Task Card */}
      <div className={`bg-slate-900 border ${isOverride ? 'border-indigo-900/50 shadow-[0_0_15px_-3px_rgba(99,102,241,0.1)]' : 'border-slate-800'} rounded-2xl p-4 hover:border-slate-700/80 transition-all duration-300 flex items-center gap-4`}>
        
        {/* Drag Handle */}
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-2 text-slate-600 hover:text-slate-400 transition-colors">
          <GripVertical className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className="text-slate-100 font-bold text-sm tracking-wide truncate">
              {task.title}
            </h3>
            {isOverride && (
              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 whitespace-nowrap">
                Chỉnh tay
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-500">
            {task.skill && (
              <span className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                <Star className="w-3 h-3 text-blue-400" />
                <span className="truncate max-w-[120px]">{task.skill.name}</span>
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{task.estimatedMinutes}m</span>
            </span>
            <span className={`px-2 py-0.5 rounded-full uppercase text-[9px] ${
              task.status === 'DONE' ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-900/30' :
              task.status === 'IN_PROGRESS' ? 'bg-blue-950/30 text-blue-400 border border-blue-900/30' :
              'bg-slate-800 text-slate-400'
            }`}>
              {task.status === 'DONE' ? 'Xong' : task.status === 'IN_PROGRESS' ? 'Đang Làm' : 'Chờ'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2 opacity-10 sm:opacity-0 group-hover/timeline:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-2 bg-slate-950 border border-slate-800 text-blue-400 hover:bg-blue-900/20 hover:border-blue-800 rounded-xl transition-all shadow-lg"
            title="Sửa"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 bg-slate-950 border border-slate-800 text-red-400 hover:bg-red-900/20 hover:border-red-800 rounded-xl transition-all shadow-lg"
            title="Xóa"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
