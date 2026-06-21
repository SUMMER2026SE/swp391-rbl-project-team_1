'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import { Mail, ArrowLeft, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import { useRouter } from 'next/navigation';
import { handleError } from '../../../utils/errorHandler';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!email) {
      handleError('Vui lòng nhập địa chỉ email.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      handleError('Định dạng email không hợp lệ.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      if (res.data.success) {
        setIsSuccess(true);
        toast.success('Mã OTP khôi phục đã được gửi!');
      } else {
        handleError(res.data.message || 'Có lỗi xảy ra.');
      }
    } catch (error: any) {
      handleError(error, 'Không thể gửi yêu cầu lúc này.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-slate-950/70 z-10">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-orange-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <ShieldCheckIcon />
          </div>
          <h2 className="text-2xl font-bold text-slate-100 mt-2">Khôi phục mật khẩu</h2>
          <p className="text-slate-500 text-sm font-medium text-center mt-2 px-4">
            Nhập email của bạn và chúng tôi sẽ gửi liên kết để đặt lại mật khẩu.
          </p>
        </div>

        {isSuccess ? (
          <div className="space-y-6 text-center">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6">
              <h3 className="text-emerald-400 font-semibold mb-2">Đã gửi email thành công</h3>
              <p className="text-slate-400 text-sm">
                Vui lòng kiểm tra hộp thư đến của <strong>{email}</strong> để nhận hướng dẫn đặt lại mật khẩu.
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => router.push(`/reset-password?email=${encodeURIComponent(email)}`)}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              <KeyRound className="w-5 h-5 mr-2 inline" />
              Nhập mã OTP đặt lại mật khẩu
            </Button>
            <Link
              href="/login"
              className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl py-3 font-semibold transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Quay lại đăng nhập
            </Link>
          </div>
        ) : (
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

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-4 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 shadow-rose-500/25"
              isLoading={isSubmitting}
            >
              Gửi liên kết khôi phục
            </Button>

            <Link
              href="/login"
              className="flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-300 font-medium transition-colors mt-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại đăng nhập
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}

function ShieldCheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
      <path d="m9 12 2 2 4-4"></path>
    </svg>
  );
}
