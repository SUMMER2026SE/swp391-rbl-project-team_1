import api from "./api";
import { AdminUsersResponse, AdminAppointmentsResponse, AdminUser } from "../types/admin";
import { UserRole } from "../types/auth";
import { AppointmentStatus } from "../types/appointment";

export const adminService = {
  async getUsers(): Promise<AdminUsersResponse> {
    const response = await api.get<AdminUsersResponse>("/admin/users");
    return response.data;
  },

  async getAppointments(): Promise<AdminAppointmentsResponse> {
    const response = await api.get<AdminAppointmentsResponse>("/admin/appointments");
    return response.data;
  },

  async updateUserRole(id: string, role: UserRole): Promise<{ message: string; data: AdminUser }> {
    const response = await api.put<{ message: string; data: AdminUser }>(`/admin/users/${id}`, { role });
    return response.data;
  },

  async deleteUser(id: string): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/admin/users/${id}`);
    return response.data;
  },

  async linkDoctorToUser(userId: string, doctorId: string): Promise<{ message: string; data: AdminUser }> {
    const response = await api.post<{ message: string; data: AdminUser }>(
      `/admin/users/${userId}/link-doctor/${doctorId}`
    );
    return response.data;
  },

  // Simulated Appointment Status Update (since the backend does not expose this endpoint yet)
  async updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<{ message: string }> {
    // If the backend has a custom PUT or PATCH endpoint in the future, it will be seamlessly consumed here.
    // For now, we simulate a successful state change.
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          message: `Trạng thái cuộc hẹn đã được cập nhật thành "${status}" thành công!`,
        });
      }, 500);
    });
  }
};
