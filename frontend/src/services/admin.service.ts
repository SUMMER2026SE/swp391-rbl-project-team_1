import api from "./api";
import {
  AdminUsersResponse,
  AdminAppointmentsResponse,
  AdminUser,
  AdminDoctorsResponse,
  ModerateDoctorPayload,
  AdminDoctor,
  AdminSpecialtiesResponse,
  AdminSpecialty,
  CreateSpecialtyPayload,
  UpdateSpecialtyPayload,
  AdminClinicsResponse,
  AdminClinic,
  CreateClinicPayload,
  UpdateClinicPayload,
  AdminArticlesResponse,
  AdminArticle,
  CreateArticlePayload,
  UpdateArticlePayload,
  AdminComplaintsResponse,
  AdminComplaint,
  AdminStatisticsResponse,
} from "../types/admin";
import { UserRole } from "../types/auth";
import { AppointmentStatus } from "../types/appointment";

export const adminService = {
  // ─── Users ──────────────────────────────────────────────────────
  async getUsers(): Promise<AdminUsersResponse> {
    const response = await api.get<AdminUsersResponse>("/admin/users");
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

  // ─── Appointments ──────────────────────────────────────────────
  async getAppointments(): Promise<AdminAppointmentsResponse> {
    const response = await api.get<AdminAppointmentsResponse>("/admin/appointments");
    return response.data;
  },

  async updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<{ message: string }> {
    const response = await api.patch<{ message: string }>(`/admin/appointments/${id}/status`, { status });
    return response.data;
  },

  // ─── Doctor Moderation ─────────────────────────────────────────
  async getDoctors(): Promise<AdminDoctorsResponse> {
    const response = await api.get<AdminDoctorsResponse>("/admin/doctors");
    return response.data;
  },

  async getPendingDoctors(): Promise<AdminDoctorsResponse> {
    const response = await api.get<AdminDoctorsResponse>("/admin/doctors/pending");
    return response.data;
  },

  async moderateDoctor(
    doctorId: string,
    payload: ModerateDoctorPayload
  ): Promise<{ message: string; data: AdminDoctor }> {
    const response = await api.put<{ message: string; data: AdminDoctor }>(
      `/admin/doctors/${doctorId}/moderation`,
      payload
    );
    return response.data;
  },

  async approveDoctor(doctorId: string): Promise<{ message: string; data: AdminDoctor }> {
    const response = await api.patch<{ message: string; data: AdminDoctor }>(`/admin/doctors/${doctorId}/approve`);
    return response.data;
  },

  async rejectDoctor(doctorId: string, reason?: string): Promise<{ message: string; data: AdminDoctor }> {
    const response = await api.patch<{ message: string; data: AdminDoctor }>(`/admin/doctors/${doctorId}/reject`, { reason });
    return response.data;
  },

  async lockDoctor(doctorId: string): Promise<{ message: string; data: AdminDoctor }> {
    const response = await api.patch<{ message: string; data: AdminDoctor }>(`/admin/doctors/${doctorId}/lock`);
    return response.data;
  },

  // ─── Specialties CRUD ──────────────────────────────────────────
  async getSpecialties(): Promise<AdminSpecialtiesResponse> {
    const response = await api.get<AdminSpecialtiesResponse>("/admin/specialties");
    return response.data;
  },

  async createSpecialty(payload: CreateSpecialtyPayload): Promise<{ message: string; data: AdminSpecialty }> {
    const response = await api.post<{ message: string; data: AdminSpecialty }>("/admin/specialties", payload);
    return response.data;
  },

  async updateSpecialty(
    id: string,
    payload: UpdateSpecialtyPayload
  ): Promise<{ message: string; data: AdminSpecialty }> {
    const response = await api.put<{ message: string; data: AdminSpecialty }>(`/admin/specialties/${id}`, payload);
    return response.data;
  },

  async deleteSpecialty(id: string): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/admin/specialties/${id}`);
    return response.data;
  },

  // ─── Clinics CRUD ──────────────────────────────────────────────
  async getClinics(): Promise<AdminClinicsResponse> {
    const response = await api.get<AdminClinicsResponse>("/admin/clinics");
    return response.data;
  },

  async createClinic(payload: CreateClinicPayload): Promise<{ message: string; data: AdminClinic }> {
    const response = await api.post<{ message: string; data: AdminClinic }>("/admin/clinics", payload);
    return response.data;
  },

  async updateClinic(id: string, payload: UpdateClinicPayload): Promise<{ message: string; data: AdminClinic }> {
    const response = await api.put<{ message: string; data: AdminClinic }>(`/admin/clinics/${id}`, payload);
    return response.data;
  },

  async deleteClinic(id: string): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/admin/clinics/${id}`);
    return response.data;
  },

  // ─── Articles CRUD ─────────────────────────────────────────────
  async getArticles(): Promise<AdminArticlesResponse> {
    const response = await api.get<AdminArticlesResponse>("/admin/articles");
    return response.data;
  },

  async createArticle(payload: CreateArticlePayload): Promise<{ message: string; data: AdminArticle }> {
    const response = await api.post<{ message: string; data: AdminArticle }>("/admin/articles", payload);
    return response.data;
  },

  async updateArticle(id: string, payload: UpdateArticlePayload): Promise<{ message: string; data: AdminArticle }> {
    const response = await api.put<{ message: string; data: AdminArticle }>(`/admin/articles/${id}`, payload);
    return response.data;
  },

  async deleteArticle(id: string): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/admin/articles/${id}`);
    return response.data;
  },

  // ─── Complaints ────────────────────────────────────────────────
  async getComplaints(): Promise<AdminComplaintsResponse> {
    const response = await api.get<AdminComplaintsResponse>("/admin/complaints");
    return response.data;
  },

  async resolveComplaint(id: string): Promise<{ message: string; data: AdminComplaint }> {
    const response = await api.put<{ message: string; data: AdminComplaint }>(`/admin/complaints/${id}/resolve`);
    return response.data;
  },

  // ─── Statistics ────────────────────────────────────────────────
  async getStatistics(): Promise<AdminStatisticsResponse> {
    const response = await api.get<AdminStatisticsResponse>("/admin/statistics");
    return response.data;
  },
};
