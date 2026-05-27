import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { BookingProvider } from "@/context/BookingContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AIChatbot from "@/components/common/AIChatbot";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MedBooking - Hệ thống đặt lịch hẹn bác sĩ trực tuyến",
  description: "Đặt lịch khám bệnh nhanh chóng với đội ngũ bác sĩ uy tín nhất tại MedBooking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-50 via-slate-50 to-white text-slate-900 selection:bg-teal-200">
        <AuthProvider>
          <BookingProvider>
            <Navbar />
            <main className="flex-grow flex flex-col relative">
              {/* Optional ambient background blobs for extra aesthetics */}
              <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-teal-200/20 rounded-full blur-3xl pointer-events-none -z-10" />
              <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-emerald-200/10 rounded-full blur-3xl pointer-events-none -z-10" />
              
              {children}
            </main>
            <Footer />
            <AIChatbot />
            <Toaster position="top-right" toastOptions={{ className: 'dark:bg-slate-800 dark:text-white' }} />
          </BookingProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
