import api from "./api";

export interface BookingProfile {
  id: string;
  userId: string;
  fullName: string;
  phone?: string;
  gender?: string;
  yearOfBirth?: number;
  relationship: string;
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
