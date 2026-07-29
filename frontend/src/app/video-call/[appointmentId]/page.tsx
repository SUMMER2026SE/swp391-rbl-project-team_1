"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import dynamic from "next/dynamic";
import api from "@/services/api";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import WaitingRoom from "@/components/WaitingRoom";
import toast from "react-hot-toast";
import {
  ShieldAlert, Clock, Star, CalendarDays,
  CheckCircle2, X, Send, Timer
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
  user?: { fullName?: string };
  doctor?: { id?: string; name?: string; specialty?: { name?: string } };
}

function checkTimeWindow(appointmentDate: string) {
  const apptTime = new Date(appointmentDate).getTime();
  const now = Date.now();
  const openAt = apptTime - 15 * 60 * 1000;
  const closeAt = apptTime + 90 * 60 * 1000;
  if (now < openAt) return { allowed: false, minutesUntilOpen: Math.ceil((openAt - now) / 60000) };
  if (now > closeAt) return { allowed: false, minutesUntilOpen: null };
  return { allowed: true, minutesUntilOpen: null };
}

// Component đánh giá sao
function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1 justify-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`w-9 h-9 transition-colors ${
              star <= (hovered || value)
                ? "fill-amber-400 text-amber-400"
                : "text-slate-600"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function PatientVideoCallPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [pageState, setPageState] = useState<PageState>("loading");
  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [minutesLeft, setMinutesLeft] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number>(0);

  // Rating state
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);

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

        if (appt.status !== "CONFIRMED" && appt.status !== "COMPLETED") {
          setErrorMsg("Lịch hẹn chưa được xác nhận hoặc đã bị hủy.");
          setPageState("status-error");
          return;
        }

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

  // Countdown
  useEffect(() => {
    if (pageState !== "time-error" || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(timer); window.location.reload(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [pageState, countdown]);

  const formatCountdown = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h} giờ ${m} phút ${s} giây`;
    return `${m} phút ${s} giây`;
  };

  const handleSubmitRating = async () => {
    if (rating === 0) {
      toast.error("Vui lòng chọn số sao đánh giá.");
      return;
    }
    setSubmittingRating(true);
    try {
      await api.post("/reviews", {
        appointmentId,
        rating,
        comment: comment.trim() || undefined,
      });
      toast.success("Cảm ơn bạn đã đánh giá! 🎉");
      router.push("/my-appointments");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Gửi đánh giá thất bại. Vui lòng thử lại.");
    } finally {
      setSubmittingRating(false);
    }
  };

  if (!user) return (
    <div className="h-screen flex items-center justify-center bg-slate-950">
      <LoadingSpinner className="w-10 h-10 text-teal-500" />
    </div>
  );

  if (pageState === "loading") return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-950 gap-4">
      <LoadingSpinner className="w-10 h-10 text-teal-500" />
      <p className="text-slate-400 text-sm">Đang kiểm tra thông tin lịch hẹn...</p>
    </div>
  );

  if (pageState === "status-error") return (
    <div className="h-screen flex items-center justify-center bg-slate-950 p-6">
      <div className="max-w-md w-full text-center space-y-5">
        <ShieldAlert className="w-16 h-16 text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Không thể vào phòng khám</h2>
        <p className="text-slate-400 text-sm leading-relaxed">{errorMsg}</p>
        <button
          onClick={() => router.push("/my-appointments")}
          className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors text-sm"
        >
          <CalendarDays className="w-4 h-4" />
          Xem lịch hẹn của tôi
        </button>
      </div>
    </div>
  );

  if (pageState === "time-error") return (
    <div className="h-screen flex items-center justify-center bg-slate-950 p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto">
          <Timer className="w-10 h-10 text-amber-400" />
        </div>
        {minutesLeft !== null ? (
          <>
            <h2 className="text-xl font-bold text-white">Phòng khám chưa mở</h2>
            <p className="text-slate-400 text-sm">
              Phòng sẽ mở 15 phút trước giờ hẹn. Vui lòng quay lại sau:
            </p>
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4">
              <p className="text-2xl font-mono font-bold text-amber-400">{formatCountdown(countdown)}</p>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-white">Phiên khám đã kết thúc</h2>
            <p className="text-slate-400 text-sm">{errorMsg}</p>
          </>
        )}
        {appointment && (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 text-left space-y-2">
            <p className="text-xs text-slate-500 font-semibold uppercase">Thông tin lịch hẹn</p>
            <p className="text-sm text-white font-medium">
              Bác sĩ: {appointment.doctor?.name || "—"}
            </p>
            <p className="text-sm text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-teal-400" />
              {new Date(appointment.appointmentDate).toLocaleString("vi-VN")}
            </p>
          </div>
        )}
        <button
          onClick={() => router.push("/my-appointments")}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-6 py-3 rounded-xl font-medium transition-colors text-sm"
        >
          Quay lại lịch hẹn
        </button>
      </div>
    </div>
  );

  if (pageState === "waiting") return (
    <WaitingRoom
      appointmentInfo={{
        doctorName: appointment?.doctor?.name,
        patientName: appointment?.user?.fullName,
        time: appointment ? new Date(appointment.appointmentDate).toLocaleString("vi-VN") : undefined,
        specialty: appointment?.doctor?.specialty?.name,
        role: "patient",
      }}
      onReady={() => setPageState("in-call")}
      onCancel={() => router.push("/my-appointments")}
    />
  );

  if (pageState === "in-call") return (
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
            callerId: appointment?.doctor?.id, // In this case we just use one side as caller and other as callee
            calleeId: user.id,
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
  );

  // Post-call: Modal đánh giá
  if (pageState === "post-call") return (
    <div className="h-screen flex items-center justify-center bg-slate-950 p-6">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Buổi khám đã kết thúc</h2>
          <p className="text-slate-400 text-sm">
            Đánh giá trải nghiệm của bạn với{" "}
            <strong className="text-white">
              {appointment?.doctor?.name || "bác sĩ"}
            </strong>
          </p>
        </div>

        {/* Rating */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-5">
          <div className="space-y-2 text-center">
            <p className="text-sm font-semibold text-slate-300">Bạn đánh giá buổi khám thế nào?</p>
            <StarRating value={rating} onChange={setRating} />
            {rating > 0 && (
              <p className="text-xs text-amber-400 font-medium">
                {["", "Rất tệ", "Tệ", "Bình thường", "Tốt", "Xuất sắc"][rating]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Nhận xét (tuỳ chọn)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ trải nghiệm của bạn với bác sĩ..."
              rows={3}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-teal-500 transition-colors resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleSubmitRating}
            disabled={submittingRating || rating === 0}
            className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all text-sm"
          >
            {submittingRating ? (
              <><LoadingSpinner className="w-4 h-4 text-white" /> Đang gửi...</>
            ) : (
              <><Send className="w-4 h-4" /> Gửi đánh giá</>
            )}
          </button>

          <button
            onClick={() => router.push("/my-appointments")}
            className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 font-medium py-3 rounded-2xl transition-colors text-sm"
          >
            <X className="w-4 h-4" />
            Bỏ qua
          </button>
        </div>
      </div>
    </div>
  );

  return null;
}
