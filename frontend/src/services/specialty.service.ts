import api from "./api";
import { Specialty } from "../types/doctor";

export interface ListSpecialtiesResponse {
  message: string;
  count: number;
  specialties: Specialty[];
}

export const specialtyService = {
  async listSpecialties(): Promise<ListSpecialtiesResponse> {
    const response = await api.get<ListSpecialtiesResponse>("/specialties");
    return response.data;
  },
};
