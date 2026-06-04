import { Doctor } from "./doctor";
import { User } from "./auth";

export type AppointmentStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

export interface Clinic {
  id: string;
  name: string;
  address: string;
  image?: string;
}

export interface Prescription {
  id: string;
  medicalRecordId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  createdAt: string;
}

export interface MedicalRecord {
  id: string;
  appointmentId: string;
  doctorId: string;
  userId: string;
  diagnosis: string;
  notes: string | null;
  prescriptions?: Prescription[];
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  appointmentId: string;
  doctorId: string;
  userId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    fullName: string | null;
    avatar: string | null;
  };
}

export interface Appointment {
  id: string;
  userId: string;
  doctorId: string;
  clinicId: string;
  appointmentDate: string; // ISO String
  status: AppointmentStatus;
  notes: string | null;
  cancellationReason?: string;
  createdAt: string;
  doctor?: Doctor;
  clinic?: Clinic;
  user?: User;
  medicalRecord?: MedicalRecord | null;
  review?: Review | null;
}

export interface CreateAppointmentRequest {
  doctorId: string;
  clinicId: string;
  appointmentDate: string; // ISO String
  notes?: string;
}

export interface CreateAppointmentResponse {
  message: string;
  appointment: Appointment;
}

export interface MyAppointmentsResponse {
  message: string;
  count: number;
  appointments: Appointment[];
}
