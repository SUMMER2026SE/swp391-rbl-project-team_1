'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import useAuth from '../../../hooks/useAuth';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import { Mail, Lock, User as UserIcon, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { registerUser, verifyOtpCode } = useAuth();
  
  // Registration state
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Password strength calculations
  const [pwdStrength, setPwdStrength] = useState<'WEAK' | 'MEDIUM' | 'STRONG'>('WEAK');

  // OTP Verification state
  const [otpCodes, setOtpCodes] = useState<string[]>(Array(6).fill(''));
  const [countdown, setCountdown] = useState<number>(60);
  const [canResend, setCanResend] = useState<boolean>(false);
  const otpInputRefs = useRef<HTMLInputElement[]>([]);

  // Calculate password strength
  useEffect(() => {
    if (!password) {
      setPwdStrength('WEAK');
      return;
    }
    const hasLetters = /[a-zA-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecials = /[^a-zA-Z0-9]/.test(password);

    const length = password.length;
    if (length >= 10 && hasLetters && hasNumbers && hasSpecials) {
      setPwdStrength('STRONG');
    } else if (length >= 8 && hasLetters && hasNumbers) {
      setPwdStrength('MEDIUM');
    } else {
      setPwdStrength('WEAK');
    }
  }, [password]);

  // Handle OTP countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, countdown]);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      toast.error('Vui lòng điền đầy đủ thông tin đăng ký.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Định dạng email không hợp lệ.');
      return;
    }

    if (password.length < 8) {
      toast.error('Mật khẩu phải dài ít nhất 8 ký tự.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Mật khẩu nhập lại không khớp.');
      return;
    }

    setIsSubmitting(true);
    try {
      await registerUser(email, password, fullName);
      setStep(2);
      setCountdown(60);
      setCanResend(false);
    } catch (_) {
      // errors handled by auth provider toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    if (!/^[0-9]?$/.test(val)) return; // Allow numbers only, max length 1

    const newCodes = [...otpCodes];
    newCodes[index] = val;
    setOtpCodes(newCodes);

    // Auto focus next input
    if (val && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpCodes[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const codeStr = otpCodes.join('');
    if (codeStr.length < 6) {
      toast.error('Vui lòng điền đầy đủ 6 số OTP.');
      return;
    }

    setIsSubmitting(true);
    try {
      await verifyOtpCode(email, codeStr);
    } catch (_) {
      // error toast handled in AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setIsSubmitting(true);
    try {
      await registerUser(email, password, fullName);
      setCountdown(60);
      setCanResend(false);
      setOtpCodes(Array(6).fill(''));
      otpInputRefs.current[0]?.focus();
      toast.success('Mã OTP mới đã được gửi.');
    } catch (_) {
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-12 bg-slate-950 font-sans">
      {/* Left panel: Info & Tagline (Hidden on mobile) */}
      <div className="hidden md:flex md:col-span-5 bg-slate-900 border-r border-slate-800 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_100%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />
        
        {/* Brand */}
        <Link href="/student/dashboard" className="flex items-center gap-3 z-10">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-white font-extrabold text-2xl">E</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-lg tracking-wide leading-none">EduPath</h1>
            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Adaptive Learning</span>
          </div>
        </Link>

        {/* Tagline */}
        <div className="z-10 space-y-6">
          <h2 className="text-3xl font-extrabold text-white leading-tight">
            Chinh phục mục tiêu học tập cùng <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Trí tuệ nhân tạo</span>
          </h2>
          <ul className="space-y-4 text-slate-400 text-sm font-semibold">
            <li className="flex items-start gap-3">
              <span className="text-blue-500 mt-1">✓</span>
              <span>Lộ trình cá nhân hóa tự động tối ưu hóa theo thời gian học</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-500 mt-1">✓</span>
              <span>Đánh giá năng lực thực tế bằng mô hình Bayesian Knowledge Tracing (BKT)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-500 mt-1">✓</span>
              <span>Cảnh báo sớm nguy cơ trì trệ / bỏ cuộc lộ trình để kịp thời hỗ trợ cùng Mentor</span>
            </li>
          </ul>
        </div>

        {/* Bottom stats footer */}
        <div className="z-10 border-t border-slate-800/80 pt-6 flex justify-between text-slate-500 text-xs">
          <span>SWP391 Capstone Project</span>
          <span>FPT University</span>
        </div>
      </div>

      {/* Right panel: Registration Form */}
      <div className="col-span-1 md:col-span-7 flex items-center justify-center p-8 relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none md:hidden" />

        <div className="w-full max-w-md bg-slate-900/40 border border-slate-900 rounded-3xl p-8 shadow-2xl md:bg-transparent md:border-none md:shadow-none z-10">
          
          {step === 1 ? (
            /* STEP 1: Registration Form */
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-100 mb-1.5">Tạo tài khoản mới</h2>
                <p className="text-slate-500 text-sm font-semibold">
                  Bắt đầu học tập thông minh và xây dựng lộ trình thích ứng riêng bạn
                </p>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-5">
                <Input
                  label="Họ và tên"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  icon={<UserIcon className="w-5 h-5 text-slate-600" />}
                  required
                />

                <Input
                  label="Địa chỉ Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="anv@student.fpt.edu.vn"
                  icon={<Mail className="w-5 h-5 text-slate-600" />}
                  required
                />

                <div className="relative">
                  <Input
                    label="Mật khẩu"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tối thiểu 8 ký tự"
                    icon={<Lock className="w-5 h-5 text-slate-600" />}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 bottom-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {password && (
                  <div className="space-y-1.5 select-none">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      <span>Độ mạnh mật khẩu</span>
                      <span className={
                        pwdStrength === 'STRONG' ? 'text-emerald-400' :
                        pwdStrength === 'MEDIUM' ? 'text-amber-400' : 'text-rose-500'
                      }>
                        {pwdStrength === 'STRONG' ? 'Mạnh' :
                         pwdStrength === 'MEDIUM' ? 'Trung bình' : 'Yếu'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-300 ${
                        password ? (pwdStrength === 'STRONG' || pwdStrength === 'MEDIUM' || pwdStrength === 'WEAK' ? 'bg-rose-500' : 'bg-slate-800') : 'bg-slate-800'
                      }`} />
                      <div className={`h-full rounded-full transition-all duration-300 ${
                        pwdStrength === 'STRONG' || pwdStrength === 'MEDIUM' ? 'bg-amber-500' : 'bg-slate-800'
                      }`} />
                      <div className={`h-full rounded-full transition-all duration-300 ${
                        pwdStrength === 'STRONG' ? 'bg-emerald-500' : 'bg-slate-800'
                      }`} />
                    </div>
                  </div>
                )}

                <Input
                  label="Nhập lại mật khẩu"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  icon={<ShieldCheck className="w-5 h-5 text-slate-600" />}
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full mt-2"
                  isLoading={isSubmitting}
                >
                  Đăng ký tài khoản
                </Button>
              </form>

              <div className="text-center text-xs font-semibold text-slate-500 mt-6 select-none">
                Đã có tài khoản?{' '}
                <Link
                  href="/login"
                  className="text-blue-400 hover:text-blue-300 font-bold transition-colors"
                >
                  Đăng nhập
                </Link>
              </div>
            </>
          ) : (
            /* STEP 2: OTP Verification */
            <>
              <div className="mb-8 text-center md:text-left">
                <h2 className="text-2xl font-bold text-slate-100 mb-1.5 flex items-center justify-center md:justify-start gap-2">
                  <ShieldCheck className="w-7 h-7 text-blue-500" />
                  <span>Xác thực tài khoản</span>
                </h2>
                <p className="text-slate-500 text-sm font-semibold">
                  Mã xác thực OTP gồm 6 chữ số đã được gửi tới email <span className="text-slate-300">{email}</span>. Vui lòng nhập mã dưới đây:
                </p>
              </div>

              <form onSubmit={handleVerifySubmit} className="space-y-6">
                <div className="flex justify-between gap-2.5">
                  {otpCodes.map((code, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        if (el) otpInputRefs.current[index] = el;
                      }}
                      type="text"
                      maxLength={1}
                      value={code}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-12 h-14 bg-slate-900 border border-slate-800 rounded-xl text-center text-xl font-bold text-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                    />
                  ))}
                </div>

                <div className="text-center select-none">
                  {canResend ? (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="text-sm text-blue-400 hover:text-blue-300 font-bold transition-colors"
                      disabled={isSubmitting}
                    >
                      Gửi lại mã OTP
                    </button>
                  ) : (
                    <span className="text-xs text-slate-500 font-semibold">
                      Gửi lại mã OTP sau ({countdown}s)
                    </span>
                  )}
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setStep(1)}
                    disabled={isSubmitting}
                  >
                    Quay lại
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="flex-1"
                    isLoading={isSubmitting}
                  >
                    Xác nhận
                  </Button>
                </div>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
