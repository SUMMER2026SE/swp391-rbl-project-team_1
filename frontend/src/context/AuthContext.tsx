'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';
import { User, Role } from '../types';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { handleError } from '../utils/errorHandler';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  registerUser: (email: string, password: string, fullName: string) => Promise<void>;
  verifyOtpCode: (email: string, code: string) => Promise<void>;
  completeOnboarding: (skillIds: string[], goal: string, mentorId?: string) => Promise<void>;
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
      try {
        const response = await api.get('/auth/me');
        if (response.data.success) {
          setUser(response.data.user);
        }
      } catch (error) {
        // If 401, it means no valid cookie, user is not logged in.
        setUser(null);
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
      handleError(error, 'Đăng nhập thất bại. Vui lòng kiểm tra lại.');
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
      handleError(error, 'Đăng nhập Google thất bại.');
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
        toast.success('Gửi mã OTP thành công! Vui lòng kiểm tra email.');
      }
    } catch (error: any) {
      handleError(error, 'Đăng ký thất bại. Email có thể đã được sử dụng.');
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
        setUser(loggedUser);
        toast.success('Xác thực tài khoản thành công!');
        router.push('/onboarding');
      }
    } catch (error: any) {
      handleError(error, 'Xác thực mã OTP thất bại.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = async (skillIds: string[], goal: string, mentorId?: string) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/complete-onboarding', { skillIds, goal, mentorId });
      if (response.data.success) {
        // Update user state locally
        if (user) {
          const updatedUser = { ...user, onboardingCompleted: true };
          setUser(updatedUser);
        }
        toast.success('Hoàn thành khảo sát! Bắt đầu học tập.');
        router.push('/student/dashboard');
      }
    } catch (error: any) {
      handleError(error, 'Gửi khảo sát thất bại.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error('Logout failed:', e);
    }
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
