"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import Alert from "@/components/common/Alert";
import { KeyRound, User, Activity } from "lucide-react";
import toast from "react-hot-toast";

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const errorParam = searchParams.get("error");

  // Check for error parameter from Google Login callback redirect
  useEffect(() => {
    if (errorParam === "google_failed") {
      setError("Đăng nhập bằng Google thất bại. Vui lòng thử lại!");
    }
  }, [errorParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

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
      const loggedInUser = await login(email, password);
      
      if (loggedInUser.role === 'DOCTOR') {
        toast.success(`Chào mừng quay trở lại, Dr. ${loggedInUser.fullName || ''}`, { duration: 3000 });
        setTimeout(() => {
          router.push("/doctor/dashboard");
          router.refresh();
        }, 1000);
      } else if (loggedInUser.role === 'ADMIN') {
        toast.success("Đăng nhập Admin thành công", { duration: 3000 });
        setTimeout(() => {
          router.push("/admin");
          router.refresh();
        }, 1000);
      } else {
        toast.success("Đăng nhập thành công", { duration: 3000 });
        setTimeout(() => {
          router.push("/my-appointments");
          router.refresh();
        }, 1000);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Đăng nhập thất bại. Vui lòng kiểm tra lại email hoặc mật khẩu.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    window.location.href = `${backendUrl}/auth/google`;
  };

  return (
    <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 relative overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-2xl border border-slate-100 shadow-xl relative z-10">
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

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
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

          <div className="flex items-center justify-between text-sm">
            <span />
            <Link href="/forgot-password" className="font-semibold text-teal-600 hover:text-teal-700 transition-colors">
              Quên mật khẩu?
            </Link>
          </div>

          <div className="pt-2">
            <Button type="submit" variant="teal" className="w-full py-3 text-base rounded-xl" isLoading={loading}>
              Đăng Nhập
            </Button>
          </div>
        </form>

        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 border-t border-slate-200" />
          <span className="relative px-4 bg-white text-xs text-slate-500 font-medium">HOẶC TIẾP TỤC VỚI</span>
        </div>

        {/* Google OAuth Login Button */}
        <div>
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 hover:bg-slate-50 rounded-xl transition-all font-medium text-slate-700 text-sm shadow-sm cursor-pointer"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
              <g transform="matrix(1, 0, 0, 1, 0, 0)">
                <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.58h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.48C21.68,11.75 21.57,11.4 21.35,11.1z" fill="#4285F4" />
                <path d="M12,20.9c2.7,0 4.96,-0.9 6.62,-2.42l-3.3,-2.58c-0.9,0.6 -2.07,0.98 -3.32,0.98c-2.55,0 -4.71,-1.72 -5.48,-4.04H3.1v2.66C4.75,17.76 8.13,20.9 12,20.9z" fill="#34A853" />
                <path d="M6.52,12.84c-0.2,-0.6 -0.32,-1.24 -0.32,-1.9s0.12,-1.3 0.32,-1.9V6.38H3.1C2.41,7.76 2.02,9.31 2.02,10.94s0.39,3.18 1.08,4.56L6.52,12.84z" fill="#FBBC05" />
                <path d="M12,6.12c1.47,0 2.78,0.5 3.82,1.5l2.87,-2.87C16.96,3.12 14.7,2.1 12,2.1C8.13,2.1 4.75,5.24 3.1,8.5l3.42,2.66c0.77,-2.32 2.93,-4.04 5.48,-4.04z" fill="#EA4335" />
              </g>
            </svg>
            <span>Tiếp tục với Google</span>
          </button>
        </div>

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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex-grow flex items-center justify-center py-12 bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
