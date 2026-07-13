export interface DoctorSchedule {
  id: string;
  doctorId: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  isAvailable: boolean;
  createdAt: string;
}

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  isBooked?: boolean;
  isTooClose?: boolean;
  remaining?: number;
}

export interface Specialty {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    doctors: number;
  };
}

export interface DoctorCertificate {
  id: string;
  doctorId: string;
  type: 'MEDICAL_DEGREE' | 'PRACTICE_LICENSE' | 'SPECIALTY' | 'CLINIC_LICENSE' | 'ACHIEVEMENT' | 'OTHER';
  title: string;
  issuer?: string;
  issuedYear?: number;
  expiryYear?: number;
  certificateNumber?: string;
  description?: string;
  imageUrl?: string;
  fileUrl?: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  rejectionReason?: string;
  verifiedAt?: string;
  createdAt: string;
}

export interface Clinic {
  id: string;
  name: string;
  address: string;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialtyId: string;
  specialty: Specialty;
  experience: number;
  hospital: string;
  avatar: string;
  clinicId?: string;
  clinic?: Clinic;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  isSystemVerified?: boolean;
  createdAt: string;
  doctorSchedules?: DoctorSchedule[];
  certificates?: DoctorCertificate[];
  price?: number;
  phone?: string;
  description?: string;
}

export interface ListDoctorsResponse {
  message: string;
  count: number;
  doctors: Doctor[];
}

export interface DoctorDetailsResponse {
  message: string;
  doctor: Doctor & {
    doctorSchedules: DoctorSchedule[];
  };
}

export interface SchedulesResponse {
  message: string;
  schedules: DoctorSchedule[];
  bookedCounts?: Record<string, number>;
}
