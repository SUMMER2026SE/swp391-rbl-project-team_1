import api from "./api";
import { AuthResponse, ProfileResponse, RegisterResponse } from "../types/auth";

export const authService = {
  async login(phone: string, password: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/login", { phone, password });
    return response.data;
  },

  async register(phone: string, password: string): Promise<RegisterResponse> {
    const response = await api.post<RegisterResponse>("/register", { phone, password });
    return response.data;
  },

  async getProfile(): Promise<ProfileResponse> {
    const response = await api.get<ProfileResponse>("/profile");
    return response.data;
  },
};
