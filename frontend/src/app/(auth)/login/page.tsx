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

<<<<<<< Updated upstream
        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 border-t border-slate-200" />
          <span className="relative px-4 bg-white text-xs text-slate-500 font-medium">HOẶC TIẾP TỤC VỚI</span>
        </div>

        {/* Google Sign In Button Container */}
        <div className="flex justify-center">
          <div id="google-signin-btn" className="w-full max-w-sm" />
=======
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
            {hasGoogleLogin ? (
              <GoogleLogin
                onSuccess={credentialResponse => {
                  if (credentialResponse.credential) {
                    loginWithGoogle(credentialResponse.credential);
                  }
                }}
                onError={() => {
                  toast.error('Đăng nhập Google thất bại');
                }}
                theme="outline"
                shape="pill"
                text="signin_with"
                width="384"
              />
            ) : (
              <button
                type="button"
                onClick={() => toast.error('Vui lòng cấu hình Google Client ID trong file .env để sử dụng tính năng này!')}
                className="w-full flex items-center justify-center gap-3 bg-white text-slate-700 py-2 rounded-full font-medium hover:bg-slate-50 transition-colors border border-slate-200"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span>Đăng nhập với Google</span>
              </button>
            )}
          </div>
>>>>>>> Stashed changes
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
