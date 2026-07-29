export type UserRole = "USER" | "DOCTOR" | "ADMIN";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  doctorId: string | null;
  fullName: string | null;
  avatar: string | null;
  gender: string | null;
  address: string | null;
  province: string | null;
  district: string | null;
  ward: string | null;
  street: string | null;
  dateOfBirth: string | null;
  
  // Medical Background
  bloodType: string | null;
  allergies: string | null;
  chronicDiseases: string | null;
  personalHistory: string | null;
  familyHistory: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface RegisterResponse {
  message: string;
  user: User;
}

export interface ProfileResponse {
  message: string;
  user: User;
}
