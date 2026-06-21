'use client';

import React, { useState, useEffect, useRef } from 'react';
import api from '@/services/api';
import { Button } from '@/components/common/Button';
import { Compass, BookOpen, Clock, BarChart, ChevronRight, X, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { handleError } from '@/utils/errorHandler';
import { CommunityListSkeleton } from '../../../components/common/Skeleton';

interface RoadmapTaskTemplate {
  title: string;
  description: string;
  skillSlug: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  estimatedMinutes: number;
}

interface RoadmapTemplate {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  durationWeeks: number;
  totalSkills: number;
  bannerGradient: string;
  phases: {
    title: string;
    description: string;
    tasks: RoadmapTaskTemplate[];
  }[];
}

// ROADMAP_TEMPLATES are now fetched from the backend API

export default function CommunityRoadmaps() {

  const [roadmapTemplates, setRoadmapTemplates] = useState<RoadmapTemplate[]>([]);
  const isCloningRef = useRef<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<RoadmapTemplate | null>(null);
  const [skillsList, setSkillsList] = useState<any[]>([]);
  const [isCloning, setIsCloning] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchSkills();
    fetchRoadmapTemplates();
  }, []);

  const fetchRoadmapTemplates = async () => {
    try {
      const response = await api.get('/roadmap/templates');
      if (response.data.success) {
        setRoadmapTemplates(response.data.templates);
      }
    } catch (_) {
      handleError('Không thể tải danh sách lộ trình.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSkills = async () => {
    try {
      const response = await api.get('/auth/skills');
      if (response.data.success) {
        // Flatten children to make slug mapping easier
        const flat: any[] = [];
        response.data.skills.forEach((s: any) => {
          flat.push(s);
          if (s.children && s.children.length > 0) {
            flat.push(...s.children);
          }
        });
        setSkillsList(flat);
      }
    } catch (_) {
      handleError('Không thể tải danh sách kỹ năng hệ thống.');
    }
  };

  const getSkillIdBySlug = (slug: string): string => {
    const matched = skillsList.find(s => s.slug === slug || s.name.toLowerCase().includes(slug));
    if (matched) return matched.id;
    // Default fallback to first skill if available, otherwise mock UUID
    return skillsList[0]?.id || 'default-skill-id';
  };

  const handleCloneRoadmap = async (template: RoadmapTemplate) => {
    if (isCloningRef.current) return;
    isCloningRef.current = true;
    setIsCloning(true);
    const loadingToast = toast.loading(`Đang khởi tạo lộ trình "${template.title}" vào bảng học tập của bạn...`);
    
    try {
      let createdCount = 0;
      // Extract all tasks from phases
      const allTasks: RoadmapTaskTemplate[] = [];
      template.phases.forEach(phase => {
        phase.tasks.forEach(t => {
          allTasks.push(t);
        });
      });

      // Post tasks one by one to ensure database order
      for (const t of allTasks) {
        const skillId = getSkillIdBySlug(t.skillSlug);
        
        await api.post('/workspace/tasks', {
          title: t.title,
          description: t.description,
          skillId,
          difficulty: t.difficulty,
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days deadline default
          estimatedMinutes: t.estimatedMinutes
        });
        createdCount++;
      }

      toast.success(`Đã thêm thành công ${createdCount} nhiệm vụ vào Bảng học tập! 🎉`, { id: loadingToast });
      setSelectedTemplate(null);
    } catch (error: any) {
      handleError(error, 'Có lỗi xảy ra khi sao chép lộ trình.', { id: loadingToast });
    } finally {
      setIsCloning(false);
      isCloningRef.current = false;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 min-h-screen text-slate-100">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Thư viện Lộ trình & Mẫu học tập
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Khám phá các lộ trình học tập tiêu chuẩn được hội đồng chuyên môn FPT phê duyệt và nhân bản về không gian cá nhân.
          </p>
        </div>
      </div>

      {/* Grid of Templates */}
      {isLoading ? (
        <CommunityListSkeleton />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roadmapTemplates.map((tpl) => (
            <div
              key={tpl.id}
            className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 flex flex-col justify-between group"
          >
            <div>
              {/* Card Banner */}
              <div className={`h-36 bg-gradient-to-tr ${tpl.bannerGradient} p-6 flex flex-col justify-between relative`}>
                <div className="absolute inset-0 bg-slate-950/20 mix-blend-multiply"></div>
                <div className="z-10 flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider bg-slate-950/40 backdrop-blur-sm px-2.5 py-1 rounded-full text-slate-200">
                    Lộ trình mẫu
                  </span>
                  <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white">
                    <Compass className="w-4 h-4 animate-spin-slow" />
                  </div>
                </div>
                <h3 className="z-10 text-white font-bold text-xl drop-shadow-md">
                  {tpl.title}
                </h3>
              </div>

              {/* Card Content */}
              <div className="p-6 space-y-4">
                <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">
                  {tpl.description}
                </p>

                {/* Badges Grid */}
                <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                  <div className="bg-slate-950/50 rounded-xl p-2 border border-slate-800/80">
                    <span className="text-slate-500 text-[10px] block">Độ khó</span>
                    <span className="text-slate-200 text-xs font-semibold">{tpl.difficulty}</span>
                  </div>
                  <div className="bg-slate-950/50 rounded-xl p-2 border border-slate-800/80">
                    <span className="text-slate-500 text-[10px] block">Thời gian</span>
                    <span className="text-slate-200 text-xs font-semibold">{tpl.durationWeeks} tuần</span>
                  </div>
                  <div className="bg-slate-950/50 rounded-xl p-2 border border-slate-800/80">
                    <span className="text-slate-500 text-[10px] block">Kỹ năng</span>
                    <span className="text-slate-200 text-xs font-semibold">{tpl.totalSkills} Units</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Footer Actions */}
            <div className="p-6 pt-0">
              <Button
                onClick={() => setSelectedTemplate(tpl)}
                className="w-full bg-slate-800 hover:bg-blue-600 hover:text-white transition-all duration-300 py-2.5 rounded-xl border border-slate-700 flex items-center justify-center gap-2 group-hover:border-blue-500/30"
              >
                <span>Xem chi tiết & Lưu</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
            </div>
          ))}
        </div>
      )}

      {/* Side Slide Drawer for Detailed Roadmap Preview */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300">
          <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-screen shadow-2xl flex flex-col justify-between overflow-hidden animate-slide-in">
            {/* Drawer Header */}
            <div className={`p-6 bg-gradient-to-r ${selectedTemplate.bannerGradient} text-white relative flex justify-between items-start`}>
              <div className="absolute inset-0 bg-slate-950/30 mix-blend-multiply"></div>
              <div className="z-10 space-y-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider bg-black/30 px-2.5 py-1 rounded-full">
                  Lộ Trình Đào Tạo
                </span>
                <h2 className="text-2xl font-extrabold tracking-tight drop-shadow-md">{selectedTemplate.title}</h2>
                <p className="text-slate-200 text-xs max-w-md">{selectedTemplate.description}</p>
              </div>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="z-10 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body - Timeline Phases */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-950/50">
              <h4 className="text-sm font-semibold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-500" />
                Các giai đoạn đào tạo ({selectedTemplate.phases.length})
              </h4>

              <div className="relative border-l border-slate-800 pl-6 ml-3 space-y-8">
                {selectedTemplate.phases.map((phase, pIdx) => (
                  <div key={pIdx} className="relative">
                    {/* Circle icon on timeline */}
                    <div className="absolute -left-[35px] top-1.5 w-6 h-6 rounded-full bg-slate-900 border-2 border-blue-500 flex items-center justify-center text-xs text-blue-400 font-bold shadow-md shadow-blue-500/20">
                      {pIdx + 1}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h5 className="text-slate-100 font-bold text-base leading-snug">{phase.title}</h5>
                        <p className="text-slate-400 text-xs mt-0.5">{phase.description}</p>
                      </div>

                      {/* Tasks in phase */}
                      <div className="space-y-2">
                        {phase.tasks.map((task, tIdx) => (
                          <div
                            key={tIdx}
                            className="bg-slate-900 border border-slate-850 p-3 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-slate-750 transition-colors"
                          >
                            <div className="space-y-1">
                              <span className="text-slate-200 text-sm font-medium block leading-tight">
                                {task.title}
                              </span>
                              <span className="text-slate-500 text-xs block leading-relaxed max-w-md">
                                {task.description}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 self-start md:self-center">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                task.difficulty === 'EASY' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/50' :
                                task.difficulty === 'MEDIUM' ? 'bg-amber-950/40 text-amber-400 border border-amber-900/50' :
                                'bg-rose-950/40 text-rose-400 border border-rose-900/50'
                              }`}>
                                {task.difficulty}
                              </span>
                              <span className="text-slate-400 text-xs flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-slate-500" />
                                {task.estimatedMinutes}m
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Drawer Footer CTA */}
            <div className="p-6 border-t border-slate-800 bg-slate-900 flex items-center gap-4">
              <Button
                onClick={() => setSelectedTemplate(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 py-3 rounded-xl"
              >
                Hủy bỏ
              </Button>
              <Button
                onClick={() => handleCloneRoadmap(selectedTemplate)}
                disabled={isCloning}
                className="flex-[2] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3 rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
              >
                {isCloning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Đang sao chép...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Thêm vào Bảng học tập</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
