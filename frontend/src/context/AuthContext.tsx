'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';
import { User, Role } from '../types';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  registerUser: (email: string, password: string, fullName: string) => Promise<void>;
  verifyOtpCode: (email: string, code: string) => Promise<void>;
  completeOnboarding: (skillIds: string[], goal: string, studyHours: number, durationMonths: number, mentorId?: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  // On mount, verify current token
  useEffect(() => {
    async function loadUser() {
      // Use user object in localStorage as a hint that a session might exist
      const hasUserHint = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (!hasUserHint) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        if (response.data.success) {
          setUser(response.data.user);
        }
      } catch (error) {
        console.error('Error loading user session:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.success) {
        const { user: loggedUser } = response.data;
        
        if (rememberMe) {
          localStorage.setItem('user', JSON.stringify(loggedUser));
        } else {
          sessionStorage.setItem('user', JSON.stringify(loggedUser));
        }

        setUser(loggedUser);
        toast.success('Đăng nhập thành công! 👋');

        // Redirect based on role
        if (loggedUser.role === 'STUDENT') {
          router.push('/student/dashboard');
        } else if (loggedUser.role === 'MENTOR') {
          router.push('/mentor/dashboard');
        } else if (loggedUser.role === 'ADMIN') {
          router.push('/admin');
        }
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại.';
      toast.error(msg);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (credential: string) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/google', { credential });
      if (response.data.success) {
        const { user: loggedUser } = response.data;
        
        sessionStorage.setItem('user', JSON.stringify(loggedUser));

        setUser(loggedUser);
        toast.success('Đăng nhập bằng Google thành công! 👋');

        // Redirect based on role
        if (loggedUser.role === 'STUDENT') {
          router.push('/student/dashboard');
        } else if (loggedUser.role === 'MENTOR') {
          router.push('/mentor/dashboard');
        } else if (loggedUser.role === 'ADMIN') {
          router.push('/admin');
        }
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Đăng nhập Google thất bại.';
      toast.error(msg);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const registerUser = async (email: string, password: string, fullName: string) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/register', { email, password, fullName });
      if (response.data.success) {
        // In DEV mode, server returns OTP code directly
        if (response.data.otpCode) {
          toast.success(`Mã OTP của bạn: ${response.data.otpCode}`, { duration: 15000 });
        } else {
          toast.success('Gửi mã OTP thành công! Vui lòng kiểm tra email.');
        }
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Đăng ký thất bại. Email có thể đã được sử dụng.';
      toast.error(msg);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtpCode = async (email: string, code: string) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/verify-otp', { email, code });
      if (response.data.success) {
        const { user: loggedUser } = response.data;
        
        // Default register behavior uses sessionStorage
        sessionStorage.setItem('user', JSON.stringify(loggedUser));

        setUser(loggedUser);
        toast.success('Xác thực tài khoản thành công!');
        router.push('/onboarding');
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Xác thực mã OTP thất bại.';
      toast.error(msg);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = async (
    skillIds: string[],
    goal: string,
    studyHours: number,
    durationMonths: number,
    mentorId?: string
  ) => {
    const toastId = toast.loading('AI đang tạo lộ trình học tập cá nhân cho bạn... ⏳');
    try {
      const response = await api.post('/auth/complete-onboarding', {
        skillIds,
        goal,
        studyHours,
        durationMonths,
        mentorId
      });
      if (response.data.success) {
        // Update user state locally
        if (user) {
          const updatedUser = {
            ...user,
            student: user.student
              ? { ...user.student, onboardingCompleted: true, learningGoal: response.data.student?.learningGoal }
              : undefined
          };
          setUser(updatedUser);
          if (localStorage.getItem('user')) {
            localStorage.setItem('user', JSON.stringify(updatedUser));
          } else if (sessionStorage.getItem('user')) {
            sessionStorage.setItem('user', JSON.stringify(updatedUser));
          }
        }
        // Mark as first-time login for onboarding banner
        localStorage.setItem('show_onboarding_banner', 'true');
        toast.success('Lộ trình học tập đã sẵn sàng! Bắt đầu thôi 🎉', { id: toastId });
        router.push('/student/dashboard');
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Gửi khảo sát thất bại.';
      toast.error(msg, { id: toastId });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error('Logout failed:', e);
    }
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    setUser(null);
    toast.success('Đăng xuất thành công.');
    router.push('/login');
  };

  const refreshUser = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.success) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Error refreshing user details:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        registerUser,
        verifyOtpCode,
        completeOnboarding,
        loginWithGoogle,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
