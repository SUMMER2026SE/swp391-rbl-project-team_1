"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import dynamic from "next/dynamic";
import api from "@/services/api";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import WaitingRoom from "@/components/WaitingRoom";
import {
  ShieldAlert, Clock, FileText, CalendarDays,
  CheckCircle2, X, Timer
} from "lucide-react";

const VideoCallRoom = dynamic(() => import("@/components/VideoCallRoom"), {
  ssr: false,
  loading: () => (
    <div className="h-screen flex items-center justify-center bg-slate-950">
      <LoadingSpinner className="w-10 h-10 text-teal-500" />
    </div>
  ),
});

type PageState = "loading" | "time-error" | "status-error" | "waiting" | "in-call" | "post-call";

interface AppointmentData {
  id: string;
  appointmentDate: string;
  status: string;
  user?: { id?: string; fullName?: string };
  doctor?: { name?: string; specialty?: { name?: string } };
}

/**
 * Kiểm tra time window: cho vào 15 phút trước đến 90 phút sau giờ hẹn
 */
function checkTimeWindow(appointmentDate: string): {
  allowed: boolean;
  minutesUntilOpen: number | null;
} {
  const apptTime = new Date(appointmentDate).getTime();
  const now = Date.now();
  const openAt = apptTime - 15 * 60 * 1000;   // 15 phút trước
  const closeAt = apptTime + 90 * 60 * 1000;  // 90 phút sau

  if (now < openAt) {
    return {
      allowed: false,
      minutesUntilOpen: Math.ceil((openAt - now) / 60000),
    };
  }
  if (now > closeAt) {
    return { allowed: false, minutesUntilOpen: null };
  }
  return { allowed: true, minutesUntilOpen: null };
}

export default function DoctorVideoCallPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [pageState, setPageState] = useState<PageState>("loading");
  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [minutesLeft, setMinutesLeft] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number>(0);

  // Fetch appointment data
  useEffect(() => {
    if (!appointmentId) {
      setErrorMsg("Mã lịch hẹn không hợp lệ.");
      setPageState("status-error");
      return;
    }

    async function load() {
      try {
        const res = await api.get(`/appointments/${appointmentId}`);
        const appt: AppointmentData = res.data.appointment;
        setAppointment(appt);

        // Kiểm tra trạng thái
        if (appt.status !== "CONFIRMED" && appt.status !== "COMPLETED") {
          setErrorMsg("Lịch hẹn chưa được xác nhận hoặc đã bị hủy. Vui lòng kiểm tra lại lịch hẹn của bạn.");
          setPageState("status-error");
          return;
        }

        // Kiểm tra time window
        const { allowed, minutesUntilOpen } = checkTimeWindow(appt.appointmentDate);
        if (!allowed) {
          if (minutesUntilOpen !== null) {
            setMinutesLeft(minutesUntilOpen);
            setCountdown(minutesUntilOpen * 60);
          } else {
            setErrorMsg("Phiên khám đã hết hạn (quá 90 phút sau giờ hẹn).");
          }
          setPageState("time-error");
          return;
        }

        setPageState("waiting");
      } catch (err: any) {
        setErrorMsg(err?.response?.data?.message || "Không thể tải thông tin lịch hẹn.");
        setPageState("status-error");
      }
    }

    load();
  }, [appointmentId]);

  // Đếm ngược thời gian chờ mở phòng
  useEffect(() => {
    if (pageState !== "time-error" || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Thử load lại trang khi đến giờ
          window.location.reload();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [pageState, countdown]);

  // Format countdown HH:MM:SS
  const formatCountdown = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h} giờ ${m} phút ${s} giây`;
    return `${m} phút ${s} giây`;
  };

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950">
        <LoadingSpinner className="w-10 h-10 text-teal-500" />
      </div>
    );
  }

  // --- Loading ---
  if (pageState === "loading") {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-950 gap-4">
        <LoadingSpinner className="w-10 h-10 text-teal-500" />
        <p className="text-slate-400 text-sm">Đang kiểm tra thông tin lịch hẹn...</p>
      </div>
    );
  }

  // --- Lỗi trạng thái ---
  if (pageState === "status-error") {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950 p-6">
        <div className="max-w-md w-full text-center space-y-5">
          <ShieldAlert className="w-16 h-16 text-red-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Không thể vào phòng khám</h2>
          <p className="text-slate-400 text-sm leading-relaxed">{errorMsg}</p>
          <button
            onClick={() => router.push("/doctor/appointments")}
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors text-sm"
          >
            <CalendarDays className="w-4 h-4" />
            Xem lịch khám
          </button>
        </div>
      </div>
    );
  }

  // --- Phòng chưa mở (time window) ---
  if (pageState === "time-error") {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950 p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto">
            <Timer className="w-10 h-10 text-amber-400" />
          </div>
          <div className="space-y-2">
            {minutesLeft !== null ? (
              <>
                <h2 className="text-xl font-bold text-white">Phòng khám chưa mở</h2>
                <p className="text-slate-400 text-sm">
                  Phòng sẽ mở 15 phút trước giờ hẹn. Vui lòng quay lại sau:
                </p>
                <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 mt-4">
                  <p className="text-2xl font-mono font-bold text-amber-400">
                    {formatCountdown(countdown)}
                  </p>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-white">Phiên khám đã kết thúc</h2>
                <p className="text-slate-400 text-sm">{errorMsg}</p>
              </>
            )}
          </div>
          {appointment && (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 text-left space-y-2">
              <p className="text-xs text-slate-500 font-semibold uppercase">Thông tin lịch hẹn</p>
              <p className="text-sm text-white font-medium">
                Bệnh nhân: {appointment.user?.fullName || "—"}
              </p>
              <p className="text-sm text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-400" />
                {new Date(appointment.appointmentDate).toLocaleString("vi-VN")}
              </p>
            </div>
          )}
          <button
            onClick={() => router.push("/doctor/appointments")}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-6 py-3 rounded-xl font-medium transition-colors text-sm"
          >
            Quay lại lịch khám
          </button>
        </div>
      </div>
    );
  }

  // --- Phòng chờ ---
  if (pageState === "waiting") {
    return (
      <WaitingRoom
        appointmentInfo={{
          patientName: appointment?.user?.fullName,
          doctorName: appointment?.doctor?.name,
          time: appointment
            ? new Date(appointment.appointmentDate).toLocaleString("vi-VN")
            : undefined,
          specialty: appointment?.doctor?.specialty?.name,
          role: "doctor",
        }}
        onReady={() => setPageState("in-call")}
        onCancel={() => router.push("/doctor/appointments")}
      />
    );
  }

  // --- Trong phòng call ---
  if (pageState === "in-call") return (
    <>
      <VideoCallRoom
        roomID={appointmentId}
        userID={String(user.id)}
        userName={user.fullName || user.email}
        mode="appointment"
        onCallEnd={async (duration) => {
          setPageState("post-call");
          try {
            await api.post("/video-calls/log", {
              appointmentId,
              callerId: user.id,
              calleeId: appointment?.user?.id || user.id, // For tracking we link both sides
              startedAt: new Date(Date.now() - duration * 1000).toISOString(),
              endedAt: new Date().toISOString(),
              durationSeconds: duration,
              callType: "APPOINTMENT"
            });
          } catch (e) {
            console.error("Failed to log video call", e);
          }
        }}
      />
    </>
  );

  // --- Sau khi kết thúc call ---
  if (pageState === "post-call") {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950 p-6">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center space-y-3">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Buổi khám đã kết thúc</h2>
            <p className="text-slate-400 text-sm">
              Bạn có muốn tạo bệnh án ngay cho{" "}
              <strong className="text-white">
                {appointment?.user?.fullName || "bệnh nhân"}
              </strong>{" "}
              không?
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push(`/doctor/examination/${appointmentId}`)}
              className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-2xl transition-all text-sm shadow-lg shadow-teal-500/20"
            >
              <FileText className="w-5 h-5" />
              Tạo bệnh án ngay
            </button>

            <button
              onClick={() => router.push("/doctor/appointments")}
              className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 font-medium py-3 rounded-2xl transition-colors text-sm"
            >
              <X className="w-4 h-4" />
              Để sau
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
