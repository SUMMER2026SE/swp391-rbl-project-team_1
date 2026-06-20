'use client';

import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { 
  BookOpen, Plus, Search, Filter, Edit, Trash2, 
  Eye, Save, X, Sparkles, BookOpenCheck, Globe 
} from 'lucide-react';
import toast from 'react-hot-toast';

interface KnowledgeUnit {
  id: string;
  title: string;
  content: string;
  skillId: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  isPublic: boolean;
  createdAt: string;
  skill: {
    id: string;
    name: string;
  };
}

// Simple Markdown to HTML helper
function renderMarkdown(md: string) {
  if (!md) return '';
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  html = html.replace(/^### (.*$)/gim, '<h4 class="text-sm font-bold text-slate-200 mt-4 mb-2">$1</h4>');
  html = html.replace(/^## (.*$)/gim, '<h3 class="text-base font-bold text-slate-100 mt-5 mb-2.5 pb-1 border-b border-slate-850">$1</h3>');
  html = html.replace(/^# (.*$)/gim, '<h2 class="text-lg font-extrabold text-white mt-6 mb-3">$1</h2>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-200">$1</strong>');
  html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-slate-950 p-4 rounded-xl text-xs font-mono text-blue-400 overflow-x-auto my-3 border border-slate-800">$1</pre>');
  html = html.replace(/`(.*?)`/g, '<code class="bg-slate-950 px-1.5 py-0.5 rounded text-xs font-mono text-pink-400">$1</code>');
  html = html.replace(/^\s*-\s+(.*$)/gim, '<li class="list-disc list-inside text-xs text-slate-300 ml-4 mb-1.5">$1</li>');
  return html.split('\n\n').map(p => {
    if (p.trim().startsWith('<h') || p.trim().startsWith('<pre') || p.trim().startsWith('<li') || p.trim().startsWith('<ul')) {
      return p;
    }
    return `<p class="text-xs text-slate-300 leading-relaxed mb-3">${p}</p>`;
  }).join('\n');
}

export default function MentorKnowledgeBank() {
  const [units, setUnits] = useState<KnowledgeUnit[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSkillFilter, setSelectedSkillFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Form states
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [skillId, setSkillId] = useState<string>('');
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT'>('MEDIUM');
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<boolean>(false);

  useEffect(() => {
    fetchKnowledgeUnits();
    fetchSkills();
  }, []);

  const fetchKnowledgeUnits = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/mentor/knowledge-units');
      if (response.data.success) {
        setUnits(response.data.units);
      }
    } catch (_) {
      toast.error('Không thể tải danh sách tài liệu.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSkills = async () => {
    try {
      const response = await api.get('/auth/skills');
      if (response.data.success) {
        // Flatten nested skills
        const flat: any[] = [];
        response.data.skills.forEach((s: any) => {
          flat.push(s);
          if (s.children) {
            flat.push(...s.children);
          }
        });
        setSkills(flat);
        if (flat.length > 0) setSkillId(flat[0].id);
      }
    } catch (_) {}
  };

  const handleCreateNew = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
    if (skills.length > 0) setSkillId(skills[0].id);
    setDifficulty('MEDIUM');
    setIsPublic(true);
    setIsEditing(true);
    setPreviewMode(false);
  };

  const handleSelectEdit = (unit: KnowledgeUnit) => {
    setEditingId(unit.id);
    setTitle(unit.title);
    setContent(unit.content);
    setSkillId(unit.skillId);
    setDifficulty(unit.difficulty);
    setIsPublic(unit.isPublic);
    setIsEditing(true);
    setPreviewMode(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này không?')) return;
    try {
      const response = await api.delete(`/mentor/knowledge-units/${id}`);
      if (response.data.success) {
        toast.success('Xóa bài viết thành công!');
        fetchKnowledgeUnits();
        if (editingId === id) {
          setIsEditing(false);
          setEditingId(null);
        }
      }
    } catch (_) {
      toast.error('Xóa bài viết thất bại.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('Tiêu đề và nội dung bài viết không được trống.');
      return;
    }

    setIsSaving(true);
    try {
      if (editingId) {
        // Update
        const response = await api.put(`/mentor/knowledge-units/${editingId}`, {
          title,
          content,
          skillId,
          difficulty,
          isPublic
        });
        if (response.data.success) {
          toast.success('Cập nhật bài viết thành công! 💾');
          setIsEditing(false);
          setEditingId(null);
          fetchKnowledgeUnits();
        }
      } else {
        // Create new
        const response = await api.post('/mentor/knowledge-units', {
          title,
          content,
          skillId,
          difficulty,
          isPublic
        });
        if (response.data.success) {
          toast.success('Tạo bài viết học tập thành công! 📝');
          setIsEditing(false);
          fetchKnowledgeUnits();
        }
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Không thể lưu bài viết.';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Filter list
  const filteredUnits = units.filter(unit => {
    const matchesSearch = unit.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          unit.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSkill = selectedSkillFilter ? unit.skillId === selectedSkillFilter : true;
    return matchesSearch && matchesSkill;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 min-h-screen text-slate-100">
      {/* Page Header */}
      <div className="border-b border-slate-900 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
            Ngân hàng tài liệu học tập
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Soạn thảo, quản lý bài viết và chia sẻ tài liệu tự học cho cộng đồng sinh viên FPT.
          </p>
        </div>

        {!isEditing && (
          <Button
            onClick={handleCreateNew}
            className="bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 px-5 rounded-xl flex items-center gap-2 text-xs font-bold shadow-lg shadow-emerald-500/10"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo bài viết mới</span>
          </Button>
        )}
      </div>

      {/* Main split-screen panel */}
      {isEditing ? (
        /* Edit Mode split screen */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Editor Form */}
          <form 
            onSubmit={handleSave} 
            className="lg:col-span-7 bg-slate-900/30 border border-slate-850 p-6 rounded-3xl space-y-5 text-left"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-900">
              <h3 className="text-sm font-bold text-slate-200">
                {editingId ? 'Chỉnh sửa tài liệu' : 'Soạn thảo tài liệu mới'}
              </h3>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => setPreviewMode(!previewMode)}
                  className="bg-slate-950 border border-slate-850 text-slate-400 hover:text-slate-250 py-1.5 px-3 rounded-lg text-xs"
                >
                  <Eye className="w-4 h-4 inline mr-1" />
                  {previewMode ? 'Sửa bài' : 'Xem trước'}
                </Button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="p-1 text-slate-500 hover:text-slate-300 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {previewMode ? (
              /* Markdown Preview inside editor column */
              <div className="bg-slate-950 border border-slate-850 p-5 rounded-2xl min-h-[350px] overflow-y-auto">
                <h2 className="text-lg font-bold text-white mb-4">{title || 'Tiêu đề trống'}</h2>
                <div 
                  className="prose prose-invert max-w-none space-y-2 text-left"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
                />
              </div>
            ) : (
              /* Actual editor controls */
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Tiêu đề tài liệu</label>
                  <Input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Nhập tiêu đề hấp dẫn..."
                    className="bg-slate-950 border-slate-850 text-slate-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Kỹ năng liên kết (Skill)</label>
                    <select
                      value={skillId}
                      onChange={(e) => setSkillId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 text-slate-350 py-2.5 px-3 rounded-xl text-xs focus:outline-none"
                    >
                      {skills.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Độ khó gợi ý</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-850 text-slate-350 py-2.5 px-3 rounded-xl text-xs focus:outline-none"
                    >
                      <option value="EASY">Dễ (Easy)</option>
                      <option value="MEDIUM">Trung bình (Medium)</option>
                      <option value="HARD">Khó (Hard)</option>
                      <option value="EXPERT">Chuyên gia (Expert)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Nội dung tài liệu (Hỗ trợ Markdown)</label>
                    <span className="text-[9px] text-slate-500">Dùng #, ##, **, - để format bài viết</span>
                  </div>
                  <textarea
                    rows={12}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Nhập nội dung bài viết dưới dạng Markdown..."
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-500/50 transition-all placeholder-slate-700"
                  />
                </div>

                {/* Sharing setting */}
                <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-850 flex items-center justify-between">
                  <div className="text-left space-y-0.5">
                    <span className="text-slate-200 text-xs font-bold block flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-emerald-500" />
                      <span>Chia sẻ công khai</span>
                    </span>
                    <span className="text-slate-550 text-[10px] block">Cho phép học viên tự ý sao chép tài liệu này thành task vào workspace.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-900">
              <Button
                type="button"
                onClick={() => setIsEditing(false)}
                className="bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-350 py-2.5 px-5 rounded-xl text-xs"
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 text-xs"
              >
                <Save className="w-4 h-4" />
                <span>Lưu bài viết</span>
              </Button>
            </div>
          </form>

          {/* Right: Interactive Editor Guide */}
          <div className="lg:col-span-5 bg-slate-900/30 border border-slate-850 p-6 rounded-3xl space-y-4 text-left">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 pb-3 border-b border-slate-900">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>Hướng dẫn Markdown nhanh</span>
            </h3>
            
            <div className="text-xs text-slate-400 space-y-3 font-mono leading-relaxed">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                <span className="text-emerald-400 block mb-1"># Tiêu đề 1</span>
                <span>Render thành tiêu đề lớn nhất</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                <span className="text-emerald-400 block mb-1">## Tiêu đề 2</span>
                <span>Render thành tiêu đề phụ, có thanh gạch chân</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                <span className="text-emerald-400 block mb-1">**Chữ in đậm**</span>
                <span>Render thành <strong>Chữ in đậm</strong></span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                <span className="text-emerald-400 block mb-1">- Phần tử danh sách</span>
                <span>Render thành dấu bulletpoint lùi dòng</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                <span className="text-emerald-400 block mb-1">```code blocks```</span>
                <span>Bao code để hiển thị block code màu xanh ngọc đẹp mắt</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* List Mode view */
        <div className="space-y-4">
          {/* Controls list */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-850">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tiêu đề tài liệu..."
                className="w-full bg-slate-950 border border-slate-850 pl-10 pr-4 py-2 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-emerald-500/50 transition-all placeholder-slate-700"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-3 w-4 h-4 text-slate-500 pointer-events-none" />
              <select
                value={selectedSkillFilter}
                onChange={(e) => setSelectedSkillFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 pl-10 pr-4 py-2 rounded-xl text-slate-400 text-xs focus:outline-none appearance-none cursor-pointer"
              >
                <option value="">Tất cả kỹ năng</option>
                {skills.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end text-xs text-slate-500 font-bold">
              Có tất cả {filteredUnits.length} tài liệu
            </div>
          </div>

          {/* Grid table */}
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
            </div>
          ) : filteredUnits.length === 0 ? (
            <div className="py-20 text-center text-slate-550 text-xs">
              Bạn chưa tạo tài liệu nào phù hợp với bộ lọc.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredUnits.map((unit) => (
                <div
                  key={unit.id}
                  className="bg-slate-900/20 border border-slate-850 p-5 rounded-2xl flex flex-col justify-between hover:border-slate-800 transition-all text-left"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/40 px-2.5 py-0.5 rounded-full">
                        {unit.skill.name}
                      </span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        unit.difficulty === 'EASY' ? 'bg-green-950/20 text-green-400' :
                        unit.difficulty === 'MEDIUM' ? 'bg-amber-950/20 text-amber-400' :
                        'bg-rose-950/20 text-rose-400'
                      }`}>
                        {unit.difficulty}
                      </span>
                    </div>

                    <h3 className="text-slate-200 font-bold text-sm leading-snug line-clamp-1">
                      {unit.title}
                    </h3>
                    
                    <p className="text-slate-400 text-xs leading-relaxed line-clamp-3 bg-slate-950/30 p-2.5 rounded-lg border border-slate-850/40 font-medium">
                      {unit.content.substring(0, 150)}...
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500">
                    <span className="flex items-center gap-1">
                      {unit.isPublic ? (
                        <span className="text-emerald-450 flex items-center gap-1 font-bold">
                          <Globe className="w-3.5 h-3.5" /> Công khai
                        </span>
                      ) : (
                        <span className="text-slate-500 flex items-center gap-1">
                          <X className="w-3.5 h-3.5" /> Riêng tư
                        </span>
                      )}
                    </span>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSelectEdit(unit)}
                        className="p-1.5 rounded-lg bg-slate-950 hover:bg-emerald-950/30 hover:text-emerald-400 border border-slate-850 text-slate-400 transition-colors"
                        title="Chỉnh sửa bài"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(unit.id)}
                        className="p-1.5 rounded-lg bg-slate-950 hover:bg-rose-950/30 hover:text-rose-400 border border-slate-850 text-slate-400 transition-colors"
                        title="Xóa bài"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
