import api from "./api";
import { AuthResponse, ProfileResponse, RegisterResponse } from "../types/auth";

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/login", { email, password });
    return response.data;
  },

  async register(email: string, otp: string, password: string): Promise<RegisterResponse> {
    const response = await api.post<RegisterResponse>("/auth/register", {
      email,
      otp,
      password,
    });
    return response.data;
  },

  // OTP flow
  async sendOtp(email: string): Promise<{ message: string; email: string }> {
    const response = await api.post<{ message: string; email: string }>("/auth/send-otp", { email });
    return response.data;
  },

  async verifyOtp(email: string, otp: string): Promise<{ message: string; verified: boolean }> {
    const response = await api.post<{ message: string; verified: boolean }>("/auth/verify-otp", {
      email,
      otp,
    });
    return response.data;
  },

  async getProfile(): Promise<ProfileResponse> {
    const response = await api.get<ProfileResponse>("/profile");
    return response.data;
  },

  // Reset password flow
  async forgotPassword(email: string): Promise<{ message: string; email: string }> {
    const response = await api.post<{ message: string; email: string }>("/auth/forgot-password", { email });
    return response.data;
  },

  async verifyResetOtp(email: string, otp: string): Promise<{ message: string; verified: boolean }> {
    const response = await api.post<{ message: string; verified: boolean }>("/auth/verify-reset-otp", {
      email,
      otp,
    });
    return response.data;
  },

  async resetPassword(email: string, otp: string, password: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>("/auth/reset-password", {
      email,
      otp,
      password,
    });
    return response.data;
  },

  async googleLogin(idToken: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/google-login", { idToken });
    return response.data;
  },
};
export default authService;
