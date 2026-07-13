import api from "./api";

export interface PatientProfile {
  id: string;
  userId: string;
  fullName: string;
  dateOfBirth?: string;
  gender?: string;
  phoneNumber?: string;
  cccd?: string;
  ethnicity?: string;
  nationality?: string;
  address?: string;
  bloodType?: string;
  allergies?: string;
  chronicDiseases?: string;
  personalHistory?: string;
  familyHistory?: string;
  isPrimary: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const patientProfileService = {
  async getMyProfiles(): Promise<PatientProfile[]> {
    const response = await api.get<{ profiles: PatientProfile[] }>("/patient-profiles");
    return response.data.profiles;
  },

  async createProfile(data: Partial<PatientProfile>): Promise<PatientProfile> {
    const response = await api.post<{ profile: PatientProfile, message: string }>("/patient-profiles", data);
    return response.data.profile;
  },

  async updateProfile(id: string, data: Partial<PatientProfile>): Promise<PatientProfile> {
    const response = await api.put<{ profile: PatientProfile, message: string }>(`/patient-profiles/${id}`, data);
    return response.data.profile;
  },

  async deleteProfile(id: string): Promise<void> {
    await api.delete(`/patient-profiles/${id}`);
  }
};
