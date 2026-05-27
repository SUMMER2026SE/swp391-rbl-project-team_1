import api from "./api";
import { ListDoctorsResponse, DoctorDetailsResponse, SchedulesResponse } from "../types/doctor";

export const doctorService = {
  async listDoctors(specialty?: string): Promise<ListDoctorsResponse> {
    const url = specialty ? `/doctors?specialty=${encodeURIComponent(specialty)}` : "/doctors";
    const response = await api.get<ListDoctorsResponse>(url);
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
