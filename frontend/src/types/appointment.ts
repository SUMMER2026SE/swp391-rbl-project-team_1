import { Doctor } from "./doctor";
import { User } from "./auth";

export type AppointmentStatus = "PENDING_PAYMENT" | "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "EXPIRED";

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

export interface Payment {
  id: string;
  amount: number;
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "EXPIRED";
  method: "VNPAY" | "MOCK" | "PAYOS";
  transactionId?: string | null;
  paymentGateway?: string | null;
  payDate?: string | null;
  orderCode?: string | null;
  expiredAt?: string | null;
  createdAt: string;
}

export interface Appointment {
  id: string;
  userId: string;
  doctorId?: string;
  clinicId?: string;
  packageId?: string;
  appointmentDate: string; // ISO String
  status: AppointmentStatus;
  notes: string | null;
  cancellationReason?: string;
  createdAt: string;
  doctor?: Doctor;
  clinic?: Clinic;
  medicalPackage?: any;
  patientProfileType?: "SELF" | "OTHER";
  patientProfileName?: string | null;
  patientInfo?: any;
  user?: User;
  medicalRecord?: MedicalRecord | null;
  review?: Review | null;
  payment?: Payment | null;
  
  // Prepayment fields
  transactionCode?: string | null;
  amount?: number;
  paymentProof?: string | null;
  paymentAt?: string | null;
}

export interface PatientInfo {
  fullName: string;
  phoneNumber?: string;
  email?: string;
  gender?: string;
  dateOfBirth?: string; // ISO String
  province?: string;
  district?: string;
  ward?: string;
  street?: string;
  address?: string;
  bloodType?: string;
  allergies?: string;
  chronicDiseases?: string;
  personalHistory?: string;
  familyHistory?: string;
  // For OTHER type
  yearOfBirth?: number;
  relationship?: string;
}

export interface CreateAppointmentRequest {
  patientInfo: PatientInfo;
  patientProfileType?: 'SELF' | 'OTHER';
  doctorId?: string;
  clinicId?: string;
  appointmentDate: string; // ISO String
  notes?: string;
  packageId?: string;
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
