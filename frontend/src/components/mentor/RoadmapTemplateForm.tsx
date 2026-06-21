'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Save, ArrowLeft, GripVertical } from 'lucide-react';
import { handleError } from '@/utils/errorHandler';
import toast from 'react-hot-toast';
import api from '@/services/api';

interface TaskData {
  clientId: string;
  title: string;
  description: string;
  skillSlug: string;
  difficulty: string;
  estimatedMinutes: number;
}

interface PhaseData {
  clientId: string;
  title: string;
  description: string;
  tasks: TaskData[];
}

interface RoadmapTemplateFormProps {
  initialData?: any;
  isEdit?: boolean;
}

export function RoadmapTemplateForm({ initialData, isEdit }: RoadmapTemplateFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [difficulty, setDifficulty] = useState(initialData?.difficulty || 'BEGINNER');
  const [durationWeeks, setDurationWeeks] = useState(initialData?.durationWeeks || 4);
  const [totalSkills, setTotalSkills] = useState(initialData?.totalSkills || 10);
  const [bannerGradient, setBannerGradient] = useState(initialData?.bannerGradient || 'from-emerald-500 to-teal-500');

  // Load phases and add clientId if missing
  const [phases, setPhases] = useState<PhaseData[]>(() => {
    if (initialData?.phases) {
      return initialData.phases.map((p: any) => ({
        clientId: crypto.randomUUID(),
        title: p.title || '',
        description: p.description || '',
        tasks: (p.tasks || []).map((t: any) => ({
          clientId: crypto.randomUUID(),
          title: t.title || '',
          description: t.description || '',
          skillSlug: t.skillSlug || 'general',
          difficulty: t.difficulty || 'MEDIUM',
          estimatedMinutes: t.estimatedMinutes || 60,
        }))
      }));
    }
    return [
      {
        clientId: crypto.randomUUID(),
        title: '',
        description: '',
        tasks: [
          {
            clientId: crypto.randomUUID(),
            title: '',
            description: '',
            skillSlug: 'general',
            difficulty: 'MEDIUM',
            estimatedMinutes: 60,
          }
        ]
      }
    ];
  });

  const isSubmittingRef = useRef(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleAddPhase = () => {
    setPhases(prev => [
      ...prev,
      {
        clientId: crypto.randomUUID(),
        title: '',
        description: '',
        tasks: []
      }
    ]);
  };

  const handleRemovePhase = (phaseIndex: number) => {
    setPhases(prev => prev.filter((_, idx) => idx !== phaseIndex));
  };

  const handlePhaseChange = (phaseIndex: number, field: keyof PhaseData, value: string) => {
    const newPhases = [...phases];
    newPhases[phaseIndex] = { ...newPhases[phaseIndex], [field]: value };
    setPhases(newPhases);
  };

  const handleAddTask = (phaseIndex: number) => {
    const newPhases = [...phases];
    newPhases[phaseIndex].tasks.push({
      clientId: crypto.randomUUID(),
      title: '',
      description: '',
      skillSlug: 'general',
      difficulty: 'MEDIUM',
      estimatedMinutes: 60,
    });
    setPhases(newPhases);
  };

  const handleRemoveTask = (phaseIndex: number, taskIndex: number) => {
    const newPhases = [...phases];
    newPhases[phaseIndex].tasks = newPhases[phaseIndex].tasks.filter((_, idx) => idx !== taskIndex);
    setPhases(newPhases);
  };

  const handleTaskChange = (phaseIndex: number, taskIndex: number, field: keyof TaskData, value: any) => {
    const newPhases = [...phases];
    newPhases[phaseIndex].tasks[taskIndex] = { ...newPhases[phaseIndex].tasks[taskIndex], [field]: value };
    setPhases(newPhases);
  };

  const validateForm = () => {
    if (!title.trim()) {
      handleError('Tiêu đề lộ trình không được rỗng.');
      return false;
    }
    if (phases.length === 0) {
      handleError('Cần ít nhất 1 Phase.');
      return false;
    }
    for (let i = 0; i < phases.length; i++) {
      if (!phases[i].title.trim()) {
        handleError(`Tiêu đề của Phase ${i + 1} không được rỗng.`);
        return false;
      }
      if (phases[i].tasks.length === 0) {
        handleError(`Phase "${phases[i].title}" phải có ít nhất 1 Task.`);
        return false;
      }
      for (let j = 0; j < phases[i].tasks.length; j++) {
        if (!phases[i].tasks[j].title.trim()) {
          handleError(`Tiêu đề của Task ${j + 1} trong Phase "${phases[i].title}" không được rỗng.`);
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSaving(true);
    
    const loadingToast = toast.loading('Đang lưu...');

    try {
      const payload = {
        title,
        description,
        difficulty,
        durationWeeks: Number(durationWeeks),
        totalSkills: Number(totalSkills),
        bannerGradient,
        phases: phases.map(p => ({
          title: p.title,
          description: p.description,
          tasks: p.tasks.map(t => ({
            title: t.title,
            description: t.description,
            skillSlug: t.skillSlug,
            difficulty: t.difficulty,
            estimatedMinutes: Number(t.estimatedMinutes)
          }))
        }))
      };

      if (isEdit && initialData?.id) {
        await api.put(`/mentor/roadmap-templates/${initialData.id}`, payload);
        toast.success('Đã cập nhật lộ trình mẫu thành công!', { id: loadingToast });
      } else {
        await api.post('/mentor/roadmap-templates', payload);
        toast.success('Đã tạo lộ trình mẫu thành công!', { id: loadingToast });
      }

      router.push('/mentor/roadmap-templates');
      router.refresh();

    } catch (error) {
      handleError(error, 'Lỗi khi lưu lộ trình mẫu.', { id: loadingToast });
    } finally {
      setIsSaving(false);
      isSubmittingRef.current = false;
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 text-slate-100 pb-20">
      <div className="flex items-center gap-4 border-b border-slate-900 pb-6">
        <button
          onClick={() => router.back()}
          className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            {isEdit ? 'Cập nhật Lộ trình Mẫu' : 'Tạo Lộ trình Mẫu mới'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* THÔNG TIN CHUNG */}
        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 space-y-6">
          <h2 className="text-lg font-semibold text-emerald-400 mb-4 border-b border-slate-800 pb-2">Thông tin chung</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Tiêu đề Lộ trình *</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:ring-2 focus:ring-emerald-500/50 outline-none"
                placeholder="VD: Lộ trình Frontend ReactJS cơ bản..."
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Mô tả tổng quan</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:ring-2 focus:ring-emerald-500/50 outline-none"
                placeholder="Mô tả mục tiêu của lộ trình này..."
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Mức độ</label>
                <select
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none"
                >
                  <option value="BEGINNER">Người mới</option>
                  <option value="INTERMEDIATE">Trung bình</option>
                  <option value="ADVANCED">Nâng cao</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Thời gian (tuần)</label>
                <input
                  type="number"
                  min="1"
                  value={durationWeeks}
                  onChange={e => setDurationWeeks(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Số kỹ năng</label>
                <input
                  type="number"
                  min="1"
                  value={totalSkills}
                  onChange={e => setTotalSkills(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Màu nền (Tailwind class)</label>
                <input
                  type="text"
                  value={bannerGradient}
                  onChange={e => setBannerGradient(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none"
                  placeholder="from-emerald-500 to-teal-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* PHASES & TASKS */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-200">Nội dung chi tiết (Phases & Tasks)</h2>
            <button
              type="button"
              onClick={handleAddPhase}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20 text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" /> Thêm Phase
            </button>
          </div>

          {phases.map((phase, pIndex) => (
            <div key={phase.clientId} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <GripVertical className="text-slate-600 w-5 h-5 cursor-move" />
                    <span className="text-emerald-500 font-bold whitespace-nowrap">Phase {pIndex + 1}</span>
                    <input
                      type="text"
                      value={phase.title}
                      onChange={e => handlePhaseChange(pIndex, 'title', e.target.value)}
                      placeholder="Tên Phase (vd: Cơ bản về HTML)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm outline-none focus:ring-1 focus:ring-emerald-500/50"
                      required
                    />
                  </div>
                  <div className="pl-8">
                    <input
                      type="text"
                      value={phase.description}
                      onChange={e => handlePhaseChange(pIndex, 'description', e.target.value)}
                      placeholder="Mô tả Phase (không bắt buộc)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm outline-none focus:ring-1 focus:ring-emerald-500/50"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemovePhase(pIndex)}
                  className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                  title="Xóa Phase"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* TASK LIST */}
              <div className="pl-8 space-y-3 mt-4">
                {phase.tasks.map((task, tIndex) => (
                  <div key={task.clientId} className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex gap-3 items-start group">
                    <div className="flex-1 space-y-3">
                      <input
                        type="text"
                        value={task.title}
                        onChange={e => handleTaskChange(pIndex, tIndex, 'title', e.target.value)}
                        placeholder={`Task ${tIndex + 1}: VD Đọc tài liệu Semantic HTML`}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 text-sm outline-none focus:ring-1 focus:ring-emerald-500/50"
                        required
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={task.skillSlug}
                          onChange={e => handleTaskChange(pIndex, tIndex, 'skillSlug', e.target.value)}
                          placeholder="Skill Slug (vd: html)"
                          className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-400 text-xs outline-none"
                        />
                        <select
                          value={task.difficulty}
                          onChange={e => handleTaskChange(pIndex, tIndex, 'difficulty', e.target.value)}
                          className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-400 text-xs outline-none"
                        >
                          <option value="EASY">EASY</option>
                          <option value="MEDIUM">MEDIUM</option>
                          <option value="HARD">HARD</option>
                        </select>
                        <input
                          type="number"
                          value={task.estimatedMinutes}
                          onChange={e => handleTaskChange(pIndex, tIndex, 'estimatedMinutes', e.target.value)}
                          placeholder="Phút (vd: 30)"
                          className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-400 text-xs outline-none"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveTask(pIndex, tIndex)}
                      className="p-1.5 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => handleAddTask(pIndex)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-medium px-2 py-1 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Thêm Task
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-6 border-t border-slate-900 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20"
          >
            <Save className="w-5 h-5" />
            {isSaving ? 'Đang lưu...' : (isEdit ? 'Cập nhật Lộ trình' : 'Lưu Lộ trình mới')}
          </button>
        </div>
      </form>
    </div>
  );
}
