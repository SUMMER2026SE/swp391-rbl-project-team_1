import axios from "axios";

// Standard Backend Base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor to handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Standard error response from backend
    const message = error.response?.data?.message || "Đã xảy ra lỗi hệ thống!";
    const status = error.response?.status;

    if (status === 401 && typeof window !== "undefined") {
      // Clear storage on unauthorized token
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Optional: redirect to login if necessary
    }

    return Promise.reject({
      message,
      status,
      originalError: error,
    });
  }
);

export default api;
export interface ApiError {
  message: string;
  status?: number;
  originalError: unknown;
}
