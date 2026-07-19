"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";
import LoadingSpinner from "./LoadingSpinner";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        // If USER tries to access /my-appointments (DOCTOR only), redirect to their profile appointments tab
        if (user.role === "USER") {
          router.push("/profile#appointments");
        } else {
          router.push("/");
        }
      }
    }
  }, [isLoading, isAuthenticated, router, user, allowedRoles]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <LoadingSpinner className="mx-auto h-12 w-12 text-teal-600" />
          <p className="mt-4 text-sm font-medium text-slate-600">Đang xác thực thông tin...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || (allowedRoles && user && !allowedRoles.includes(user.role))) {
    return null;
  }

  return <>{children}</>;
}
