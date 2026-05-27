"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import authService from "@/services/auth.service";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import Alert from "@/components/common/Alert";
import { Mail, Lock, KeyRound, Clock, Activity } from "lucide-react";

type ForgotPasswordStep = "email" | "otp" | "password";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<ForgotPasswordStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Handle email submission to send OTP
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email) {
      setError("Email là bắt buộc");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Email không hợp lệ");
      return;
    }

    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSuccess("Mã OTP khôi phục mật khẩu đã được gửi đến email của bạn");
      setStep("otp");
      startCountdown();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Không thể gửi OTP. Email có thể không tồn tại.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Start 60s countdown for OTP resend
  const startCountdown = () => {
    setResendCountdown(60);
    const interval = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Handle OTP verification
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!otp) {
      setError("Mã OTP là bắt buộc");
      return;
    }

    if (otp.length !== 6) {
      setError("Mã OTP phải có 6 chữ số");
      return;
    }

    setLoading(true);
    try {
      await authService.verifyResetOtp(email, otp);
      setSuccess("Mã OTP hợp lệ! Vui lòng nhập mật khẩu mới");
      setStep("password");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Mã OTP không hợp lệ hoặc đã hết hạn";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Handle password submission (reset password)
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!password) {
      setError("Mật khẩu mới là bắt buộc");
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu mới phải chứa ít nhất 6 ký tự");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không trùng khớp");
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(email, otp, password);
      setSuccess("Đặt lại mật khẩu thành công! Đang chuyển hướng về trang đăng nhập...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Không thể hoàn tất khôi phục mật khẩu";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0) return;

    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSuccess("Mã OTP mới đã được gửi");
      startCountdown();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Không thể gửi lại OTP";
      setError(message);
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
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all bg-teal-600 text-white">
            1
          </div>
          <div className={`h-1 w-8 transition-all ${step !== "email" ? "bg-teal-600" : "bg-slate-200"}`} />
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all ${
              step === "otp" || step === "password" ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-600"
            }`}
          >
            2
          </div>
          <div className={`h-1 w-8 transition-all ${step === "password" ? "bg-teal-600" : "bg-slate-200"}`} />
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all ${
              step === "password" ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-600"
            }`}
          >
            3
          </div>
        </div>

        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-xl bg-teal-50 text-teal-600 mb-4">
            <Activity className="h-6 w-6 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {step === "email" && "Quên Mật Khẩu"}
            {step === "otp" && "Xác Nhận OTP"}
            {step === "password" && "Đặt Lại Mật Khẩu"}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {step === "email" && "Nhập email đã đăng ký để nhận mã OTP khôi phục mật khẩu"}
            {step === "otp" && `Nhập mã OTP 6 số đã được gửi tới email ${email}`}
            {step === "password" && "Nhập mật khẩu mới cho tài khoản của bạn"}
          </p>
        </div>

        {error && <Alert type="error" message={error} />}
        {success && <Alert type="success" message={success} />}

        {/* Email step */}
        {step === "email" && (
          <form className="mt-8 space-y-5" onSubmit={handleEmailSubmit}>
            <div className="relative">
              <Mail className="absolute left-3.5 top-9.5 h-4 w-4 text-slate-400 z-10" />
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

            <div className="pt-2">
              <Button type="submit" variant="teal" className="w-full py-3 text-base rounded-xl" isLoading={loading}>
                Gửi Mã Xác Nhận OTP
              </Button>
            </div>
          </form>
        )}

        {/* OTP step */}
        {step === "otp" && (
          <form className="mt-8 space-y-5" onSubmit={handleOtpSubmit}>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-9.5 h-4 w-4 text-slate-400 z-10" />
              <Input
                id="otp"
                type="text"
                label="Mã OTP"
                placeholder="Nhập 6 chữ số OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="pl-10 text-center text-2xl tracking-widest"
                maxLength={6}
                required
              />
            </div>

            <div className="flex items-center justify-between text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Hết hạn trong 5 phút
              </span>
            </div>

            <div className="pt-2">
              <Button type="submit" variant="teal" className="w-full py-3 text-base rounded-xl" isLoading={loading}>
                Xác Nhận OTP
              </Button>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCountdown > 0 || loading}
                className="text-sm text-teal-600 hover:text-teal-700 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                {resendCountdown > 0 ? `Gửi lại trong ${resendCountdown}s` : "Gửi lại mã OTP"}
              </button>
            </div>
          </form>
        )}

        {/* Password step */}
        {step === "password" && (
          <form className="mt-8 space-y-5" onSubmit={handlePasswordSubmit}>
            <div className="relative">
              <Lock className="absolute left-3.5 top-9.5 h-4 w-4 text-slate-400 z-10" />
              <Input
                id="password"
                type="password"
                label="Mật khẩu mới"
                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3.5 top-9.5 h-4 w-4 text-slate-400 z-10" />
              <Input
                id="confirmPassword"
                type="password"
                label="Nhập lại mật khẩu mới"
                placeholder="Xác nhận lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10"
                required
              />
            </div>

            <div className="pt-2">
              <Button type="submit" variant="teal" className="w-full py-3 text-base rounded-xl" isLoading={loading}>
                Đặt Lại Mật Khẩu
              </Button>
            </div>
          </form>
        )}

        <div className="text-center pt-2">
          <p className="text-sm text-slate-600">
            Quay lại{" "}
            <Link href="/login" className="font-semibold text-teal-600 hover:text-teal-700 transition-colors">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
