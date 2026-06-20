'use client';

import React, { useEffect } from 'react';
import useAuth from '../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import AdminSidebar from '../../components/layout/AdminSidebar';
import Header from '../../components/layout/Header';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'ADMIN') {
        // Redirect to their respective dashboards
        if (user.role === 'STUDENT') {
          router.push('/student/dashboard');
        } else if (user.role === 'MENTOR') {
          router.push('/mentor/dashboard');
        }
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== 'ADMIN') {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-950">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      {/* Sidebar Navigation */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        {/* Scrollable page body */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
