import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
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
  title: "EduPath — Hệ Thống Cá Nhân Hóa Lộ Trình Học Tập Thích Ứng",
  description: "Hệ thống điều phối học tập thích ứng sử dụng BKT, Priority Scheduler và dự đoán rủi ro trì trệ lộ trình cho người học.",
};

import { GoogleOAuthProvider } from '@react-oauth/google';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';

  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full bg-slate-950 text-slate-100 antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100">
        <GoogleOAuthProvider clientId={clientId}>
          <AuthProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: '#0f172a',
                  color: '#f8fafc',
                  border: '1px solid #1e293b',
                },
              }}
            />
            {children}
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
