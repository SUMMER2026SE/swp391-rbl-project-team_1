'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../../../../services/api';
import useAuth from '../../../../hooks/useAuth';
import useSocket from '../../../../hooks/useSocket';
import Button from '../../../../components/common/Button';
import LoadingSpinner from '../../../../components/common/LoadingSpinner';
import {
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  LayoutDashboard,
  Compass
} from 'lucide-react';
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Option {
  text: string;
}

interface Question {
  id: string;
  question: string;
  options: Option[];
  difficulty: string;
}

export default function QuizPage() {
  const { skillId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { emit } = useSocket() as any; // socket connection

  // Loading states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Timer states
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Attempt states
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [correctOptionIndex, setCorrectOptionIndex] = useState<number>(-1);
  const [explanation, setExplanation] = useState<string>('');
  const [timeSpent, setTimeSpent] = useState<number>(0);

  // Mastery & Risk delta states
  const [masteryBefore, setMasteryBefore] = useState<number>(0.3);
  const [masteryAfter, setMasteryAfter] = useState<number>(0.3);
  const [newRiskScore, setNewRiskScore] = useState<number>(0);

  // Quiz end states
  const [isQuizFinished, setIsQuizFinished] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [attemptsLog, setAttemptsLog] = useState<any[]>([]);

  // BKT LineChart history after completing quiz
  const [bktHistoryData, setBktHistoryData] = useState<any[]>([]);

  useEffect(() => {
    loadQuestions();
  }, [skillId]);

  // Handle question timer countdown
  useEffect(() => {
    if (isLoading || isQuizFinished || questions.length === 0) return;

    if (timeLeft <= 0) {
      // Auto-submit incorrect when timer expires
      handleTimeout();
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => prev - 1);
      setTimeSpent(prev => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeft, isLoading, isQuizFinished, questions]);

  const loadQuestions = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/quiz/questions/${skillId}?limit=5`);
      if (response.data.success) {
        setQuestions(response.data.questions);
        setCurrentIndex(0);
        resetQuestionState();
        setIsQuizFinished(false);
        setScore(0);
        setAttemptsLog([]);
      }
    } catch (error) {
      toast.error('Lỗi khi tải câu hỏi trắc nghiệm.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetQuestionState = () => {
    setTimeLeft(60);
    setTimeSpent(0);
    setSelectedOption(null);
    setIsSubmitted(false);
    setIsCorrect(false);
    setCorrectOptionIndex(-1);
    setExplanation('');
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleTimeout = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsSubmitted(true);
    setIsCorrect(false);
    setSelectedOption(-1); // Timer ran out

    // Submit request to server as incorrect
    try {
      const currentQuestion = questions[currentIndex];
      const res = await api.post('/quiz/submit', {
        questionId: currentQuestion.id,
        selectedOption: 0, // Fallback index
        timeSpentSec: 60
      });

      if (res.data.success) {
        setCorrectOptionIndex(res.data.correctOptionIndex);
        setExplanation(res.data.explanation || 'Hết giờ làm bài!');
        setMasteryBefore(res.data.masteryBefore);
        setMasteryAfter(res.data.masteryAfter);
        setNewRiskScore(res.data.newRiskScore);
        
        setAttemptsLog(prev => [...prev, { correct: false, before: res.data.masteryBefore, after: res.data.masteryAfter }]);
      }
    } catch (_) {
      toast.error('Mất kết nối với máy chủ khi chấm bài.');
    }
  };

  const handleSelectOption = async (optionIdx: number) => {
    if (isSubmitted) return; // Prevent double submit
    if (timerRef.current) clearInterval(timerRef.current);
    
    setSelectedOption(optionIdx);
    setIsSubmitted(true);

    try {
      const currentQuestion = questions[currentIndex];
      const res = await api.post('/quiz/submit', {
        questionId: currentQuestion.id,
        selectedOption: optionIdx,
        timeSpentSec: timeSpent
      });

      if (res.data.success) {
        const correct = res.data.isCorrect;
        setIsCorrect(correct);
        setCorrectOptionIndex(res.data.correctOptionIndex);
        setExplanation(res.data.explanation || '');
        setMasteryBefore(res.data.masteryBefore);
        setMasteryAfter(res.data.masteryAfter);
        setNewRiskScore(res.data.newRiskScore);

        if (correct) {
          setScore(prev => prev + 1);
        }

        setAttemptsLog(prev => [...prev, { correct, before: res.data.masteryBefore, after: res.data.masteryAfter }]);
      }
    } catch (_) {
      toast.error('Lỗi khi lưu kết quả câu hỏi.');
    }
  };

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      resetQuestionState();
    } else {
      // Quiz finished
      setIsQuizFinished(true);
      await loadBktChartData();
    }
  };

  const loadBktChartData = async () => {
    try {
      const response = await api.get(`/bkt/history/${skillId}`);
      if (response.data.success) {
        // Format history for LineChart
        const formatted = response.data.history.slice(-10).map((h: any, idx: number) => ({
          name: `Lần ${idx + 1}`,
          mastery: Math.round(h.masteryAfter * 100),
          correct: h.wasCorrect
        }));
        setBktHistoryData(formatted);
      }
    } catch (_) {}
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-950">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 bg-slate-950">
        <AlertTriangle className="w-12 h-12 text-amber-500 stroke-1 mb-4" />
        <h3 className="text-slate-100 font-bold text-lg">Chưa có câu hỏi ôn tập</h3>
        <p className="text-slate-500 text-sm max-w-sm mt-1">
          Mentor chưa thiết kế bộ trắc nghiệm cho kỹ năng này. Vui lòng quay lại sau.
        </p>
        <Button variant="secondary" className="mt-5" onClick={() => router.back()}>
          Quay lại
        </Button>
      </div>
    );
  }

  // Circular timer constants
  const currentQuestion = questions[currentIndex];
  const totalDuration = 60;
  const radius = 24;
  const stroke = 4;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (timeLeft / totalDuration) * circumference;

  let timerColor = 'stroke-blue-500';
  if (timeLeft < 30 && timeLeft >= 10) timerColor = 'stroke-amber-500 animate-pulse';
  if (timeLeft < 10) timerColor = 'stroke-rose-500 animate-ping-slow';

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between select-none font-sans relative">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Header bar */}
      <header className="h-16 border-b border-slate-900 px-6 flex items-center justify-between z-10 bg-slate-950/75 backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="text-xs bg-slate-900 border border-slate-800 text-slate-400 font-bold px-3 py-1 rounded-full uppercase">
            Quiz Focus Mode
          </span>
          <span className="text-slate-500 text-xs font-semibold">
            Câu {currentIndex + 1} / {questions.length}
          </span>
        </div>
        <button
          onClick={() => {
            if (window.confirm('Bạn có chắc muốn thoát? Kết quả chưa hoàn tất sẽ không được lưu.')) {
              router.back();
            }
          }}
          className="text-xs text-slate-500 hover:text-slate-300 font-bold"
        >
          Thoát Focus Mode
        </button>
      </header>

      {/* Main Focus Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto flex flex-col justify-center px-4 py-8 z-10">
        {!isQuizFinished ? (
          /* ACTIVE QUIZ QUESTION */
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
              
              {/* Question header row */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-5">
                <span className={`text-[10px] border px-2 py-0.5 rounded-full font-bold bg-blue-950/20 border-blue-900/30 text-blue-400`}>
                  {currentQuestion.difficulty}
                </span>

                {/* SVG Countdown timer */}
                <div className="relative w-14 h-14 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" width={radius * 2} height={radius * 2}>
                    <circle
                      className="stroke-slate-800 fill-transparent"
                      strokeWidth={stroke}
                      r={normalizedRadius}
                      cx={radius}
                      cy={radius}
                    />
                    <circle
                      className={`${timerColor} fill-transparent transition-all duration-1000 ease-linear`}
                      strokeWidth={stroke}
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      r={normalizedRadius}
                      cx={radius}
                      cy={radius}
                    />
                  </svg>
                  <span className="absolute text-xs font-black text-slate-200">{timeLeft}</span>
                </div>
              </div>

              {/* Question Title */}
              <h3 className="text-slate-100 font-bold text-base md:text-lg leading-relaxed mb-6">
                {currentQuestion.question}
              </h3>

              {/* Choices option list */}
              <div className="space-y-3">
                {currentQuestion.options.map((opt, idx) => {
                  const prefix = String.fromCharCode(65 + idx); // A, B, C, D
                  const isSelected = selectedOption === idx;
                  const isCorrectAnswer = correctOptionIndex === idx;

                  let optionStyle = 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200';
                  let RightIcon = null;

                  if (isSubmitted) {
                    if (isCorrectAnswer) {
                      optionStyle = 'bg-emerald-950/20 border-emerald-500/80 text-emerald-300';
                      RightIcon = <CheckCircle className="w-5 h-5 text-emerald-400" />;
                    } else if (isSelected) {
                      optionStyle = 'bg-rose-950/20 border-rose-500/80 text-rose-300';
                      RightIcon = <XCircle className="w-5 h-5 text-rose-400" />;
                    } else {
                      optionStyle = 'bg-slate-950/20 border-slate-900 text-slate-600 cursor-not-allowed';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(idx)}
                      disabled={isSubmitted}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border text-left text-sm font-semibold transition-all duration-300 group ${optionStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs border ${
                          isSelected ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-500 group-hover:border-slate-700'
                        }`}>
                          {prefix}
                        </span>
                        <span>{opt.text}</span>
                      </div>
                      {RightIcon}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Answer Explanation Box */}
            {isSubmitted && (
              <div className="space-y-4 animate-slide-up">
                <div className={`p-6 border-l-4 rounded-2xl bg-slate-900/50 ${
                  isCorrect ? 'border-emerald-500 bg-emerald-950/5' : 'border-rose-500 bg-rose-950/5'
                }`}>
                  <h4 className={`text-sm font-bold flex items-center gap-1.5 ${
                    isCorrect ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {isCorrect ? 'Chính xác! 🎉' : 'Chưa chính xác 🙁'}
                  </h4>
                  {explanation && (
                    <p className="text-slate-400 text-xs leading-relaxed mt-2">
                      <span className="font-bold text-slate-200">Giải thích:</span> {explanation}
                    </p>
                  )}
                  
                  {/* BKT Update indicators */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <span>Độ thành thạo (BKT)</span>
                    <span className="flex items-center gap-1">
                      {Math.round(masteryBefore * 100)}%
                      <span className="text-slate-600">→</span>
                      <span className={masteryAfter >= masteryBefore ? 'text-emerald-400' : 'text-rose-400'}>
                        {Math.round(masteryAfter * 100)}% {masteryAfter >= masteryBefore ? '📈' : '📉'}
                      </span>
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleNext}
                  variant="primary"
                  className="w-full py-3"
                >
                  <span>{currentIndex < questions.length - 1 ? 'Câu tiếp theo' : 'Xem kết quả'}</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* SUMMARY RESULT SCREEN */
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center flex flex-col items-center">
              
              {/* Score visual badge */}
              <div className="w-24 h-24 rounded-full bg-blue-500/10 border-4 border-blue-900/50 flex items-center justify-center text-slate-100 mb-6 shadow-inner animate-pulse-slow">
                <div className="flex flex-col items-center justify-center">
                  <span className="text-3xl font-black">{score}</span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">/ {questions.length}</span>
                </div>
              </div>

              <h2 className="text-xl font-bold text-slate-100">
                {score >= questions.length * 0.8 ? 'Quá tuyệt vời! 🎉' : 'Hãy cố gắng hơn nữa! 💪'}
              </h2>
              <p className="text-slate-500 text-xs max-w-sm mt-1.5 leading-relaxed font-semibold">
                Bạn đã hoàn thành bộ quiz. Hệ thống BKT đã cập nhật thành công mức độ thành thạo của kỹ năng này.
              </p>

              {/* BKT Mastery history chart */}
              {bktHistoryData.length > 0 && (
                <div className="w-full h-48 border border-slate-800/80 rounded-2xl p-4 mt-8 bg-slate-950/20 select-none">
                  <div className="text-left mb-2.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Biểu đồ thành thạo kỹ năng</span>
                  </div>
                  <ResponsiveContainer width="100%" height="90%">
                    <LineChart data={bktHistoryData}>
                      <XAxis dataKey="name" stroke="#475569" fontSize={8} tickLine={false} />
                      <YAxis domain={[0, 100]} stroke="#475569" fontSize={8} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 10 }} />
                      <Line
                        type="monotone"
                        dataKey="mastery"
                        stroke="#3b82f6"
                        strokeWidth={2.5}
                        dot={{ r: 4, stroke: '#1d4ed8', fill: '#3b82f6', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Risk delta summary badge */}
              <div className="w-full flex items-center justify-between p-4 bg-slate-950/40 border border-slate-800/60 rounded-xl mt-6">
                <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <span>Dự báo rủi ro học tập</span>
                </span>
                <span className="text-xs font-black text-slate-200">
                  {newRiskScore}% {newRiskScore > 70 ? '⚠️ Nguy hiểm' : '✅ An toàn'}
                </span>
              </div>
            </div>

            {/* Post-Quiz Actions */}
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant="secondary"
                onClick={loadQuestions}
                className="py-3 flex flex-col sm:flex-row items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Làm lại</span>
              </Button>
              <Button
                variant="secondary"
                onClick={() => router.push('/student/dashboard')}
                className="py-3 flex flex-col sm:flex-row items-center gap-1.5"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
              <Button
                variant="primary"
                onClick={() => router.push('/student/roadmap')}
                className="py-3 flex flex-col sm:flex-row items-center gap-1.5"
              >
                <Compass className="w-4 h-4" />
                <span className="hidden sm:inline">Lộ trình</span>
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Empty footer space */}
      <footer className="h-6" />
    </div>
  );
}
