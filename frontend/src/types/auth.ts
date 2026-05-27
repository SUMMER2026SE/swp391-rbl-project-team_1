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
  dateOfBirth: string | null;
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
