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
  const [selectedClinic, setSelectedClinicState] = useState<Clinic | null>(null);
  const [selectedDoctor, setSelectedDoctorState] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDateState] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlotState] = useState<TimeSlot | null>(null);

  // Sync state from localStorage on mount
  useEffect(() => {
    try {
      const storedClinic = localStorage.getItem("booking_clinic");
      const storedDoctor = localStorage.getItem("booking_doctor");
      const storedDate = localStorage.getItem("booking_date");
      const storedSlot = localStorage.getItem("booking_slot");

      if (storedClinic) setSelectedClinicState(JSON.parse(storedClinic));
      if (storedDoctor) setSelectedDoctorState(JSON.parse(storedDoctor));
      if (storedDate) setSelectedDateState(storedDate);
      if (storedSlot) setSelectedSlotState(JSON.parse(storedSlot));
    } catch (e) {
      console.error("Failed to load booking state from localStorage", e);
    }
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
