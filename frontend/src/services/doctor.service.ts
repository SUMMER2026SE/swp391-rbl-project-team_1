import api from "./api";
import { ListDoctorsResponse, DoctorDetailsResponse, SchedulesResponse } from "../types/doctor";

export const doctorService = {
  async listDoctors(specialty?: string, clinicId?: string): Promise<ListDoctorsResponse> {
    const params = new URLSearchParams();
    if (specialty) params.append("specialty", specialty);
    if (clinicId) params.append("clinicId", clinicId);
    const queryString = params.toString();
    const url = queryString ? `/doctors?${queryString}` : "/doctors";
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
