"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";
import LoadingSpinner from "./LoadingSpinner";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import Button from "./Button";
import Link from "next/link";

interface DoctorRouteProps {
  children: ReactNode;
}

export default function DoctorRoute({ children }: DoctorRouteProps) {
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
          <p className="mt-4 text-sm font-medium text-slate-400">Đang kiểm tra quyền truy cập bác sĩ...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Access denied for non-DOCTOR roles
  if (user?.role !== "DOCTOR") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full text-center bg-white p-8 rounded-3xl border border-slate-100 shadow-xl space-y-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-2xl bg-red-50 text-red-600">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-slate-900">Truy Cập Bị Từ Chối</h1>
            <p className="text-sm text-slate-500">
              Chỉ bác sĩ mới có quyền truy cập vào khu vực này.
            </p>
          </div>
          <div className="pt-2">
            <Link href="/">
              <Button variant="teal" className="w-full rounded-xl py-3 flex items-center justify-center gap-1.5 font-bold">
                <ArrowLeft className="h-4 w-4" /> Quay lại Trang Chủ
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
