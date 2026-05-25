export interface DoctorSchedule {
  id: string;
  doctorId: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  isAvailable: boolean;
  createdAt: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  experience: number;
  hospital: string;
  avatar: string;
  createdAt: string;
  doctorSchedules?: DoctorSchedule[];
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
}
