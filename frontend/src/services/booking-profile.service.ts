import api from "./api";

export interface BookingProfile {
  id: string;
  userId: string;
  fullName: string;
  phone?: string;
  email?: string;
  gender?: string;
  dateOfBirth?: string;
  relationship: string;
  province?: string;
  district?: string;
  ward?: string;
  street?: string;
  bloodType?: string;
  allergies?: string;
  chronicDiseases?: string;
  personalHistory?: string;
  familyHistory?: string;
  createdAt?: string;
}

export const bookingProfileService = {
  async getMyProfiles(): Promise<BookingProfile[]> {
    const response = await api.get<{ data: BookingProfile[] }>("/booking-profiles");
    return response.data.data;
  },

  async createProfile(data: Partial<BookingProfile>): Promise<BookingProfile> {
    const response = await api.post<{ data: BookingProfile, message: string }>("/booking-profiles", data);
    return response.data.data;
  },

  async updateProfile(id: string, data: Partial<BookingProfile>): Promise<BookingProfile> {
    const response = await api.put<{ data: BookingProfile, message: string }>(`/booking-profiles/${id}`, data);
    return response.data.data;
  },

  async deleteProfile(id: string): Promise<void> {
    await api.delete(`/booking-profiles/${id}`);
  }
};
