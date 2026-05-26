"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import Alert from "@/components/common/Alert";
import { KeyRound, User, Activity } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Simple validation
    if (!email) {
      setError("Email là bắt buộc");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Email không đúng định dạng");
      return;
    }
    if (!password) {
      setError("Mật khẩu là bắt buộc");
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      setSuccess("Đăng nhập thành công! Đang chuyển hướng...");
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại email hoặc mật khẩu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 relative overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl border border-slate-100 shadow-xl relative z-10">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-xl bg-teal-50 text-teal-600 mb-4">
            <Activity className="h-6 w-6 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Mừng bạn quay trở lại</h2>
          <p className="mt-2 text-sm text-slate-500">
            Đăng nhập để đặt lịch khám bệnh và xem kết quả nhanh chóng
          </p>
        </div>

        {error && <Alert type="error" message={error} />}
        {success && <Alert type="success" message={success} />}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="relative">
            <User className="absolute left-3.5 top-9.5 h-4 w-4 text-slate-400 z-10" />
            <Input
              id="email"
              type="email"
              label="Email"
              placeholder="Nhập email của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              required
            />
          </div>

          <div className="relative">
            <KeyRound className="absolute left-3.5 top-9.5 h-4 w-4 text-slate-400 z-10" />
            <Input
              id="password"
              type="password"
              label="Mật khẩu"
              placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10"
              required
            />
          </div>

          <div className="pt-2">
            <Button type="submit" variant="teal" className="w-full py-3 text-base rounded-xl" isLoading={loading}>
              Đăng Nhập
            </Button>
          </div>
        </form>

        <div className="text-center pt-2">
          <p className="text-sm text-slate-600">
            Chưa có tài khoản?{" "}
            <Link href="/register" className="font-semibold text-teal-600 hover:text-teal-700 transition-colors">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
