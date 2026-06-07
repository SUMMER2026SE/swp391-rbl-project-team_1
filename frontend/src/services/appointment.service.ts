import api from "./api";
import { CreateAppointmentRequest, CreateAppointmentResponse, MyAppointmentsResponse, Appointment } from "../types/appointment";

export const appointmentService = {
  async createAppointment(data: CreateAppointmentRequest): Promise<CreateAppointmentResponse> {
    const response = await api.post<CreateAppointmentResponse>("/appointments", data);
    return response.data;
  },

  async getMyAppointments(): Promise<MyAppointmentsResponse> {
    const response = await api.get<MyAppointmentsResponse>("/my-appointments");
    return response.data;
  },

  async getAppointmentById(id: string): Promise<{
    message: string;
    appointment: Appointment;
    bankDetails?: {
      bankName: string;
      bankAccount: string;
      bankOwner: string;
    } | null;
  }> {
    const response = await api.get<{
      message: string;
      appointment: Appointment;
      bankDetails?: {
        bankName: string;
        bankAccount: string;
        bankOwner: string;
      } | null;
    }>(`/appointments/${id}`);
    return response.data;
  },

  async uploadPaymentProof(id: string, file: File): Promise<{ message: string; appointment: Appointment }> {
    const formData = new FormData();
    formData.append("paymentProof", file);
    const response = await api.post<{ message: string; appointment: Appointment }>(
      `/appointments/${id}/pay-proof`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  async getPendingPaymentsForAdmin(): Promise<{ message: string; data: Appointment[] }> {
    const response = await api.get<{ message: string; data: Appointment[] }>("/admin/appointments/pending-approval");
    return response.data;
  },

  async adminApprovePayment(id: string): Promise<{ message: string; data: Appointment }> {
    const response = await api.put<{ message: string; data: Appointment }>(`/admin/appointments/${id}/status`, {
      status: "CONFIRMED",
    });
    return response.data;
  },

  async adminRejectPayment(id: string, reason: string): Promise<{ message: string; data: Appointment }> {
    const response = await api.put<{ message: string; data: Appointment }>(`/admin/appointments/${id}/status`, {
      status: "CANCELLED",
      cancellationReason: reason,
    });
    return response.data;
  },
};
