"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";
import LoadingSpinner from "./LoadingSpinner";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import Button from "./Button";
import Link from "next/link";

interface UserRouteProps {
  children: ReactNode;
}

export default function UserRoute({ children }: UserRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <LoadingSpinner className="mx-auto h-12 w-12 text-teal-500" />
          <p className="mt-4 text-sm font-medium text-slate-400">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Access denied for DOCTOR and ADMIN roles (only normal USER can access patient routes)
  if (user?.role === "DOCTOR" || user?.role === "ADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full text-center bg-white p-8 rounded-3xl border border-slate-100 shadow-xl space-y-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-2xl bg-red-50 text-red-600">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-slate-900">Không Thể Truy Cập</h1>
            <p className="text-sm text-slate-500">
              Tài khoản bác sĩ hoặc quản trị viên không thể sử dụng chức năng đặt lịch khám cá nhân.
            </p>
          </div>
          <div className="pt-2">
            {user?.role === "DOCTOR" ? (
              <Link href="/doctor/dashboard">
                <Button variant="teal" className="w-full rounded-xl py-3 flex items-center justify-center gap-1.5 font-bold">
                  <ArrowLeft className="h-4 w-4" /> Quay lại Doctor Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/admin">
                <Button variant="teal" className="w-full rounded-xl py-3 flex items-center justify-center gap-1.5 font-bold">
                  <ArrowLeft className="h-4 w-4" /> Quay lại Admin Dashboard
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
