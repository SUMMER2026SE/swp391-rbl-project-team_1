import api from "./api";
import { CreateAppointmentRequest, CreateAppointmentResponse, MyAppointmentsResponse } from "../types/appointment";

export const appointmentService = {
  async createAppointment(data: CreateAppointmentRequest): Promise<CreateAppointmentResponse> {
    const response = await api.post<CreateAppointmentResponse>("/appointments", data);
    return response.data;
  },

  async getMyAppointments(): Promise<MyAppointmentsResponse> {
    const response = await api.get<MyAppointmentsResponse>("/my-appointments");
    return response.data;
  },
};
