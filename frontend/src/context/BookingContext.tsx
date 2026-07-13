"use client";

import React, { createContext, useState, useEffect, ReactNode } from "react";
import { Doctor, TimeSlot } from "../types/doctor";

export interface Clinic {
  id: string;
  name: string;
  address: string;
  image?: string;
}

interface BookingContextType {
  selectedClinic: Clinic | null;
  selectedDoctor: Doctor | null;
  selectedDate: string | null;
  selectedSlot: TimeSlot | null;
  setSelectedClinic: (clinic: Clinic | null) => void;
  setSelectedDoctor: (doctor: Doctor | null) => void;
  setSelectedDate: (date: string | null) => void;
  setSelectedSlot: (slot: TimeSlot | null) => void;
  resetBooking: () => void;
}

export const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  // Sync state from localStorage on mount (lazy init to avoid cascading renders)
  const [selectedClinic, setSelectedClinicState] = useState<Clinic | null>(null);
  const [selectedDoctor, setSelectedDoctorState] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDateState] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlotState] = useState<TimeSlot | null>(null);

  // Synchronize from localStorage on mount (client-side only) to prevent hydration mismatches
  useEffect(() => {
    try {
      const clinicStr = localStorage.getItem("booking_clinic");
      if (clinicStr) setSelectedClinicState(JSON.parse(clinicStr));
    } catch {}

    try {
      const doctorStr = localStorage.getItem("booking_doctor");
      if (doctorStr) setSelectedDoctorState(JSON.parse(doctorStr));
    } catch {}

    const dateStr = localStorage.getItem("booking_date");
    if (dateStr) setSelectedDateState(dateStr);

    try {
      const slotStr = localStorage.getItem("booking_slot");
      if (slotStr) setSelectedSlotState(JSON.parse(slotStr));
    } catch {}
  }, []);

  const setSelectedClinic = (clinic: Clinic | null) => {
    setSelectedClinicState(clinic);
    if (clinic) {
      localStorage.setItem("booking_clinic", JSON.stringify(clinic));
    } else {
      localStorage.removeItem("booking_clinic");
    }
    // Reset doctor/date/slot when clinic changes
    if (clinic) {
      setSelectedDoctorState(null);
      setSelectedDateState(null);
      setSelectedSlotState(null);
      localStorage.removeItem("booking_doctor");
      localStorage.removeItem("booking_date");
      localStorage.removeItem("booking_slot");
    }
  };

  const setSelectedDoctor = (doctor: Doctor | null) => {
    setSelectedDoctorState(doctor);
    if (doctor) {
      localStorage.setItem("booking_doctor", JSON.stringify(doctor));
    } else {
      localStorage.removeItem("booking_doctor");
    }
    // Reset date/slot when doctor changes
    if (doctor) {
      setSelectedDateState(null);
      setSelectedSlotState(null);
      localStorage.removeItem("booking_date");
      localStorage.removeItem("booking_slot");
    }
  };

  const setSelectedDate = (date: string | null) => {
    setSelectedDateState(date);
    if (date) {
      localStorage.setItem("booking_date", date);
    } else {
      localStorage.removeItem("booking_date");
    }
  };

  const setSelectedSlot = (slot: TimeSlot | null) => {
    setSelectedSlotState(slot);
    if (slot) {
      localStorage.setItem("booking_slot", JSON.stringify(slot));
    } else {
      localStorage.removeItem("booking_slot");
    }
  };

  const resetBooking = () => {
    setSelectedClinicState(null);
    setSelectedDoctorState(null);
    setSelectedDateState(null);
    setSelectedSlotState(null);
    localStorage.removeItem("booking_clinic");
    localStorage.removeItem("booking_doctor");
    localStorage.removeItem("booking_date");
    localStorage.removeItem("booking_slot");
  };

  return (
    <BookingContext.Provider
      value={{
        selectedClinic,
        selectedDoctor,
        selectedDate,
        selectedSlot,
        setSelectedClinic,
        setSelectedDoctor,
        setSelectedDate,
        setSelectedSlot,
        resetBooking,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = React.useContext(BookingContext);
  if (context === undefined) {
    throw new Error("useBooking must be used within a BookingProvider");
  }
  return context;
}
