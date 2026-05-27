"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import Alert from "@/components/common/Alert";
import { Mail, Lock, KeyRound, Clock } from "lucide-react";

type RegisterStep = "email" | "otp" | "password";

export default function RegisterPage() {
  const { sendOtp, verifyOtp, register, googleLogin } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<RegisterStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Handle Google Login Callback
  const handleGoogleLoginResponse = async (response: { credential?: string }) => {
    if (!response.credential) {
      setError("Không nhận được thông tin xác thực từ Google");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await googleLogin(response.credential);
      setSuccess("Đăng nhập bằng Google thành công! Đang chuyển hướng...");
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 1000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Đăng nhập bằng Google thất bại";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Load Google Identity Services SDK dynamically
  useEffect(() => {
    if (step !== "email") return;

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "1055745812345-dummyclientid.apps.googleusercontent.com";
      
      // @ts-ignore
      if (window.google && window.google.accounts) {
        // @ts-ignore
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleLoginResponse,
        });

        const googleBtn = document.getElementById("google-register-btn");
        if (googleBtn) {
          // @ts-ignore
          window.google.accounts.id.renderButton(googleBtn, {
            theme: "outline",
            size: "large",
            width: 382,
            text: "signup_with",
            shape: "rectangular",
          });
        }
      }
    };

    return () => {
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript && existingScript.parentNode) {
        existingScript.parentNode.removeChild(existingScript);
      }
    };
  }, [step]);

  // Handle email submission
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
      await sendOtp(email);
      setSuccess("Mã OTP đã được gửi đến email của bạn");
      setStep("otp");
      setResendCountdown(60);

      // Countdown for resend
      const interval = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Không thể gửi OTP. Email có thể đã tồn tại.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP submission
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
      await verifyOtp(email, otp);
      setSuccess("Mã OTP hợp lệ! Vui lòng nhập mật khẩu");
      setStep("password");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Mã OTP không hợp lệ hoặc đã hết hạn";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Handle password submission
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

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
      await register(email, otp, password);
      setSuccess("Đăng ký thành công! Đang chuyển hướng...");
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 1200);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Không thể hoàn tất đăng ký";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0) return;

    setError(null);
    setLoading(true);
    try {
      await sendOtp(email);
      setSuccess("Mã OTP mới đã được gửi");
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

      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-2xl border border-slate-100 shadow-xl relative z-10">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
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
          {step === "email" && <Mail className="h-12 w-12 text-teal-600 mx-auto mb-4" />}
          {step === "otp" && <KeyRound className="h-12 w-12 text-teal-600 mx-auto mb-4" />}
          {step === "password" && <Lock className="h-12 w-12 text-teal-600 mx-auto mb-4" />}

          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {step === "email" && "Nhập Email"}
            {step === "otp" && "Xác Nhận OTP"}
            {step === "password" && "Tạo Mật Khẩu"}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {step === "email" && "Tạo tài khoản MedBooking để trải nghiệm đặt lịch nhanh chóng"}
            {step === "otp" && `Nhập mã OTP đã được gửi đến ${email}`}
            {step === "password" && "Tạo mật khẩu mạnh để bảo vệ tài khoản"}
          </p>
        </div>

        {error && <Alert type="error" message={error} />}
        {success && <Alert type="success" message={success} />}

        {/* Email step */}
        {step === "email" && (
          <>
            <form className="mt-6 space-y-4" onSubmit={handleEmailSubmit}>
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
                  Gửi Mã OTP
                </Button>
              </div>
            </form>

            <div className="relative my-6 flex items-center justify-center">
              <div className="absolute inset-0 border-t border-slate-200" />
              <span className="relative px-4 bg-white text-xs text-slate-500 font-medium">HOẶC ĐĂNG KÝ BẰNG</span>
            </div>

            {/* Google Register Button Container */}
            <div className="flex justify-center">
              <div id="google-register-btn" className="w-full max-w-sm" />
            </div>
          </>
        )}

        {/* OTP step */}
        {step === "otp" && (
          <form className="mt-6 space-y-4" onSubmit={handleOtpSubmit}>
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
                className="text-sm text-teal-600 hover:text-teal-700 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
              >
                {resendCountdown > 0 ? `Gửi lại trong ${resendCountdown}s` : "Gửi lại mã OTP"}
              </button>
            </div>
          </form>
        )}

        {/* Password step */}
        {step === "password" && (
          <form className="mt-6 space-y-4" onSubmit={handlePasswordSubmit}>
            <div className="relative">
              <Lock className="absolute left-3.5 top-9.5 h-4 w-4 text-slate-400 z-10" />
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
              <Lock className="absolute left-3.5 top-9.5 h-4 w-4 text-slate-400 z-10" />
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
                Hoàn Tất Đăng Ký
              </Button>
            </div>
          </form>
        )}

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
