# 🎨 Frontend Integration Guide

Complete step-by-step guide to integrate the Next.js frontend with the Healthcare Booking API backend.

---

## 📦 Step 1: Setup Environment Variables

**File**: `frontend/.env.local`

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Or for production
# NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
```

---

## 🔐 Step 2: Create AuthContext

**File**: `frontend/src/context/AuthContext.tsx`

```typescript
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  id: string;
  phone: string;
  role: "USER" | "DOCTOR" | "ADMIN";
  doctorId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  register: (phone: string, password: string) => Promise<void>;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
      fetchProfile(savedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchProfile = async (authToken: string) => {
    try {
      const response = await fetch(`${API_URL}/profile`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch profile");
      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      console.error("Profile fetch error:", error);
      localStorage.removeItem("token");
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (phone: string, password: string) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Registration failed");
    }

    const data = await response.json();
    setUser(data.user);
  };

  const login = async (phone: string, password: string) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Login failed");
    }

    const data = await response.json();
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem("token", data.token);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        register,
        login,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
```

---

## 🌐 Step 3: Create API Service

**File**: `frontend/src/services/api.ts`

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface ApiResponse<T> {
  message: string;
  [key: string]: any;
  data?: T;
}

const getAuthToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const token = getAuthToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "API request failed");
  }

  return response.json();
}

// Auth Services
export const authService = {
  register: (phone: string, password: string) =>
    apiCall("/auth/register", {
      method: "POST",
      body: JSON.stringify({ phone, password }),
    }),
  login: (phone: string, password: string) =>
    apiCall("/auth/login", {
      method: "POST",
      body: JSON.stringify({ phone, password }),
    }),
  getProfile: () => apiCall("/profile"),
};

// Doctor Services
export const doctorService = {
  getAllDoctors: () => apiCall("/doctors"),
  getDoctorById: (id: string) => apiCall(`/doctors/${id}`),
  getDoctorSchedules: (id: string) => apiCall(`/doctors/${id}/schedules`),
  createSchedule: (id: string, data: any) =>
    apiCall(`/doctors/${id}/schedules`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getDoctorAppointments: () => apiCall("/doctor/appointments"),
};

// Appointment Services
export const appointmentService = {
  createAppointment: (data: any) =>
    apiCall("/appointments", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getMyAppointments: () => apiCall("/my-appointments"),
};

// Admin Services
export const adminService = {
  getAllUsers: () => apiCall("/admin/users"),
  getAllAppointments: () => apiCall("/admin/appointments"),
  updateUserRole: (id: string, role: string) =>
    apiCall(`/admin/users/${id}`, {
      method: "PUT",
      body: JSON.stringify({ role }),
    }),
  deleteUser: (id: string) =>
    apiCall(`/admin/users/${id}`, {
      method: "DELETE",
    }),
  linkDoctorToUser: (userId: string, doctorId: string) =>
    apiCall(`/admin/users/${userId}/link-doctor/${doctorId}`, {
      method: "POST",
    }),
};

// Chat Services
export const chatService = {
  sendMessage: (message: string, history: any[] = []) =>
    apiCall("/chat", {
      method: "POST",
      body: JSON.stringify({ message, history }),
    }),
};
```

---

## 🛡️ Step 4: Protected Route Component

**File**: `frontend/src/components/common/ProtectedRoute.tsx`

```typescript
"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: "USER" | "DOCTOR" | "ADMIN";
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    router.push("/login");
    return null;
  }

  if (requiredRole && user?.role !== requiredRole) {
    router.push("/unauthorized");
    return null;
  }

  return <>{children}</>;
};
```

---

## 📝 Step 5: Login Page

**File**: `frontend/src/app/(auth)/login/page.tsx`

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(phone, password);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <h2 className="text-3xl font-bold text-center">Login</h2>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-center">
          Don't have an account?{" "}
          <Link href="/register" className="text-blue-600 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
```

---

## 👥 Step 6: Doctors List Page

**File**: `frontend/src/app/doctors/page.tsx`

```typescript
"use client";

import { useEffect, useState } from "react";
import { doctorService } from "@/services/api";
import Link from "next/link";

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  experience: number;
  hospital: string;
  avatar: string;
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await doctorService.getAllDoctors();
        setDoctors(response.doctors);
      } catch (error) {
        console.error("Error fetching doctors:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  if (loading) return <div>Loading doctors...</div>;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Our Doctors</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {doctors.map((doctor) => (
          <div key={doctor.id} className="bg-white rounded-lg shadow-md p-6">
            <img src={doctor.avatar} alt={doctor.name} className="w-20 h-20 rounded-full mb-4" />
            <h3 className="text-xl font-semibold">{doctor.name}</h3>
            <p className="text-gray-600">{doctor.specialty}</p>
            <p className="text-sm text-gray-500">Experience: {doctor.experience} years</p>
            <p className="text-sm text-gray-500">{doctor.hospital}</p>

            <Link
              href={`/doctors/${doctor.id}`}
              className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              View & Book
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 📅 Step 7: Appointment Booking Page

**File**: `frontend/src/app/doctors/[id]/page.tsx`

```typescript
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doctorService, appointmentService } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  experience: number;
  hospital: string;
  avatar: string;
}

export default function DoctorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const doctorId = params.id as string;

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const response = await doctorService.getDoctorById(doctorId);
        setDoctor(response.doctor);
      } catch (error) {
        console.error("Error fetching doctor:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctor();
  }, [doctorId]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    setBooking(true);

    try {
      await appointmentService.createAppointment({
        doctorId,
        appointmentDate: new Date(appointmentDate).toISOString(),
        notes,
      });

      alert("Appointment booked successfully!");
      router.push("/my-appointments");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Booking failed");
    } finally {
      setBooking(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!doctor) return <div>Doctor not found</div>;

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Doctor Info */}
        <div>
          <img src={doctor.avatar} alt={doctor.name} className="w-40 h-40 rounded-full mb-4" />
          <h1 className="text-3xl font-bold">{doctor.name}</h1>
          <p className="text-gray-600 text-lg">{doctor.specialty}</p>
          <p className="text-gray-500">Experience: {doctor.experience} years</p>
          <p className="text-gray-500">{doctor.hospital}</p>
        </div>

        {/* Booking Form */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-6">Book an Appointment</h2>

          <form onSubmit={handleBook} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Date & Time</label>
              <input
                type="datetime-local"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded"
                rows={4}
              />
            </div>

            <button
              type="submit"
              disabled={booking}
              className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {booking ? "Booking..." : "Confirm Booking"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
```

---

## 💬 Step 8: AI Chat Component

**File**: `frontend/src/components/common/AIChatbot.tsx`

```typescript
"use client";

import { useState } from "react";
import { chatService } from "@/services/api";

interface Message {
  role: "user" | "model";
  text: string;
}

export const AIChatbot = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await chatService.sendMessage(input, messages);
      const modelMessage: Message = { role: "model", text: response.reply };
      setMessages((prev) => [...prev, modelMessage]);
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Medical Advisor</h2>

      <div className="space-y-4 mb-4 h-96 overflow-y-auto">
        {messages.map((msg, idx) => (
          <div key={idx} className={`${msg.role === "user" ? "text-right" : ""}`}>
            <div
              className={`inline-block max-w-xs px-4 py-2 rounded-lg ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {loading && <div className="text-gray-500">Typing...</div>}
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe your symptoms..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
};
```

---

## 🔧 Step 9: Update layout.tsx

**File**: `frontend/src/app/layout.tsx`

```typescript
import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Healthcare Booking",
  description: "Book doctor appointments online",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

---

## 🧪 Step 10: Testing the Integration

1. **Start Backend**:
```bash
cd backend
npm run dev
```

2. **Start Frontend**:
```bash
cd frontend
npm run dev
```

3. **Test Flow**:
   - Visit `http://localhost:3000`
   - Register with phone `0987654321` and password
   - Login
   - Browse doctors at `/doctors`
   - Book an appointment
   - View appointments at `/my-appointments`
   - Use AI chat to get medical advice

---

## 📋 Checklist

- [ ] Environment variables set in `frontend/.env.local`
- [ ] AuthContext created and configured
- [ ] API service created with all endpoints
- [ ] ProtectedRoute component created
- [ ] Login page implemented
- [ ] Register page implemented (copy from login pattern)
- [ ] Doctors list page implemented
- [ ] Appointment booking page implemented
- [ ] AI chat component implemented
- [ ] Layout wrapped with AuthProvider
- [ ] Frontend and backend both running
- [ ] Test login/register flow
- [ ] Test doctor browsing
- [ ] Test appointment booking
- [ ] Test AI chat

---

## 🎉 Complete!

Your Healthcare Booking System is now fully integrated!

