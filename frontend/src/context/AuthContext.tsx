"use client";

import React, { createContext, useState, useEffect, ReactNode } from "react";
import { User } from "../types/auth";
import { authService } from "../services/auth.service";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, otp: string, password: string) => Promise<void>;
  sendOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  logout: () => void;
  updateUser: (updatedUser: User) => void;
  googleLogin: (idToken: string) => Promise<User>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Synchronize on mount
  useEffect(() => {
    async function loadStoredAuth() {
      try {
        const storedToken = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (storedToken) {
          setToken(storedToken);
          // Verify with Backend to ensure the token is still valid
          try {
            const profileResponse = await authService.getProfile();
            setUser(profileResponse.user);
            localStorage.setItem("user", JSON.stringify(profileResponse.user));
          } catch (profileError) {
            console.error("Token verification failed:", profileError);
            // Token is invalid/expired
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setToken(null);
            setUser(null);
          }
        } else if (storedUser) {
          // If no token but user exists, clear it for consistency
          localStorage.removeItem("user");
        }
      } catch (e) {
        console.error("Error reading from localStorage:", e);
      } finally {
        setIsLoading(false);
      }
    }

    loadStoredAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authService.login(email, password);
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
      setToken(response.token);
      setUser(response.user);
      return response.user;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, otp: string, password: string) => {
    setIsLoading(true);
    try {
      await authService.register(email, otp, password);
      // Automatically log in after registration
      await login(email, password);
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const sendOtp = async (email: string) => {
    setIsLoading(true);
    try {
      await authService.sendOtp(email);
    } catch (error) {
      setIsLoading(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (email: string, otp: string) => {
    setIsLoading(true);
    try {
      await authService.verifyOtp(email, otp);
    } catch (error) {
      setIsLoading(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const googleLogin = async (idToken: string) => {
    setIsLoading(true);
    try {
      const response = await authService.googleLogin(idToken);
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
      setToken(response.token);
      setUser(response.user);
      return response.user;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        login,
        register,
        sendOtp,
        verifyOtp,
        logout,
        updateUser,
        googleLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
