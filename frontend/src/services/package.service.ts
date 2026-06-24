import api from "./api";

export interface MedicalPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  hospital: string;
  estimatedDuration: number;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const packageService = {
  async getPackages(hospital?: string, search?: string) {
    try {
      const params = new URLSearchParams();
      if (hospital) params.append("hospital", hospital);
      if (search) params.append("search", search);
      
      const query = params.toString();
      const endpoint = query ? `/packages?${query}` : "/packages";
      
      const response = await api.get<MedicalPackage[]>(endpoint);
      return response.data;
    } catch (error) {
      console.error("Error fetching packages:", error);
      throw error;
    }
  },

  async getPackageById(id: string): Promise<MedicalPackage> {
    try {
      const response = await api.get(`/packages/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching package by id:", error);
      throw error;
    }
  }
};
