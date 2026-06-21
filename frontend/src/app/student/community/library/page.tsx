'use client';

import React, { useState, useEffect } from 'react';
import api from '../../../../services/api';
import { Button } from '../../../../components/common/Button';
import { BookOpen, Search, Filter, Calendar, User, Clock, FileText, CheckCircle2, BookmarkPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { handleError } from '@/utils/errorHandler';

interface KnowledgeUnit {
  id: string;
  title: string;
  content: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  createdAt: string;
  skill: {
    id: string;
    name: string;
  };
  mentor?: {
    user?: {
      fullName: string;
      email: string;
    };
  };
}

// Simple client-side Markdown to HTML renderer helper
function renderMarkdown(md: string) {
  if (!md) return '';
  
  // Escape HTML characters
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h4 class="text-sm font-bold text-slate-200 mt-4 mb-2">$1</h4>');
  html = html.replace(/^## (.*$)/gim, '<h3 class="text-base font-bold text-slate-100 mt-5 mb-2.5 pb-1 border-b border-slate-800">$1</h3>');
  html = html.replace(/^# (.*$)/gim, '<h2 class="text-lg font-extrabold text-white mt-6 mb-3">$1</h2>');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-200">$1</strong>');
  
  // Code block
  html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-slate-950 p-4 rounded-xl text-xs font-mono text-blue-400 overflow-x-auto my-3 border border-slate-800">$1</pre>');
  
  // Inline code
  html = html.replace(/`(.*?)`/g, '<code class="bg-slate-950 px-1.5 py-0.5 rounded text-xs font-mono text-pink-400">$1</code>');

  // Unordered list
  html = html.replace(/^\s*-\s+(.*$)/gim, '<li class="list-disc list-inside text-xs text-slate-300 ml-4 mb-1.5">$1</li>');

  // Paragraphs (split by double lines and wrap if not lists or headers)
  return html.split('\n\n').map(p => {
    if (p.trim().startsWith('<h') || p.trim().startsWith('<pre') || p.trim().startsWith('<li') || p.trim().startsWith('<ul')) {
      return p;
    }
    return `<p class="text-xs text-slate-300 leading-relaxed mb-3">${p}</p>`;
  }).join('\n');
}

export default function KnowledgeLibrary() {
  const [units, setUnits] = useState<KnowledgeUnit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<KnowledgeUnit | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    fetchLibrary();
  }, []);

  const fetchLibrary = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/auth/knowledge-library');
      if (response.data.success) {
        setUnits(response.data.units);
        if (response.data.units.length > 0) {
          setSelectedUnit(response.data.units[0]);
        }
      }
    } catch (_) {
      handleError('Không thể tải tài liệu thư viện học tập.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAsTask = async (unit: KnowledgeUnit) => {
    setIsSaving(true);
    try {
      // Estimate reading time based on length (200 words per minute)
      const wordCount = unit.content.split(/\s+/).length;
      const estimatedMinutes = Math.max(5, Math.ceil(wordCount / 150));

      await api.post('/workspace/tasks', {
        title: `Đọc: ${unit.title}`,
        description: `Tài liệu chuyên môn thuộc chủ đề ${unit.skill.name}. Xem nội dung tại Thư viện chung.\n\nTóm tắt nội dung:\n${unit.content.substring(0, 300)}...`,
        skillId: unit.skill.id,
        difficulty: unit.difficulty,
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days
        estimatedMinutes
      });

      toast.success('Đã lưu tài liệu thành nhiệm vụ học tập thành công! 📑');
    } catch (error: any) {
      handleError(error, 'Không thể tạo nhiệm vụ học tập.');
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered list
  const filteredUnits = units.filter(unit => {
    const matchesSearch = unit.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          unit.skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          unit.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = selectedDifficulty ? unit.difficulty === selectedDifficulty : true;
    return matchesSearch && matchesDifficulty;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 min-h-screen text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-900 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Thư viện kiến thức chuyên ngành
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Đọc các bài viết chuyên môn từ Mentors và lưu lại thành nhiệm vụ tự học để rèn luyện kỹ năng.
          </p>
        </div>
      </div>

      {/* Control row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800/80">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm tài liệu, kỹ năng..."
            className="w-full bg-slate-950 border border-slate-850 pl-10 pr-4 py-2.5 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-emerald-500/50 transition-all placeholder-slate-600"
          />
        </div>

        {/* Filter Difficulty */}
        <div className="relative">
          <Filter className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 pl-10 pr-4 py-2.5 rounded-xl text-slate-400 text-sm focus:outline-none focus:border-emerald-500/50 transition-all appearance-none cursor-pointer"
          >
            <option value="">Tất cả độ khó</option>
            <option value="EASY">Dễ (Easy)</option>
            <option value="MEDIUM">Trung bình (Medium)</option>
            <option value="HARD">Khó (Hard)</option>
            <option value="EXPERT">Chuyên gia (Expert)</option>
          </select>
        </div>

        {/* Info label */}
        <div className="flex items-center justify-end text-xs text-slate-500 font-medium">
          Hiển thị {filteredUnits.length} tài liệu học tập
        </div>
      </div>

      {/* Main split-screen panel */}
      {isLoading ? (
        <div className="h-96 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
        </div>
      ) : filteredUnits.length === 0 ? (
        <div className="h-96 bg-slate-900/20 border border-slate-800 rounded-3xl flex flex-col items-center justify-center text-center p-6 space-y-4">
          <FileText className="w-12 h-12 text-slate-700" />
          <div className="space-y-1">
            <h3 className="text-slate-300 font-bold text-base">Không tìm thấy tài liệu phù hợp</h3>
            <p className="text-slate-500 text-xs max-w-sm">
              Thử tìm kiếm với từ khóa khác hoặc điều chỉnh bộ lọc độ khó.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Article List */}
          <div className="lg:col-span-5 space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto pr-2 custom-scrollbar">
            {filteredUnits.map((unit) => (
              <div
                key={unit.id}
                onClick={() => setSelectedUnit(unit)}
                className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer text-left ${
                  selectedUnit?.id === unit.id
                    ? 'bg-slate-900/60 border-emerald-500/50 shadow-md shadow-emerald-500/5'
                    : 'bg-slate-900/30 border-slate-850 hover:bg-slate-900/40 hover:border-slate-800'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-950/40 px-2.5 py-0.5 rounded-full">
                      {unit.skill.name}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      unit.difficulty === 'EASY' ? 'bg-green-950/20 text-green-400' :
                      unit.difficulty === 'MEDIUM' ? 'bg-amber-950/20 text-amber-400' :
                      'bg-rose-950/20 text-rose-400'
                    }`}>
                      {unit.difficulty}
                    </span>
                  </div>
                  <h3 className="text-slate-200 font-bold text-sm leading-snug line-clamp-2">
                    {unit.title}
                  </h3>
                  <div className="flex items-center gap-3 text-slate-500 text-[10px] pt-1">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {unit.mentor?.user?.fullName || 'Mentor FPT'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(unit.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Article Markdown Viewer */}
          <div className="lg:col-span-7 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 space-y-6 sticky top-24 max-h-[calc(100vh-220px)] overflow-y-auto">
            {selectedUnit ? (
              <div className="space-y-6">
                {/* Article Header info */}
                <div className="space-y-3 pb-5 border-b border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400">
                      Chủ đề: {selectedUnit.skill.name}
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      selectedUnit.difficulty === 'EASY' ? 'bg-emerald-950/30 text-emerald-400' :
                      selectedUnit.difficulty === 'MEDIUM' ? 'bg-amber-950/30 text-amber-400' :
                      'bg-rose-950/30 text-rose-400'
                    }`}>
                      Độ khó: {selectedUnit.difficulty}
                    </span>
                  </div>
                  
                  <h2 className="text-xl font-extrabold text-white leading-tight">
                    {selectedUnit.title}
                  </h2>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <User className="w-4 h-4 text-slate-400" />
                      <span>Viết bởi: </span>
                      <strong className="text-slate-300 font-semibold">
                        {selectedUnit.mentor?.user?.fullName || 'Mentor FPT'}
                      </strong>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>{new Date(selectedUnit.createdAt).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </span>
                  </div>
                </div>

                {/* Article Body - Markdown Parser */}
                <div
                  className="prose prose-invert max-w-none space-y-3"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedUnit.content) }}
                />

                {/* Action CTA Box */}
                <div className="pt-6 border-t border-slate-800 flex items-center justify-between gap-4 bg-slate-950/20 p-4 rounded-2xl border border-slate-850">
                  <div className="space-y-0.5">
                    <span className="text-slate-200 text-xs font-bold block">Muốn đưa vào kế hoạch học tập?</span>
                    <span className="text-slate-500 text-[10px] block">Lưu bài viết này thành nhiệm vụ trong Kanban để theo dõi tiến độ học tập.</span>
                  </div>
                  <Button
                    onClick={() => handleSaveAsTask(selectedUnit)}
                    disabled={isSaving}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-emerald-500/10 flex items-center gap-2 whitespace-nowrap"
                  >
                    {isSaving ? (
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <BookmarkPlus className="w-4 h-4" />
                    )}
                    <span>Lưu thành Task</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="h-96 flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
                <BookOpen className="w-10 h-10 text-slate-700" />
                <span className="text-sm">Vui lòng chọn một tài liệu ở danh sách bên trái.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
