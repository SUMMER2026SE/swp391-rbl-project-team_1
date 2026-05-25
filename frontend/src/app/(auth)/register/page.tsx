"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import Alert from "@/components/common/Alert";
import { KeyRound, Phone, Activity } from "lucide-react";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Simple validation
    if (!phone) {
      setError("Số điện thoại là bắt buộc");
      return;
    }
    if (!password) {
      setError("Mật khẩu là bắt buộc");
      return;
    }
    if (password.length < 6) {
      setError("Mật khẩu phải chứa ít nhất 6 ký tự");
      return;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu nhập lại không trùng khớp");
      return;
    }

    setLoading(true);
    try {
      await register(phone, password);
      setSuccess("Đăng ký tài khoản thành công! Đang tự động đăng nhập...");
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Đăng ký tài khoản thất bại. Số điện thoại có thể đã tồn tại.");
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
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Đăng ký tài khoản</h2>
          <p className="mt-2 text-sm text-slate-500">
            Tạo tài khoản MedBooking để trải nghiệm đặt lịch nhanh chóng
          </p>
        </div>

        {error && <Alert type="error" message={error} />}
        {success && <Alert type="success" message={success} />}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="relative">
            <Phone className="absolute left-3.5 top-9.5 h-4 w-4 text-slate-400 z-10" />
            <Input
              id="phone"
              type="text"
              label="Số điện thoại"
              placeholder="Nhập số điện thoại"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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

          <div className="relative">
            <KeyRound className="absolute left-3.5 top-9.5 h-4 w-4 text-slate-400 z-10" />
            <Input
              id="confirmPassword"
              type="password"
              label="Nhập lại mật khẩu"
              placeholder="Nhập lại mật khẩu xác nhận"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10"
              required
            />
          </div>

          <div className="pt-2">
            <Button type="submit" variant="teal" className="w-full py-3 text-base rounded-xl" isLoading={loading}>
              Đăng Ký Tài Khoản
            </Button>
          </div>
        </form>

        <div className="text-center pt-2">
          <p className="text-sm text-slate-600">
            Đã có tài khoản?{" "}
            <Link href="/login" className="font-semibold text-teal-600 hover:text-teal-700 transition-colors">
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
