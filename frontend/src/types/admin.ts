import { UserRole } from "./auth";
import { AppointmentStatus } from "./appointment";

// ─── Existing Types ──────────────────────────────────────────────

export interface AdminUser {
  id: string;
  email: string;
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
  cancellationReason?: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
  doctor: {
    id: string;
    name: string;
    specialty: {
      id: string;
      name: string;
      slug: string;
      icon: string | null;
    };
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

// ─── Doctor Moderation ───────────────────────────────────────────

export type DoctorStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface AdminDoctor {
  id: string;
  name: string;
  experience: number;
  hospital: string;
  avatar: string;
  specialty: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
  };
  clinic: {
    id: string;
    name: string;
  } | null;
  status: DoctorStatus;
  isLocked: boolean;
  rejectedReason: string | null;
  createdAt: string;
  userAccount: {
    id: string;
    email: string;
  } | null;
}

export interface AdminDoctorsResponse {
  message: string;
  count: number;
  data: AdminDoctor[];
}

export interface ModerateDoctorPayload {
  action: "APPROVE" | "REJECT" | "LOCK" | "UNLOCK";
  reason?: string;
}

// ─── Specialties CRUD ────────────────────────────────────────────

export interface AdminSpecialty {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    doctors: number;
  };
}

export interface AdminSpecialtiesResponse {
  message: string;
  count: number;
  data: AdminSpecialty[];
}

export interface CreateSpecialtyPayload {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}

export interface UpdateSpecialtyPayload {
  name?: string;
  slug?: string;
  description?: string;
  icon?: string;
}

// ─── Clinics CRUD ────────────────────────────────────────────────

export interface AdminClinic {
  id: string;
  name: string;
  address: string;
  image: string | null;
  _count: {
    doctors: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AdminClinicsResponse {
  message: string;
  count: number;
  data: AdminClinic[];
}

export interface CreateClinicPayload {
  name: string;
  address: string;
  image?: string;
}

export interface UpdateClinicPayload {
  name?: string;
  address?: string;
  image?: string;
}

// ─── Articles CRUD ───────────────────────────────────────────────

export interface AdminArticle {
  id: string;
  title: string;
  content: string;
  thumbnail: string | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminArticlesResponse {
  message: string;
  count: number;
  data: AdminArticle[];
}

export interface CreateArticlePayload {
  title: string;
  content: string;
  thumbnail?: string;
  published?: boolean;
}

export interface UpdateArticlePayload {
  title?: string;
  content?: string;
  thumbnail?: string;
  published?: boolean;
}

// ─── Complaints ──────────────────────────────────────────────────

export type ComplaintStatus = "PENDING" | "RESOLVED";

export interface AdminComplaint {
  id: string;
  message: string;
  status: ComplaintStatus;
  userId: string;
  user: {
    email: string;
  };
  createdAt: string;
}

export interface AdminComplaintsResponse {
  message: string;
  count: number;
  data: AdminComplaint[];
}

// ─── Statistics ──────────────────────────────────────────────────

export interface AppointmentsByStatus {
  status: AppointmentStatus;
  count: number;
}

export interface AppointmentsBySpecialty {
  specialty: string;
  count: number;
}

export interface AppointmentsByMonth {
  month: string;
  count: number;
}

export interface AdminStatistics {
  totalUsers: number;
  totalDoctors: number;
  totalAppointments: number;
  appointmentsByStatus: AppointmentsByStatus[];
  appointmentsBySpecialty: AppointmentsBySpecialty[];
  appointmentsByMonth: AppointmentsByMonth[];
}

export interface AdminStatisticsResponse {
  message: string;
  data: AdminStatistics;
}
