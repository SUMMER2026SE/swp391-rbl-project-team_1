import api from "./api";
import { ListDoctorsResponse, DoctorDetailsResponse, SchedulesResponse } from "../types/doctor";

export const doctorService = {
  async listDoctors(): Promise<ListDoctorsResponse> {
    const response = await api.get<ListDoctorsResponse>("/doctors");
    return response.data;
  },

  async getDoctor(id: string): Promise<DoctorDetailsResponse> {
    const response = await api.get<DoctorDetailsResponse>(`/doctors/${id}`);
    return response.data;
  },

  async listSchedules(id: string): Promise<SchedulesResponse> {
    const response = await api.get<SchedulesResponse>(`/doctors/${id}/schedules`);
    return response.data;
  },
};
