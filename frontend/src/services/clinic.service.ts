import api from "./api";
import { Clinic } from "../types/appointment";

interface ListClinicsResponse {
  message: string;
  count: number;
  clinics: Clinic[];
}

export const clinicService = {
  async listClinics(): Promise<ListClinicsResponse> {
    const response = await api.get<ListClinicsResponse>("/clinics");
    return response.data;
  },

  async getClinic(id: string): Promise<{ message: string; clinic: Clinic }> {
    const response = await api.get(`/clinics/${id}`);
    return response.data;
  },
};
