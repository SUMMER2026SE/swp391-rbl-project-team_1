'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import { KeyRound, Lock, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../services/api';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';

  const [code, setCode] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (!emailParam) {
      toast.error('Không tìm thấy email. Vui lòng bắt đầu lại từ trang quên mật khẩu.');
      router.push('/forgot-password');
    }
  }, [emailParam, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp.');
      return;
    }

    if (code.length !== 6) {
      toast.error('Mã OTP phải bao gồm 6 chữ số.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/auth/reset-password', {
        email: emailParam,
        code,
        newPassword
      });

      if (res.data.success) {
        toast.success('Khôi phục mật khẩu thành công!');
        router.push('/login');
      } else {
        toast.error(res.data.message || 'Khôi phục thất bại.');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        label="Mã OTP"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Nhập 6 chữ số"
        type="text"
        icon={<KeyRound className="w-4 h-4" />}
        required
      />
      <Input
        label="Mật khẩu mới"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder="Nhập mật khẩu mới"
        type="password"
        icon={<Lock className="w-4 h-4" />}
        required
      />
      <Input
        label="Xác nhận mật khẩu"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Nhập lại mật khẩu"
        type="password"
        icon={<Lock className="w-4 h-4" />}
        required
      />
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
      </Button>

      <Link
        href="/login"
        className="flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-300 font-medium transition-colors mt-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại đăng nhập
      </Link>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-slate-950/70 z-10">
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <KeyRound className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100 mt-2">Đặt lại mật khẩu</h2>
          <p className="text-slate-500 text-sm font-medium text-center mt-2 px-4">
            Vui lòng nhập mã OTP đã nhận qua email và mật khẩu mới của bạn.
          </p>
        </div>

        <React.Suspense fallback={<div className="text-center text-slate-500">Đang tải biểu mẫu...</div>}>
          <ResetPasswordForm />
        </React.Suspense>
      </div>
    </div>
  );
}
