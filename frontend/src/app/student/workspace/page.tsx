'use client';

import React, { useState, useEffect } from 'react';
import useAuth from '../../../hooks/useAuth';
import api from '../../../services/api';
import { Task, Skill, Difficulty, TaskStatus } from '../../../types';
import TaskCard from '../../../components/ui/TaskCard';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Modal from '../../../components/common/Modal';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  DragEndEvent,
  DragOverlay,
  DragStartEvent
} from '@dnd-kit/core';
import { Search, Filter, Plus, Sparkles, AlertCircle, Calendar, Clock, Trash } from 'lucide-react';
import toast from 'react-hot-toast';
import { handleError } from '@/utils/errorHandler';

import { useRouter } from 'next/navigation';

export default function WorkspacePage() {
  const { user } = useAuth();
  const router = useRouter();
  
  // States
  const [tasks, setTasks] = useState<Task[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAIGenerating, setIsAIGenerating] = useState<boolean>(false);

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSkillId, setSelectedSkillId] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [sortBy, setSortBy] = useState<'priority' | 'deadline' | 'difficulty'>('priority');

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

  // Active Drag state
  const [activeDragTask, setActiveDragTask] = useState<Task | null>(null);

  // DND Kit Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8 // Start drag only after moving 8px
      }
    })
  );

  useEffect(() => {
    loadData();
  }, [sortBy, selectedSkillId, selectedDifficulty]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // 1. Fetch tasks
      let queryParams = `?sortBy=${sortBy}`;
      if (selectedSkillId) queryParams += `&skillId=${selectedSkillId}`;
      if (selectedDifficulty) queryParams += `&difficulty=${selectedDifficulty}`;

      const tasksRes = await api.get(`/workspace/tasks${queryParams}`);
      if (tasksRes.data.success) {
        setTasks(tasksRes.data.tasks);
      }

      // 2. Fetch skills list for dropdown options
      const skillsRes = await api.get('/auth/skills');
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
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Drag-and-Drop Handlers
  const handleDragStart = (event: DragStartEvent) => {
    const taskId = event.active.id as string;
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setActiveDragTask(task);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;

    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;

    // Optimistic Update
    setTasks(prev =>
      prev.map(t =>
        t.id === taskId
          ? { ...t, status: newStatus, completedAt: newStatus === 'DONE' ? new Date().toISOString() : null }
          : t
      )
    );

    try {
      const response = await api.put(`/workspace/tasks/${taskId}/status`, { status: newStatus });
      if (response.data.success) {
        toast.success(`Đã chuyển sang cột ${newStatus}`);
        if (response.data.newRiskScore !== undefined) {
          // If risk recalculated, update other pages or notify
        }
      }
    } catch (error) {
      // Revert state on failure
      handleError('Không thể cập nhật trạng thái Task.');
      loadData();
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formSkillId) {
      handleError('Vui lòng điền tiêu đề và kỹ năng.');
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
        toast.success('Đã tạo task mới thành công!');
        setIsCreateModalOpen(false);
        resetForm();
        loadData();
      }
    } catch (error) {
      handleError('Lỗi khi tạo task.');
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
        toast.success('Đã cập nhật task thành công!');
        setIsEditModalOpen(false);
        resetForm();
        loadData();
      }
    } catch (error) {
      handleError('Lỗi khi cập nhật task.');
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa task này?')) return;
    try {
      const response = await api.delete(`/workspace/tasks/${id}`);
      if (response.data.success) {
        toast.success('Đã xóa task thành công.');
        loadData();
      }
    } catch (error) {
      handleError('Lỗi khi xóa task.');
    }
  };

  const handleAISuggestTasks = async () => {
    try {
      setIsAIGenerating(true);
      toast.loading('AI đang phân tích các kỹ năng yếu và đề xuất task...', { id: 'ai-gen' });
      
      const response = await api.get('/workspace/tasks/ai-generate');
      if (response.data.success) {
        if (response.data.tasks.length === 0) {
          toast.success('Tất cả kỹ năng đều vững vàng, không cần đề xuất thêm!', { id: 'ai-gen' });
        } else {
          toast.success(`Đã tự động thêm ${response.data.tasks.length} task đề xuất cải thiện kỹ năng!`, { id: 'ai-gen' });
          loadData();
        }
      }
    } catch (error) {
      handleError(error, 'AI đề xuất task thất bại.', { id: 'ai-gen' });
    } finally {
      setIsAIGenerating(false);
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

  // Filter tasks client-side based on search query
  const filteredTasks = tasks.filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const todoTasks = filteredTasks.filter(t => t.status === 'TODO');
  const inProgressTasks = filteredTasks.filter(t => t.status === 'IN_PROGRESS');
  const doneTasks = filteredTasks.filter(t => t.status === 'DONE');

  return (
    <div className="space-y-6">
      {/* Header toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        {/* Left filters */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search bar */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Tìm kiếm task..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-slate-300 text-xs focus:border-blue-500 transition-all outline-none font-semibold"
            />
          </div>

          {/* Skill Filter */}
          <select
            value={selectedSkillId}
            onChange={(e) => setSelectedSkillId(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-slate-400 text-xs focus:border-blue-500 transition-all outline-none font-semibold"
          >
            <option value="">Tất cả kỹ năng</option>
            {skills.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {/* Difficulty Filter */}
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-slate-400 text-xs focus:border-blue-500 transition-all outline-none font-semibold"
          >
            <option value="">Tất cả độ khó</option>
            <option value="EASY">Dễ (EASY)</option>
            <option value="MEDIUM">Trung bình (MEDIUM)</option>
            <option value="HARD">Khó (HARD)</option>
            <option value="EXPERT">Rất khó (EXPERT)</option>
          </select>

          {/* Sort order select */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-slate-400 text-xs focus:border-blue-500 transition-all outline-none font-semibold"
          >
            <option value="priority">Sắp xếp: Độ ưu tiên ⚡</option>
            <option value="deadline">Sắp xếp: Hạn chót 📅</option>
            <option value="difficulty">Sắp xếp: Độ khó 🔥</option>
          </select>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            className="text-xs border-blue-900/50 text-blue-400 font-bold flex items-center gap-2 hover:border-blue-800"
            onClick={handleAISuggestTasks}
            disabled={isAIGenerating}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Đề Xuất</span>
          </Button>

          <Button
            variant="primary"
            className="text-xs"
            onClick={() => { resetForm(); setIsCreateModalOpen(true); }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tạo Task</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        /* DND Board Container */
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[65vh] overflow-hidden">
            
            {/* Column 1: TODO */}
            <KanbanColumn id="TODO" title="Cần Làm" count={todoTasks.length} color="border-slate-800">
              {todoTasks.map(task => (
                <DraggableTaskCard
                  key={task.id}
                  task={task}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteTask}
                  onStatusChange={(id, stat) => {
                    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: stat } : t));
                    api.put(`/workspace/tasks/${id}/status`, { status: stat }).catch(() => loadData());
                  }}
                  onTakeQuiz={(skillId) => router.push('/student/quiz/' + skillId)}
                />
              ))}
            </KanbanColumn>

            {/* Column 2: IN_PROGRESS */}
            <KanbanColumn id="IN_PROGRESS" title="Đang Làm" count={inProgressTasks.length} color="border-blue-900/50">
              {inProgressTasks.map(task => (
                <DraggableTaskCard
                  key={task.id}
                  task={task}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteTask}
                  onStatusChange={(id, stat) => {
                    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: stat } : t));
                    api.put(`/workspace/tasks/${id}/status`, { status: stat }).catch(() => loadData());
                  }}
                  onTakeQuiz={(skillId) => router.push('/student/quiz/' + skillId)}
                />
              ))}
            </KanbanColumn>

            {/* Column 3: DONE */}
            <KanbanColumn id="DONE" title="Đã Xong" count={doneTasks.length} color="border-emerald-900/50">
              {doneTasks.map(task => (
                <DraggableTaskCard
                  key={task.id}
                  task={task}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteTask}
                  onStatusChange={(id, stat) => {
                    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: stat } : t));
                    api.put(`/workspace/tasks/${id}/status`, { status: stat }).catch(() => loadData());
                  }}
                  onTakeQuiz={(skillId) => router.push('/student/quiz/' + skillId)}
                />
              ))}
            </KanbanColumn>

          </div>

          {/* Drag Overlay visual indicator */}
          <DragOverlay>
            {activeDragTask ? (
              <div className="rotate-3 scale-105 opacity-90 shadow-2xl">
                <TaskCard task={activeDragTask} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* CREATE TASK MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Tạo Nhiệm Vụ Mới"
        size="md"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <Input
            label="Tiêu đề"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            placeholder="Ví dụ: Thiết kế cơ sở dữ liệu MongoDB"
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
              icon={<Calendar className="w-5 h-5 text-slate-600" />}
            />

            <Input
              label="Thời gian ước tính (phút)"
              type="number"
              value={formEstimatedMinutes}
              onChange={(e) => setFormEstimatedMinutes(parseInt(e.target.value, 10))}
              icon={<Clock className="w-5 h-5 text-slate-600" />}
              min={5}
              required
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-800 pt-4 mt-6">
            <Button type="button" variant="secondary" onClick={() => setIsCreateModalOpen(false)}>Hủy</Button>
            <Button type="submit" variant="primary">Tạo Task</Button>
          </div>
        </form>
      </Modal>

      {/* EDIT TASK MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Chỉnh Sửa Nhiệm Vụ"
        size="md"
      >
        <form onSubmit={handleUpdateTask} className="space-y-4">
          <Input
            label="Tiêu đề"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-slate-300 font-semibold text-xs uppercase tracking-wider">Mô tả chi tiết</label>
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
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
              label="Hạn chót"
              type="date"
              value={formDeadline}
              onChange={(e) => setFormDeadline(e.target.value)}
            />

            <Input
              label="Thời gian (phút)"
              type="number"
              value={formEstimatedMinutes}
              onChange={(e) => setFormEstimatedMinutes(parseInt(e.target.value, 10))}
              min={5}
              required
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-800 pt-4 mt-6">
            <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)}>Hủy</Button>
            <Button type="submit" variant="primary">Lưu thay đổi</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// Kanban Column Subcomponent
interface KanbanColumnProps {
  id: string;
  title: string;
  count: number;
  color: string;
  children: React.ReactNode;
}

function KanbanColumn({ id, title, count, color, children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppableHelper(id);

  return (
    <div
      ref={setNodeRef}
      className={`bg-slate-950/40 border-t-2 ${color} rounded-2xl flex flex-col h-full min-h-[500px] transition-all duration-300 ${
        isOver ? 'bg-slate-900/30 ring-1 ring-slate-800' : ''
      }`}
    >
      {/* Column Header */}
      <div className="px-4 py-3.5 border-b border-slate-900/60 bg-slate-950/30 flex items-center justify-between select-none">
        <span className="text-slate-200 font-bold text-sm">{title}</span>
        <span className="text-xs bg-slate-900 border border-slate-800 text-slate-400 font-bold px-2.5 py-0.5 rounded-full">
          {count}
        </span>
      </div>

      {/* Task List container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[55vh] custom-scrollbar">
        {children}
        {count === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 py-16 text-center select-none">
            <AlertCircle className="w-8 h-8 stroke-1 mb-2 opacity-50" />
            <span className="text-xs font-semibold">Cột trống</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Draggable Task Wrapper
interface DraggableTaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: 'TODO' | 'IN_PROGRESS' | 'DONE') => void;
  onTakeQuiz: (skillId: string) => void;
}

function DraggableTaskCard({ task, onEdit, onDelete, onStatusChange, onTakeQuiz }: DraggableTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggableHelper(task.id);

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.3 : undefined,
        cursor: 'grab'
      }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard
        task={task}
        onEdit={onEdit}
        onDelete={onDelete}
        onStatusChange={onStatusChange}
        onTakeQuiz={onTakeQuiz}
      />
    </div>
  );
}

// Droppable bridge helper
function useDroppableHelper(id: string) {
  const { useDroppable } = require('@dnd-kit/core');
  return useDroppable({ id });
}

// Draggable bridge helper
function useDraggableHelper(id: string) {
  const { useDraggable } = require('@dnd-kit/core');
  return useDraggable({ id });
}
