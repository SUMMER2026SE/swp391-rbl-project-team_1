"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import Alert from "@/components/common/Alert";
import { KeyRound, User, Activity } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const { login, googleLogin } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleLoginResponse = async (response: { credential?: string }) => {
    if (!response.credential) {
      setError("Không nhận được thông tin xác thực từ Google");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const loggedInUser = await googleLogin(response.credential);
      
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
      const message = err instanceof Error ? err.message : "Đăng nhập bằng Google thất bại";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Load Google Identity Services SDK dynamically
  useEffect(() => {
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

        const googleBtn = document.getElementById("google-signin-btn");
        if (googleBtn) {
          // @ts-ignore
          window.google.accounts.id.renderButton(googleBtn, {
            theme: "outline",
            size: "large",
            width: 382, // matches typical max-w-md padding width
            text: "continue_with",
            shape: "rectangular",
          });
        }
      }
    };

    return () => {
      // Clean up script on unmount
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript && existingScript.parentNode) {
        existingScript.parentNode.removeChild(existingScript);
      }
    };
  }, []);

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

        {/* Google Sign In Button Container */}
        <div className="flex justify-center">
          <div id="google-signin-btn" className="w-full max-w-sm" />
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
