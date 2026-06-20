'use client';

import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { 
  FileQuestion, Plus, Search, Filter, Edit, Trash2, 
  Save, X, Sparkles, Check, HelpCircle, Loader2 
} from 'lucide-react';
import toast from 'react-hot-toast';

interface QuizQuestion {
  id: string;
  question: string;
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
  options: { text: string; isCorrect?: boolean }[];
  explanation: string | null;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  skillId: string;
  skill: {
    id: string;
    name: string;
  };
}

interface KnowledgeUnit {
  id: string;
  title: string;
}

export default function MentorQuizBank() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [knowledgeUnits, setKnowledgeUnits] = useState<KnowledgeUnit[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSkillFilter, setSelectedSkillFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Form states
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [questionText, setQuestionText] = useState<string>('');
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT'>('MEDIUM');
  const [skillId, setSkillId] = useState<string>('');
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [correctOptionIdx, setCorrectOptionIdx] = useState<number>(0);
  const [explanation, setExplanation] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // AI Generator states
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [aiKnowledgeUnitId, setAiKnowledgeUnitId] = useState<string>('');
  const [aiCount, setAiCount] = useState<number>(3);
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);

  useEffect(() => {
    fetchQuestions();
    fetchSkills();
    fetchKnowledgeUnits();
  }, []);

  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/mentor/quiz-questions');
      if (response.data.success) {
        setQuestions(response.data.questions);
      }
    } catch (_) {
      toast.error('Không thể tải ngân hàng câu hỏi.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSkills = async () => {
    try {
      const response = await api.get('/auth/skills');
      if (response.data.success) {
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

  const fetchKnowledgeUnits = async () => {
    try {
      const response = await api.get('/mentor/knowledge-units');
      if (response.data.success) {
        setKnowledgeUnits(response.data.units);
        if (response.data.units.length > 0) {
          setAiKnowledgeUnitId(response.data.units[0].id);
        }
      }
    } catch (_) {}
  };

  const handleCreateNew = () => {
    setEditingId(null);
    setQuestionText('');
    setDifficulty('MEDIUM');
    if (skills.length > 0) setSkillId(skills[0].id);
    setOptions(['', '', '', '']);
    setCorrectOptionIdx(0);
    setExplanation('');
    setIsEditing(true);
  };

  const handleSelectEdit = (q: QuizQuestion) => {
    setEditingId(q.id);
    setQuestionText(q.question);
    setDifficulty(q.difficulty);
    setSkillId(q.skillId);
    
    // Map options back
    const mappedOptions = q.options.map(o => o.text);
    // Fill up to 4 if less
    while (mappedOptions.length < 4) mappedOptions.push('');
    setOptions(mappedOptions);
    
    const correctIdx = q.options.findIndex(o => o.isCorrect === true);
    setCorrectOptionIdx(correctIdx !== -1 ? correctIdx : 0);
    setExplanation(q.explanation || '');
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa câu hỏi này không?')) return;
    try {
      const response = await api.delete(`/mentor/quiz-questions/${id}`);
      if (response.data.success) {
        toast.success('Xóa câu hỏi thành công!');
        fetchQuestions();
        if (editingId === id) {
          setIsEditing(false);
          setEditingId(null);
        }
      }
    } catch (_) {
      toast.error('Xóa câu hỏi thất bại.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) {
      toast.error('Nội dung câu hỏi không được trống.');
      return;
    }

    // Validate options
    const filteredOptions = options.map(o => o.trim()).filter(o => o !== '');
    if (filteredOptions.length < 2) {
      toast.error('Bạn phải điền ít nhất 2 đáp án lựa chọn.');
      return;
    }

    if (correctOptionIdx >= filteredOptions.length) {
      toast.error('Đáp án đúng được chỉ định không hợp lệ.');
      return;
    }

    const payloadOptions = filteredOptions.map((text, idx) => ({
      text,
      isCorrect: idx === correctOptionIdx
    }));

    setIsSaving(true);
    try {
      if (editingId) {
        const response = await api.put(`/mentor/quiz-questions/${editingId}`, {
          question: questionText,
          difficulty,
          skillId,
          type: 'SINGLE_CHOICE',
          options: payloadOptions,
          explanation
        });
        if (response.data.success) {
          toast.success('Cập nhật câu hỏi thành công! 💾');
          setIsEditing(false);
          setEditingId(null);
          fetchQuestions();
        }
      } else {
        const response = await api.post('/mentor/quiz-questions', {
          question: questionText,
          difficulty,
          skillId,
          type: 'SINGLE_CHOICE',
          options: payloadOptions,
          explanation
        });
        if (response.data.success) {
          toast.success('Tạo câu hỏi trắc nghiệm thành công! 📝');
          setIsEditing(false);
          fetchQuestions();
        }
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Không thể lưu câu hỏi.';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateAIQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiKnowledgeUnitId) {
      toast.error('Vui lòng chọn tài liệu học tập để làm ngữ cảnh.');
      return;
    }

    setIsAiGenerating(true);
    const loadingToast = toast.loading('Gemini AI đang phân tích bài viết và biên soạn câu hỏi...');
    try {
      const response = await api.post('/mentor/quiz-questions/ai-generate', {
        knowledgeUnitId: aiKnowledgeUnitId,
        count: aiCount
      });
      if (response.data.success) {
        toast.success(`Đã tự động tạo và lưu thành công ${response.data.questions.length} câu hỏi vào hệ thống! 🤖`, { id: loadingToast });
        setShowAiModal(false);
        fetchQuestions();
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Gemini AI biên soạn câu hỏi thất bại.';
      toast.error(msg, { id: loadingToast });
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleOptionChange = (idx: number, val: string) => {
    const nextOpts = [...options];
    nextOpts[idx] = val;
    setOptions(nextOpts);
  };

  // Filter list
  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.question.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSkill = selectedSkillFilter ? q.skillId === selectedSkillFilter : true;
    return matchesSearch && matchesSkill;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 min-h-screen text-slate-100">
      {/* Page Header */}
      <div className="border-b border-slate-900 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
            Ngân hàng câu hỏi trắc nghiệm
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Quản lý các câu hỏi kiểm tra kỹ năng BKT cá nhân hóa hoặc sử dụng Trợ lý AI để tự tạo câu hỏi từ bài viết.
          </p>
        </div>

        {!isEditing && (
          <div className="flex gap-3">
            <Button
              onClick={() => setShowAiModal(true)}
              className="bg-purple-900/40 hover:bg-purple-900 border border-purple-800 hover:text-white py-2.5 px-5 rounded-xl flex items-center gap-2 text-xs font-bold"
            >
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
              <span>Tạo câu hỏi bằng AI</span>
            </Button>
            <Button
              onClick={handleCreateNew}
              className="bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 px-5 rounded-xl flex items-center gap-2 text-xs font-bold shadow-lg shadow-emerald-500/10"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo câu hỏi thủ công</span>
            </Button>
          </div>
        )}
      </div>

      {/* Main split-screen panel */}
      {isEditing ? (
        /* Edit Mode split screen */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left">
          <form 
            onSubmit={handleSave} 
            className="lg:col-span-8 bg-slate-900/30 border border-slate-850 p-6 rounded-3xl space-y-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-900">
              <h3 className="text-sm font-bold text-slate-200">
                {editingId ? 'Chỉnh sửa câu hỏi' : 'Tạo câu hỏi mới'}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-1 text-slate-500 hover:text-slate-300 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Question Text */}
              <div className="space-y-1">
                <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Nội dung câu hỏi</label>
                <textarea
                  rows={3}
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Nhập câu hỏi thảo luận..."
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-slate-200 text-xs focus:outline-none focus:border-emerald-500/50 transition-all placeholder-slate-700"
                />
              </div>

              {/* Skill & Difficulty */}
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
                  <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Độ khó câu hỏi</label>
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

              {/* Answers Grid */}
              <div className="space-y-3">
                <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Các phương án đáp án (Tích chọn đáp án đúng)</label>
                
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-slate-950/40 p-2.5 rounded-xl border border-slate-850">
                    <button
                      type="button"
                      onClick={() => setCorrectOptionIdx(idx)}
                      className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                        correctOptionIdx === idx
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : 'border-slate-800 text-transparent hover:border-slate-600'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>

                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      placeholder={`Nhập phương án ${String.fromCharCode(65 + idx)}...`}
                      className="flex-1 bg-transparent text-slate-200 text-xs focus:outline-none border-none p-0.5 placeholder-slate-700"
                    />
                  </div>
                ))}
              </div>

              {/* Explanation */}
              <div className="space-y-1">
                <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Lời giải thích chi tiết (Sau khi nộp bài)</label>
                <textarea
                  rows={3}
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Giải thích tại sao đáp án đã chọn lại đúng..."
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-slate-200 text-xs focus:outline-none focus:border-emerald-500/50 transition-all placeholder-slate-700"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-900">
              <Button
                type="button"
                onClick={() => setIsEditing(false)}
                className="bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-355 py-2.5 px-5 rounded-xl text-xs"
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 text-xs"
              >
                <Save className="w-4 h-4" />
                <span>Lưu câu hỏi</span>
              </Button>
            </div>
          </form>

          {/* Right: Quick reference preview */}
          <div className="lg:col-span-4 bg-slate-900/30 border border-slate-850 p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold text-slate-250 flex items-center gap-2 pb-3 border-b border-slate-900">
              <HelpCircle className="w-4.5 h-4.5 text-emerald-500" />
              <span>Xem trước câu hỏi</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3">
                <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Đề bài</span>
                <p className="text-slate-200 font-semibold leading-relaxed">
                  {questionText || 'Vui lòng nhập đề bài...'}
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Đáp án</span>
                {options.map((opt, idx) => (
                  <div 
                    key={idx} 
                    className={`p-2.5 rounded-xl text-[11px] border flex items-center gap-2 ${
                      correctOptionIdx === idx
                        ? 'bg-emerald-950/20 border-emerald-900/50 text-emerald-400 font-medium'
                        : 'bg-slate-950/40 border-slate-900 text-slate-500'
                    }`}
                  >
                    <span className="font-bold">{String.fromCharCode(65 + idx)}.</span>
                    <span>{opt || '(Trống)'}</span>
                  </div>
                ))}
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
                placeholder="Tìm nội dung câu hỏi..."
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
              Có tất cả {filteredQuestions.length} câu hỏi
            </div>
          </div>

          {/* List display */}
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="py-20 text-center text-slate-550 text-xs">
              Không tìm thấy câu hỏi trắc nghiệm nào phù hợp.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredQuestions.map((q) => (
                <div
                  key={q.id}
                  className="bg-slate-900/20 border border-slate-850 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-800 transition-all text-left"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/40 px-2.5 py-0.5 rounded-full">
                        {q.skill.name}
                      </span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        q.difficulty === 'EASY' ? 'bg-green-950/20 text-green-400' :
                        q.difficulty === 'MEDIUM' ? 'bg-amber-950/20 text-amber-400' :
                        'bg-rose-950/20 text-rose-400'
                      }`}>
                        {q.difficulty}
                      </span>
                    </div>

                    <h3 className="text-slate-200 font-bold text-sm leading-relaxed">
                      {q.question}
                    </h3>
                    
                    {/* Display options inline */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1">
                      {q.options.map((o, oIdx) => (
                        <span 
                          key={oIdx} 
                          className={`text-[10px] px-2.5 py-1 rounded-lg border truncate ${
                            o.isCorrect 
                              ? 'bg-emerald-950/10 border-emerald-900/30 text-emerald-400 font-semibold' 
                              : 'bg-slate-950/20 border-slate-900/60 text-slate-550'
                          }`}
                        >
                          {String.fromCharCode(65 + oIdx)}. {o.text}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 self-start md:self-center shrink-0">
                    <button
                      onClick={() => handleSelectEdit(q)}
                      className="p-1.5 rounded-lg bg-slate-950 hover:bg-emerald-950/30 hover:text-emerald-400 border border-slate-850 text-slate-400 transition-colors"
                      title="Sửa câu hỏi"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="p-1.5 rounded-lg bg-slate-950 hover:bg-rose-950/30 hover:text-rose-400 border border-slate-850 text-slate-400 transition-colors"
                      title="Xóa câu hỏi"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI Generator Modal Popup */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 text-left space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                <span>Trình biên soạn câu hỏi Gemini AI</span>
              </h3>
              <button
                onClick={() => setShowAiModal(false)}
                className="text-slate-500 hover:text-slate-350 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {knowledgeUnits.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                Bạn cần tạo ít nhất 1 tài liệu học tập trước khi dùng AI tạo quiz từ nội dung đó.
              </p>
            ) : (
              <form onSubmit={handleGenerateAIQuiz} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Ngữ cảnh tài liệu nguồn</label>
                  <select
                    value={aiKnowledgeUnitId}
                    onChange={(e) => setAiKnowledgeUnitId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 text-slate-350 py-2.5 px-3 rounded-xl text-xs focus:outline-none"
                  >
                    {knowledgeUnits.map(u => (
                      <option key={u.id} value={u.id}>{u.title}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Số lượng câu hỏi biên soạn</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={aiCount}
                    onChange={(e) => setAiCount(parseInt(e.target.value) || 3)}
                    className="w-full bg-slate-950 border border-slate-850 py-2 px-3 rounded-xl text-slate-200 text-xs focus:outline-none"
                  />
                  <span className="text-[9px] text-slate-500 block">Số lượng câu hỏi sinh ra tự động tối đa là 5 câu để đảm bảo chất lượng.</span>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                  <Button
                    type="button"
                    onClick={() => setShowAiModal(false)}
                    className="bg-slate-950 border border-slate-850 text-slate-400 hover:text-slate-250 py-2 px-4 rounded-xl text-xs"
                  >
                    Hủy bỏ
                  </Button>
                  <Button
                    type="submit"
                    disabled={isAiGenerating}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-2 px-5 rounded-xl text-xs flex items-center gap-2 shadow-md shadow-purple-550/10"
                  >
                    {isAiGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>AI Đang tạo...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Biên soạn tự động</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
