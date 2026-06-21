'use client';

import React, { useState, useEffect } from 'react';
import useAuth from '../../../hooks/useAuth';
import Button from '../../../components/common/Button';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import api from '../../../services/api';
import { Skill, Mentor } from '../../../types';
import { Check, ArrowRight, ArrowLeft, Brain, Target, Clock, Users, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

// BKT P(Known) mapping from self-assessed proficiency level
const PROFICIENCY_BKT_MAP: Record<string, number> = {
  'none':         0.1,
  'basic':        0.3,
  'practiced':    0.5,
  'proficient':   0.7,
};

const PROFICIENCY_OPTIONS = [
  { value: 'none',       label: 'Chưa biết gì',             desc: 'Hoàn toàn mới với kỹ năng này',  color: 'from-red-500/20 to-red-600/5',   border: 'border-red-500/50',   text: 'text-red-400',   dot: 'bg-red-500' },
  { value: 'basic',      label: 'Biết cơ bản',              desc: 'Đã nghe qua, biết sơ lược',       color: 'from-amber-500/20 to-amber-600/5', border: 'border-amber-500/50', text: 'text-amber-400', dot: 'bg-amber-500' },
  { value: 'practiced',  label: 'Đã thực hành 1 thời gian', desc: 'Đã áp dụng trong dự án nhỏ',      color: 'from-sky-500/20 to-sky-600/5',   border: 'border-sky-500/50',   text: 'text-sky-400',   dot: 'bg-sky-500' },
  { value: 'proficient', label: 'Khá thành thạo',           desc: 'Sử dụng thường xuyên, tự tin',    color: 'from-emerald-500/20 to-emerald-600/5', border: 'border-emerald-500/50', text: 'text-emerald-400', dot: 'bg-emerald-500' },
];

const STUDY_TIME_OPTIONS = [
  { value: 'morning',   label: 'Sáng sớm',    emoji: '🌅', desc: '5h – 9h sáng' },
  { value: 'afternoon', label: 'Buổi chiều',  emoji: '☀️', desc: '13h – 17h' },
  { value: 'evening',   label: 'Buổi tối',    emoji: '🌆', desc: '19h – 22h' },
  { value: 'late_night',label: 'Khuya',        emoji: '🌙', desc: '22h trở đi' },
];

const LEARNING_STYLE_OPTIONS = [
  { value: 'theory',   label: 'Đọc tài liệu lý thuyết trước', emoji: '📖', desc: 'Hiểu nền tảng rồi mới thực hành' },
  { value: 'practice', label: 'Thực hành trực tiếp ngay',      emoji: '⚡', desc: 'Học qua làm, thử-sai-sửa' },
  { value: 'example',  label: 'Xem ví dụ minh họa',            emoji: '🎬', desc: 'Học qua demo, case study cụ thể' },
  { value: 'mixed',    label: 'Kết hợp đa dạng',               emoji: '🔀', desc: 'Tuỳ tình huống, không cố định' },
];

const STEP_META = [
  { icon: Sparkles, label: 'Chọn kỹ năng',       color: 'text-blue-400' },
  { icon: Brain,    label: 'Đánh giá năng lực',  color: 'text-violet-400' },
  { icon: Target,   label: 'Mục tiêu & thời gian', color: 'text-amber-400' },
  { icon: Clock,    label: 'Phong cách học tập', color: 'text-sky-400' },
  { icon: Users,    label: 'Chọn Mentor',         color: 'text-emerald-400' },
];

export default function OnboardingPage() {
  const { completeOnboarding } = useAuth();

  // Stepper state — steps 1..5
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Data lists
  const [parentSkills, setParentSkills] = useState<Skill[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);

  // Step 1 — selected skill IDs
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);

  // Step 2 — proficiency per skill: { [skillId]: 'none' | 'basic' | 'practiced' | 'proficient' }
  const [skillProficiency, setSkillProficiency] = useState<Record<string, string>>({});

  // Step 3 — goals & time
  const [learningGoal, setLearningGoal] = useState<string>('');
  const [studyHours, setStudyHours] = useState<number>(2);
  const [durationMonths, setDurationMonths] = useState<number>(3);

  // Step 4 — learning style preferences
  const [preferredStudyTime, setPreferredStudyTime] = useState<string>('');
  const [learningStyle, setLearningStyle] = useState<string>('');

  // Step 5 — mentor
  const [selectedMentorId, setSelectedMentorId] = useState<string>('');

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoadingData(true);
        const [skillsRes, mentorsRes] = await Promise.all([
          api.get('/auth/skills'),
          api.get('/auth/mentors'),
        ]);
        if (skillsRes.data.success)  setParentSkills(skillsRes.data.skills);
        if (mentorsRes.data.success) setMentors(mentorsRes.data.mentors);
      } catch {
        toast.error('Lỗi khi tải thông tin cấu hình. Sử dụng dữ liệu dự phòng.');
        setParentSkills([
          { id: 'web-dev-id', name: 'Web Development', slug: 'web-dev', children: [
            { id: 'html-id', name: 'HTML5 Basics', slug: 'html' },
            { id: 'css-id', name: 'CSS3 Responsive', slug: 'css' },
            { id: 'js-id', name: 'JavaScript ES6+', slug: 'javascript' },
          ]},
          { id: 'data-science-id', name: 'Data Science', slug: 'data-science', children: [
            { id: 'python-id', name: 'Python Basics', slug: 'python' },
            { id: 'pandas-id', name: 'Pandas Analysis', slug: 'pandas' },
          ]},
          { id: 'english-id', name: 'Tiếng Anh', slug: 'english', children: [
            { id: 'eng-grammar-id', name: 'English Grammar Foundations', slug: 'english-grammar' },
            { id: 'eng-vocab-id', name: 'English Vocabulary Building', slug: 'english-vocab' },
            { id: 'ielts-id', name: 'IELTS Listening & Speaking', slug: 'ielts-listening-speaking' },
            { id: 'biz-eng-id', name: 'Business English Communication', slug: 'business-english' },
          ]},
          { id: 'japanese-id', name: 'Tiếng Nhật', slug: 'japanese', children: [
            { id: 'hiragana-id', name: 'Hiragana & Katakana', slug: 'hiragana-katakana' },
            { id: 'n5-kanji-id', name: 'N5 Kanji & Vocabulary', slug: 'n5-kanji-vocab' },
            { id: 'jp-grammar-id', name: 'Japanese Grammar N4-N5', slug: 'japanese-grammar-n4-n5' },
            { id: 'jlpt-id', name: 'JLPT Listening Practice', slug: 'jlpt-listening' },
          ]},
        ]);
        setMentors([
          { id: 'mentor-1-id', userId: 'u1', user: { id: 'u1', email: 'm1@edu', fullName: 'Mentor Nguyễn Văn B', role: 'MENTOR' } },
        ]);
      } finally {
        setIsLoadingData(false);
      }
    }
    fetchData();
  }, []);

  // Flatten sub-skills for easy look-up
  const allSubSkills: Skill[] = [];
  parentSkills.forEach(parent => {
    if (parent.children) allSubSkills.push(...parent.children);
    else allSubSkills.push(parent);
  });

  // Sub-skills that user actually selected (for step 2 rendering)
  const selectedSkills = allSubSkills.filter(s => selectedSkillIds.includes(s.id));

  const handleToggleSkill = (skillId: string) => {
    setSelectedSkillIds(prev =>
      prev.includes(skillId) ? prev.filter(id => id !== skillId) : [...prev, skillId]
    );
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (selectedSkillIds.length === 0) {
        toast.error('Vui lòng chọn ít nhất 1 kỹ năng để tiếp tục.');
        return;
      }
      // Pre-fill proficiency defaults
      setSkillProficiency(prev => {
        const next = { ...prev };
        selectedSkillIds.forEach(id => { if (!next[id]) next[id] = 'none'; });
        return next;
      });
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      if (!learningGoal.trim()) {
        toast.error('Vui lòng điền mục tiêu học tập của bạn.');
        return;
      }
      setStep(4);
    } else if (step === 4) {
      setStep(5);
    }
  };

  const handlePrevStep = () => {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
    else if (step === 4) setStep(3);
    else if (step === 5) setStep(4);
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      // Build BKT initial P(Known) map
      const skillLevels: Record<string, number> = {};
      selectedSkillIds.forEach(id => {
        const prof = skillProficiency[id] || 'none';
        skillLevels[id] = PROFICIENCY_BKT_MAP[prof] ?? 0.1;
      });

      await completeOnboarding(
        selectedSkillIds,
        learningGoal,
        studyHours,
        durationMonths,
        selectedMentorId || undefined,
        skillLevels,
        preferredStudyTime || undefined,
        learningStyle || undefined,
      );
    } catch (_) {
      // error is already toasted inside completeOnboarding
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950">
        <LoadingSpinner size="lg" />
        <p className="text-slate-500 text-sm font-semibold mt-4">Đang tải cấu hình khảo sát ban đầu...</p>
      </div>
    );
  }

  const progressPercent = (step / 5) * 100;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Onboarding Stepper Header */}
      <div className="w-full max-w-3xl mb-6 z-10">
        <div className="flex justify-between items-center px-1 mb-4">
          <div className="flex flex-col">
            <span className="text-blue-400 font-bold text-xs uppercase tracking-wider mb-1">Thiết lập hồ sơ</span>
            <h1 className="text-xl font-bold text-slate-100">Cá nhân hóa EduPath của bạn</h1>
          </div>
          <span className="text-slate-500 text-sm font-bold bg-slate-900 border border-slate-800 rounded-lg px-3 py-1">
            Bước {step}/5
          </span>
        </div>

        {/* Step icons row */}
        <div className="flex items-center gap-1 mb-3 px-1">
          {STEP_META.map((meta, idx) => {
            const stepNum = idx + 1;
            const isActive   = step === stepNum;
            const isComplete = step > stepNum;
            const Icon = meta.icon;
            return (
              <React.Fragment key={stepNum}>
                <div className={`flex items-center gap-1.5 transition-all duration-300 ${
                  isActive ? 'opacity-100' : isComplete ? 'opacity-60' : 'opacity-25'
                }`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all ${
                    isActive   ? `border-blue-500 bg-blue-950/40` :
                    isComplete ? `border-slate-600 bg-slate-800` :
                                 `border-slate-800 bg-transparent`
                  }`}>
                    {isComplete
                      ? <Check className="w-3.5 h-3.5 text-slate-300" />
                      : <Icon className={`w-3.5 h-3.5 ${isActive ? meta.color : 'text-slate-500'}`} />
                    }
                  </div>
                  <span className={`text-[10px] font-bold hidden sm:block ${
                    isActive ? 'text-slate-300' : 'text-slate-600'
                  }`}>{meta.label}</span>
                </div>
                {idx < 4 && (
                  <div className={`flex-1 h-px transition-all duration-500 ${
                    isComplete ? 'bg-slate-600' : 'bg-slate-800'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Form Card */}
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-slate-950/70 z-10 min-h-[420px] flex flex-col justify-between">

        {/* ── STEP 1: Select Skills ── */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-100 mb-1">Bạn muốn cải thiện những kỹ năng nào?</h2>
              <p className="text-slate-500 text-xs font-semibold">
                Lộ trình học tập và bài quiz kiểm tra sẽ tập trung xoay quanh các kỹ năng bạn đã chọn.
              </p>
            </div>

            {parentSkills.map(parent => (
              <div key={parent.id} className="space-y-3">
                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest border-b border-slate-800/80 pb-1.5">
                  {parent.name}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {parent.children?.map(sub => {
                    const isSelected = selectedSkillIds.includes(sub.id);
                    return (
                      <button
                        key={sub.id}
                        onClick={() => handleToggleSkill(sub.id)}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl border text-left text-sm font-semibold transition-all duration-300 group ${
                          isSelected
                            ? 'bg-blue-950/20 border-blue-500/80 text-blue-300 shadow-inner'
                            : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <span>{sub.name}</span>
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all flex-shrink-0 ${
                          isSelected
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'border-slate-700 text-transparent group-hover:border-slate-500'
                        }`}>
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── STEP 2: Skill Proficiency Self-Assessment ── */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-100 mb-1 flex items-center gap-2">
                <Brain className="w-5 h-5 text-violet-400" />
                Đánh giá năng lực hiện tại
              </h2>
              <p className="text-slate-500 text-xs font-semibold">
                AI sẽ dùng thông tin này để hiệu chỉnh mức độ khó phù hợp với bạn ngay từ đầu.
              </p>
            </div>

            <div className="space-y-6 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
              {selectedSkills.map(skill => (
                <div key={skill.id} className="space-y-2.5">
                  <p className="text-sm font-bold text-slate-200">
                    Bạn tự đánh giá mức độ hiện tại của mình với{' '}
                    <span className="text-violet-400">{skill.name}</span>?
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {PROFICIENCY_OPTIONS.map(opt => {
                      const isChosen = skillProficiency[skill.id] === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setSkillProficiency(prev => ({ ...prev, [skill.id]: opt.value }))}
                          className={`relative flex items-start gap-3 p-3 rounded-xl border text-left transition-all duration-200 group ${
                            isChosen
                              ? `bg-gradient-to-br ${opt.color} ${opt.border} shadow-inner`
                              : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
                          }`}
                        >
                          <div className={`w-3.5 h-3.5 rounded-full mt-0.5 flex-shrink-0 border-2 transition-all ${
                            isChosen ? `${opt.dot} border-transparent` : 'border-slate-600 bg-transparent'
                          }`} />
                          <div className="min-w-0">
                            <p className={`text-xs font-bold leading-tight ${isChosen ? opt.text : 'text-slate-300'}`}>
                              {opt.label}
                            </p>
                            <p className="text-[10px] text-slate-500 font-medium mt-0.5 leading-tight">{opt.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 3: Learning Goal & Time ── */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-100 mb-1 flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-400" />
                Mục tiêu học tập của bạn là gì?
              </h2>
              <p className="text-slate-500 text-xs font-semibold">
                Điền mục tiêu cụ thể để AI phân tích lộ trình học tập tối ưu nhất.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Mô tả mục tiêu của bạn
                </label>
                <textarea
                  value={learningGoal}
                  onChange={e => setLearningGoal(e.target.value)}
                  placeholder="Ví dụ: Thành thạo lập trình Web Frontend với NextJS để tham gia đồ án tốt nghiệp"
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none resize-none placeholder:text-slate-700 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Thời gian dự kiến hoàn thành
                  </label>
                  <select
                    value={durationMonths}
                    onChange={e => setDurationMonths(parseInt(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 text-sm focus:border-blue-500 transition-all outline-none font-semibold"
                  >
                    <option value={1}>1 Tháng (Cấp tốc)</option>
                    <option value={3}>3 Tháng (Khuyên dùng)</option>
                    <option value={6}>6 Tháng (Chuyên sâu)</option>
                    <option value={12}>1 Năm (Bền bỉ)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 select-none">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Thời gian tự học mỗi ngày
                    </label>
                    <span className="text-blue-400 font-extrabold text-sm">{studyHours} Giờ</span>
                  </div>
                  <input
                    type="range"
                    min={1} max={8} step={0.5}
                    value={studyHours}
                    onChange={e => setStudyHours(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-950 border border-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <span className="text-[10px] text-slate-500 font-semibold text-right">
                    Tổng số giờ dự kiến học tập: {studyHours * 30 * durationMonths} giờ
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 4: Learning Style Preferences ── */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-100 mb-1 flex items-center gap-2">
                <Clock className="w-5 h-5 text-sky-400" />
                Phong cách học tập ưa thích
              </h2>
              <p className="text-slate-500 text-xs font-semibold">
                AI sẽ ưu tiên loại nội dung phù hợp với cách bạn tiếp thu tốt nhất.
              </p>
            </div>

            {/* (a) Preferred study time */}
            <div className="space-y-3">
              <p className="text-sm font-bold text-slate-200">Bạn học hiệu quả nhất vào thời điểm nào?</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {STUDY_TIME_OPTIONS.map(opt => {
                  const isChosen = preferredStudyTime === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setPreferredStudyTime(opt.value)}
                      className={`flex flex-col items-center gap-2 py-4 px-3 rounded-xl border text-center transition-all duration-200 ${
                        isChosen
                          ? 'bg-sky-950/30 border-sky-500/70 shadow-inner'
                          : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-2xl">{opt.emoji}</span>
                      <span className={`text-xs font-bold ${isChosen ? 'text-sky-300' : 'text-slate-300'}`}>
                        {opt.label}
                      </span>
                      <span className="text-[10px] text-slate-500">{opt.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* (b) Learning style */}
            <div className="space-y-3">
              <p className="text-sm font-bold text-slate-200">Bạn thích học theo cách nào?</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {LEARNING_STYLE_OPTIONS.map(opt => {
                  const isChosen = learningStyle === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setLearningStyle(opt.value)}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-all duration-200 ${
                        isChosen
                          ? 'bg-sky-950/30 border-sky-500/70 shadow-inner'
                          : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xl flex-shrink-0">{opt.emoji}</span>
                      <div className="min-w-0">
                        <p className={`text-sm font-bold ${isChosen ? 'text-sky-300' : 'text-slate-300'}`}>
                          {opt.label}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{opt.desc}</p>
                      </div>
                      <div className={`ml-auto w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all ${
                        isChosen ? 'bg-sky-500 border-sky-400' : 'border-slate-600'
                      }`} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 5: Choose Mentor ── */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-100 mb-1 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                Đồng hành cùng Mentor hướng dẫn <span className="text-slate-500 font-normal text-sm">(Tùy chọn)</span>
              </h2>
              <p className="text-slate-500 text-xs font-semibold">
                Mentor sẽ giúp bạn chấm điểm, trả lời câu hỏi và nhận thông tin cảnh báo rủi ro để hỗ trợ kịp thời.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-72 overflow-y-auto pr-1">
              {mentors.length === 0 ? (
                <div className="col-span-2 text-center text-slate-500 py-8 text-sm">
                  Hiện chưa có Mentor nào hoạt động trên hệ thống.
                </div>
              ) : (
                mentors.map(m => {
                  const isSelected = selectedMentorId === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMentorId(isSelected ? '' : m.id)}
                      className={`flex flex-col justify-between p-5 rounded-2xl border text-left transition-all duration-300 group ${
                        isSelected
                          ? 'bg-emerald-950/20 border-emerald-500/80 shadow-inner'
                          : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xs uppercase shadow-inner flex-shrink-0">
                          {m.user?.fullName.substring(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-slate-200 text-sm font-bold truncate">{m.user?.fullName}</p>
                          <p className="text-slate-500 text-xs truncate">{m.user?.email}</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center w-full mt-4">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Đồ án tốt nghiệp</span>
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          isSelected ? 'bg-emerald-600/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                        }`}>
                          {isSelected ? 'Đã Chọn' : 'Chọn'}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="text-center select-none">
              <button
                type="button"
                onClick={handleFinish}
                className="text-xs text-slate-500 hover:text-slate-300 font-semibold transition-colors underline"
                disabled={isSubmitting}
              >
                Bỏ qua bước này và hoàn tất khảo sát
              </button>
            </div>
          </div>
        )}

        {/* Form Controls */}
        <div className="flex gap-4 border-t border-slate-800/80 pt-6 mt-8">
          {step > 1 && (
            <Button
              type="button"
              variant="secondary"
              className="px-6"
              onClick={handlePrevStep}
              disabled={isSubmitting}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span>Quay lại</span>
            </Button>
          )}

          {step < 5 ? (
            <Button
              type="button"
              variant="primary"
              className="ml-auto px-6"
              onClick={handleNextStep}
            >
              <span>Tiếp tục</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              className="ml-auto px-6"
              onClick={handleFinish}
              isLoading={isSubmitting}
            >
              <span>Bắt đầu học tập!</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
