'use client';

import React, { useState, useEffect } from 'react';
import useAuth from '../../../hooks/useAuth';
import Button from '../../../components/common/Button';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import api from '../../../services/api';
import { Skill, Mentor } from '../../../types';
import { Check, ShieldAlert, ArrowRight, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { handleError } from '@/utils/errorHandler';

export default function OnboardingPage() {
  const { completeOnboarding, user } = useAuth();
  
  // Stepper state
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Data lists
  const [parentSkills, setParentSkills] = useState<Skill[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);

  // User selections
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [learningGoal, setLearningGoal] = useState<string>('');
  const [studyHours, setStudyHours] = useState<number>(2);
  const [durationMonths, setDurationMonths] = useState<number>(3);
  const [selectedMentorId, setSelectedMentorId] = useState<string>('');

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoadingData(true);
        
        // 1. Fetch skills
        const skillsRes = await api.get('/auth/skills');
        if (skillsRes.data.success) {
          setParentSkills(skillsRes.data.skills);
        }

        // 2. Fetch mentors
        const mentorsRes = await api.get('/auth/mentors');
        if (mentorsRes.data.success) {
          setMentors(mentorsRes.data.mentors);
        }
      } catch (error) {
        console.error('Error fetching onboarding metadata:', error);
        handleError('Lỗi khi tải thông tin cấu hình. Sử dụng dữ liệu dự phòng.');
        
        // Fallbacks
        setParentSkills([
          { id: 'web-dev-id', name: 'Web Development', slug: 'web-dev', children: [
            { id: 'html-id', name: 'HTML5 Basics', slug: 'html' },
            { id: 'css-id', name: 'CSS3 Responsive', slug: 'css' },
            { id: 'js-id', name: 'JavaScript ES6+', slug: 'javascript' }
          ]},
          { id: 'data-science-id', name: 'Data Science', slug: 'data-science', children: [
            { id: 'python-id', name: 'Python Basics', slug: 'python' },
            { id: 'pandas-id', name: 'Pandas Analysis', slug: 'pandas' }
          ]}
        ]);
        setMentors([
          { id: 'mentor-1-id', userId: 'u1', user: { id: 'u1', email: 'm1@edu', fullName: 'Mentor Nguyễn Văn B', role: 'MENTOR' } }
        ]);
      } finally {
        setIsLoadingData(false);
      }
    }

    fetchData();
  }, []);

  const handleToggleSkill = (skillId: string) => {
    setSelectedSkillIds(prev => 
      prev.includes(skillId) 
        ? prev.filter(id => id !== skillId) 
        : [...prev, skillId]
    );
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (selectedSkillIds.length === 0) {
        handleError('Vui lòng chọn ít nhất 1 kỹ năng để tiếp tục.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!learningGoal.trim()) {
        handleError('Vui lòng điền mục tiêu học tập của bạn.');
        return;
      }
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    if (step === 2) setStep(1);
    if (step === 3) setStep(2);
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      // Goal message combining slider metrics
      const fullGoal = `${learningGoal} (Mục tiêu học tập: ${studyHours} giờ/ngày trong ${durationMonths} tháng)`;
      await completeOnboarding(selectedSkillIds, fullGoal, selectedMentorId || undefined);
    } catch (_) {
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

  // Flatten subskills for easy selection chip grid
  const allSubSkills: Skill[] = [];
  parentSkills.forEach(parent => {
    if (parent.children) {
      allSubSkills.push(...parent.children);
    } else {
      allSubSkills.push(parent);
    }
  });

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Onboarding Stepper Header */}
      <div className="w-full max-w-3xl mb-8 z-10">
        <div className="flex justify-between items-center px-4">
          <div className="flex flex-col">
            <span className="text-blue-400 font-bold text-xs uppercase tracking-wider mb-1">Thiết lập hồ sơ</span>
            <h1 className="text-xl font-bold text-slate-100">Cá nhân hóa EduPath của bạn</h1>
          </div>
          <span className="text-slate-500 text-sm font-bold">Bước {step}/3</span>
        </div>

        {/* Stepper Progress Bar */}
        <div className="mt-4 h-1.5 w-full bg-slate-900 rounded-full overflow-hidden flex">
          <div className={`h-full bg-blue-500 transition-all duration-500 ${
            step === 1 ? 'w-1/3' : step === 2 ? 'w-2/3' : 'w-full'
          }`} />
        </div>
      </div>

      {/* Main Form Wrapper */}
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-slate-950/70 z-10 min-h-[400px] flex flex-col justify-between">
        
        {/* STEP 1: Select Skills */}
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
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all ${
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

        {/* STEP 2: Learning Goal */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-100 mb-1">Mục tiêu học tập của bạn là gì?</h2>
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
                  onChange={(e) => setLearningGoal(e.target.value)}
                  placeholder="Ví dụ: Thành thạo lập trình Web Frontend với NextJS để tham gia đồ án tốt nghiệp"
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none resize-none placeholder:text-slate-700 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Duration select */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Thời gian dự kiến hoàn thành
                  </label>
                  <select
                    value={durationMonths}
                    onChange={(e) => setDurationMonths(parseInt(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 text-sm focus:border-blue-500 transition-all outline-none font-semibold"
                  >
                    <option value={1}>1 Tháng (Cấp tốc)</option>
                    <option value={3}>3 Tháng (Khuyên dùng)</option>
                    <option value={6}>6 Tháng (Chuyên sâu)</option>
                    <option value={12}>1 Năm (Bền bỉ)</option>
                  </select>
                </div>

                {/* Hours per day slider */}
                <div className="flex flex-col gap-1.5 select-none">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Thời gian tự học mỗi ngày
                    </label>
                    <span className="text-blue-400 font-extrabold text-sm">{studyHours} Giờ</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={8}
                    step={0.5}
                    value={studyHours}
                    onChange={(e) => setStudyHours(parseFloat(e.target.value))}
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

        {/* STEP 3: Choose Mentor */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-100 mb-1">Đồng hành cùng Mentor hướng dẫn (Tùy chọn)</h2>
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
                          ? 'bg-blue-950/20 border-blue-500/80 text-blue-300 shadow-inner'
                          : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs uppercase shadow-inner">
                          {m.user?.fullName.substring(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-slate-200 text-sm font-bold truncate">
                            {m.user?.fullName}
                          </p>
                          <p className="text-slate-500 text-xs truncate">
                            {m.user?.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center w-full mt-4">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                          Đồ án tốt nghiệp
                        </span>
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          isSelected ? 'bg-blue-600/20 text-blue-400' : 'bg-slate-800 text-slate-500'
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
          
          {step < 3 ? (
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
