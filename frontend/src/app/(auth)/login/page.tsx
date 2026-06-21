'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import useAuth from '../../../hooks/useAuth';
import { GoogleLogin } from '@react-oauth/google';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { handleError } from '@/utils/errorHandler';

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!email || !password) {
      handleError('Vui lòng điền đầy đủ thông tin đăng nhập.');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      handleError('Định dạng email không hợp lệ.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password, rememberMe);
    } catch (_) {
      // toast is triggered inside login helper
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      
      {/* Login Card */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-slate-950/70 z-10">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-white font-extrabold text-2xl">E</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-100 mt-2">Chào mừng trở lại!</h2>
          <p className="text-slate-500 text-sm font-medium text-center">
            Đăng nhập vào hệ thống cá nhân hóa học tập thích ứng EduPath
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Địa chỉ Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@student.fpt.edu.vn"
            icon={<Mail className="w-5 h-5 text-slate-600" />}
            required
          />

          <div className="relative">
            <Input
              label="Mật khẩu"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
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

          {/* Remember & Forgot */}
          <div className="flex items-center justify-between text-xs font-semibold select-none">
            <label className="flex items-center gap-2 text-slate-400 hover:text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-900 border-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-950"
              />
              <span>Ghi nhớ đăng nhập</span>
            </label>
            <Link
              href="/forgot-password"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Quên mật khẩu?
            </Link>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            className="w-full mt-2"
            isLoading={isSubmitting}
          >
            Đăng nhập
          </Button>
        </form>

        {/* OAuth options */}
        <div className="relative flex items-center justify-center my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <span className="relative px-3 bg-slate-900 text-slate-500 text-xs font-bold uppercase">
            hoặc
          </span>
        </div>

        <div className="flex justify-center w-full">
          <div className="w-full flex justify-center [&>div]:w-full [&>div>div]:w-full [&>div>div>iframe]:w-full hover:opacity-90 transition-opacity">
            <GoogleLogin
              onSuccess={credentialResponse => {
                if (credentialResponse.credential) {
                  loginWithGoogle(credentialResponse.credential);
                }
              }}
              onError={() => {
                handleError('Đăng nhập Google thất bại');
              }}
              useOneTap
              theme="outline"
              shape="pill"
              text="signin_with"
              width="384"
            />
          </div>
        </div>

        {/* Footer Link */}
        <div className="text-center text-xs font-medium text-slate-500 mt-6 select-none">
          Chưa có tài khoản?{' '}
          <Link
            href="/register"
            className="text-blue-400 hover:text-blue-300 font-bold transition-colors"
          >
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
