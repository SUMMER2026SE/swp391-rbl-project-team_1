import { Doctor } from "./doctor";
import { User } from "./auth";

export type AppointmentStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

export interface Appointment {
  id: string;
  userId: string;
  doctorId: string;
  appointmentDate: string; // ISO String
  status: AppointmentStatus;
  notes: string | null;
  cancellationReason?: string;
  createdAt: string;
  doctor?: Doctor;
  user?: User;
}

export interface CreateAppointmentRequest {
  doctorId: string;
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
