import api from "./api";
import { User } from "../types/auth";

export interface UpdateProfileData {
  fullName?: string | null;
  gender?: string | null;
  address?: string | null;
  dateOfBirth?: string | null;
}

export const userService = {
  async getProfile(): Promise<{ message: string; data: User }> {
    const response = await api.get<{ message: string; data: User }>("/users/profile");
    return response.data;
  },

  async updateProfile(data: UpdateProfileData): Promise<{ message: string; data: User }> {
    const response = await api.put<{ message: string; data: User }>("/users/profile", data);
    return response.data;
  },

  async changePassword(oldPassword?: string, newPassword?: string): Promise<{ message: string }> {
    const response = await api.put<{ message: string }>("/users/change-password", {
      oldPassword,
      newPassword,
    });
    return response.data;
  },

  async uploadAvatar(file: File): Promise<{ message: string; data: User }> {
    const formData = new FormData();
    formData.append("avatar", file);

    const response = await api.post<{ message: string; data: User }>("/users/upload-avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
};

export default userService;
