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
  ShieldAlert, Star, MessageSquare,
  CheckCircle2, X, Send, CalendarPlus
} from "lucide-react";

const VideoCallRoom = dynamic(() => import("@/components/VideoCallRoom"), {
  ssr: false,
  loading: () => (
    <div className="h-screen flex items-center justify-center bg-slate-950">
      <LoadingSpinner className="w-10 h-10 text-teal-500" />
    </div>
  ),
});

type PageState = "loading" | "error" | "waiting" | "in-call" | "post-call";

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

export default function ConsultVideoCallPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [pageState, setPageState] = useState<PageState>("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [otherPartyName, setOtherPartyName] = useState<string>("");
  const [doctorId, setDoctorId] = useState<string>("");
  const [doctorSpecialty, setDoctorSpecialty] = useState<string>("");

  const [rating, setRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    if (!conversationId) {
      setErrorMsg("Mã cuộc trò chuyện không hợp lệ.");
      setPageState("error");
      return;
    }

    async function load() {
      try {
        const res = await api.get(`/messages/conversations`);
        const conversations = res.data.conversations;
        const conv = conversations.find((c: any) => c.id === conversationId);

        if (!conv) {
          setErrorMsg("Không tìm thấy cuộc trò chuyện hoặc bạn không có quyền truy cập.");
          setPageState("error");
          return;
        }

        if (user?.role === "DOCTOR") {
          setOtherPartyName(conv.user?.fullName || "Bệnh nhân");
        } else {
          setOtherPartyName(conv.doctor?.name || "Bác sĩ");
          setDoctorId(conv.doctor?.id);
          setDoctorSpecialty(conv.doctor?.specialty?.name);
        }

        setPageState("waiting");
      } catch (err: any) {
        setErrorMsg(err?.response?.data?.message || "Không thể tải thông tin cuộc gọi.");
        setPageState("error");
      }
    }

    load();
  }, [conversationId, user]);

  if (!user) return (
    <div className="h-screen flex items-center justify-center bg-slate-950">
      <LoadingSpinner className="w-10 h-10 text-teal-500" />
    </div>
  );

  if (pageState === "loading") return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-950 gap-4">
      <LoadingSpinner className="w-10 h-10 text-teal-500" />
      <p className="text-slate-400 text-sm">Đang tải thông tin tư vấn...</p>
    </div>
  );

  if (pageState === "error") return (
    <div className="h-screen flex items-center justify-center bg-slate-950 p-6">
      <div className="max-w-md w-full text-center space-y-5">
        <ShieldAlert className="w-16 h-16 text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Lỗi kết nối</h2>
        <p className="text-slate-400 text-sm leading-relaxed">{errorMsg}</p>
        <button
          onClick={() => router.push(user.role === "DOCTOR" ? "/doctor/chat" : "/messages")}
          className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors text-sm"
        >
          <MessageSquare className="w-4 h-4" />
          Quay lại tin nhắn
        </button>
      </div>
    </div>
  );

  if (pageState === "waiting") return (
    <WaitingRoom
      appointmentInfo={{
        doctorName: user.role === "USER" ? otherPartyName : undefined,
        patientName: user.role === "DOCTOR" ? otherPartyName : undefined,
        specialty: doctorSpecialty,
        role: user.role === "DOCTOR" ? "doctor" : "patient",
      }}
      onReady={() => setPageState("in-call")}
      onCancel={() => router.push(user.role === "DOCTOR" ? "/doctor/chat" : "/messages")}
    />
  );

  if (pageState === "in-call") return (
    <VideoCallRoom
      roomID={conversationId}
      userID={String(user.id)}
      userName={user.fullName || user.email}
      mode="consult"
      onCallEnd={async (duration) => {
        setPageState("post-call");
        try {
          await api.post("/video-calls/log", {
            conversationId,
            callerId: user.role === "DOCTOR" ? user.id : doctorId,
            calleeId: user.role === "USER" ? user.id : doctorId, 
            startedAt: new Date(Date.now() - duration * 1000).toISOString(),
            endedAt: new Date().toISOString(),
            durationSeconds: duration,
            callType: "CONSULT"
          });
        } catch (e) {
          console.error("Failed to log video call", e);
        }
      }}
    />
  );

  // Post-call
  if (pageState === "post-call") {
    // Luồng Bác sĩ
    if (user.role === "DOCTOR") {
      return (
        <div className="h-screen flex items-center justify-center bg-slate-950 p-6">
          <div className="max-w-md w-full space-y-6 text-center">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Tư vấn đã kết thúc</h2>
            <p className="text-slate-400 text-sm">
              Bạn đã hoàn thành phiên tư vấn video với <strong className="text-white">{otherPartyName}</strong>.
            </p>
            <button
              onClick={() => router.push("/doctor/chat")}
              className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-2xl transition-all text-sm mt-4"
            >
              <MessageSquare className="w-5 h-5" />
              Quay lại tin nhắn
            </button>
          </div>
        </div>
      );
    }

    // Luồng Bệnh nhân
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-950 p-6 overflow-y-auto">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center space-y-3">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Tư vấn đã kết thúc</h2>
            <p className="text-slate-400 text-sm">
              Đánh giá bác sĩ <strong className="text-white">{otherPartyName}</strong>
            </p>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-5">
            <div className="space-y-2 text-center">
              <StarRating value={rating} onChange={setRating} />
              {rating > 0 && (
                <p className="text-xs text-amber-400 font-medium">
                  {["", "Rất tệ", "Tệ", "Bình thường", "Tốt", "Xuất sắc"][rating]}
                </p>
              )}
            </div>
            <button
              onClick={() => {
                if (rating === 0) { toast.error("Vui lòng chọn số sao."); return; }
                toast.success("Cảm ơn đánh giá của bạn! 🎉");
                router.push("/messages");
              }}
              className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl transition-all text-sm"
            >
              <Send className="w-4 h-4" /> Gửi đánh giá
            </button>
          </div>

          {/* Gợi ý đặt lịch */}
          <div className="bg-teal-900/30 border border-teal-500/30 rounded-2xl p-6 text-center space-y-4">
            <h3 className="font-bold text-teal-400">Bạn muốn khám chuyên sâu hơn?</h3>
            <p className="text-sm text-slate-300">
              Đặt lịch khám trực tiếp với bác sĩ tại phòng khám để được chẩn đoán chính xác nhất.
            </p>
            <button
              onClick={() => router.push(`/doctors/${doctorId}`)}
              className="w-full flex items-center justify-center gap-2 bg-white text-teal-700 hover:bg-teal-50 font-bold py-3 rounded-xl transition-all text-sm"
            >
              <CalendarPlus className="w-4 h-4" /> Đặt lịch khám ngay
            </button>
          </div>

          <button
            onClick={() => router.push("/messages")}
            className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 font-medium py-3 rounded-2xl transition-colors text-sm"
          >
            <X className="w-4 h-4" /> Quay lại tin nhắn
          </button>
        </div>
      </div>
    );
  }

  return null;
}
