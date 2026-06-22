"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Alert from "@/components/common/Alert";
import Cookies from "js-cookie";

// Component to handle parameters inside Suspense boundary
function AuthCallbackContent() {
  const { handleOAuthSuccess } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  
  // Guard to prevent double execution and infinite loop in React Strict Mode
  const processedRef = useRef(false);

  useEffect(() => {
    // Read token from cookie (secure) or fallback to URL param
    const token = Cookies.get("token") || searchParams.get("token");

    if (!token) {
      if (processedRef.current) return;
      processedRef.current = true;
      setError("Không tìm thấy mã xác thực (token) trong URL.");
      setTimeout(() => {
        router.push("/login?error=google_failed");
      }, 3000);
      return;
    }

    if (processedRef.current) return;
    processedRef.current = true;

    const processAuth = async () => {
      try {
        await handleOAuthSuccess(token);
        Cookies.remove("token"); // Clean up cookie after transferring to localStorage
        // Redirect to homepage or user area
        router.push("/");
        router.refresh();
      } catch (err: unknown) {
        console.error("Lỗi xử lý đăng nhập Google:", err);
        Cookies.remove("token"); // Also clean up on error
        setError("Đăng nhập bằng Google thất bại. Đang chuyển hướng về trang đăng nhập...");
        setTimeout(() => {
          router.push("/login?error=google_failed");
        }, 3000);
      }
    };

    processAuth();
  }, [searchParams, handleOAuthSuccess, router]);

  return (
    <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 relative overflow-hidden min-h-[50vh]">
      <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-2xl border border-slate-100 shadow-xl relative z-10 text-center">
        {error ? (
          <div className="space-y-4">
            <Alert type="error" message={error} />
            <p className="text-sm text-slate-500">Đang chuyển hướng về trang đăng nhập...</p>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="flex justify-center items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Đang xử lý đăng nhập...</h2>
            <p className="text-sm text-slate-500">Vui lòng chờ trong giây lát</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex-grow flex items-center justify-center py-12 bg-slate-50 min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
