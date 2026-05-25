import { UserRole } from "./auth";
import { AppointmentStatus } from "./appointment";

export interface AdminUser {
  id: string;
  phone: string;
  role: UserRole;
  doctorId: string | null;
  createdAt: string;
}

export interface AdminAppointment {
  id: string;
  userId: string;
  doctorId: string;
  appointmentDate: string; // ISO String
  status: AppointmentStatus;
  notes: string | null;
  createdAt: string;
  user: {
    id: string;
    phone: string;
    role: UserRole;
  };
  doctor: {
    id: string;
    name: string;
    specialty: string;
  };
}

export interface AdminUsersResponse {
  message: string;
  count: number;
  data: AdminUser[];
}

export interface AdminAppointmentsResponse {
  message: string;
  count: number;
  data: AdminAppointment[];
}

export interface AdminStats {
  totalUsers: number;
  totalDoctors: number;
  totalAppointments: number;
  pendingAppointments: number;
  completedAppointments: number;
}
