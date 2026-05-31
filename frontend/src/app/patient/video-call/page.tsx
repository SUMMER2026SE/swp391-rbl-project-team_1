"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { 
  Video, Mic, MicOff, VideoOff, PhoneOff, Settings, 
  Sparkles, Loader2, HeartHandshake, ShieldCheck 
} from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/services/api";
import toast from "react-hot-toast";
import { useVideoCall } from "@/hooks/useVideoCall";

function PatientVideoCallContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const appointmentId = searchParams.get("appointmentId") || "";
  const roomId = searchParams.get("roomId") || "";
  const doctorId = searchParams.get("doctorId") || "";

  const [appointment, setAppointment] = useState<any>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [deviceError, setDeviceError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  // Fetch appointment details on mount
  useEffect(() => {
    if (!appointmentId) return;

    const loadAppointment = async () => {
      try {
        const res = await api.get(`/appointments/${appointmentId}`);
        setAppointment(res.data.appointment);
      } catch (err) {
        console.error("Failed to load appointment details:", err);
      }
    };

    loadAppointment();
  }, [appointmentId]);

  // Request webcam & mic access
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    const getMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        activeStream = stream;
        setLocalStream(stream);
      } catch (err: any) {
        console.warn("Camera + Mic failed, trying audio only...", err);
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          activeStream = audioStream;
          setLocalStream(audioStream);
        } catch (audioErr) {
          console.error("Microphone access failed:", audioErr);
          setDeviceError("permission-denied");
          toast.error("Không thể kết nối Camera/Microphone. Vui lòng kiểm tra quyền truy cập!");
        }
      }
    };

    getMedia();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Update local video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isVideoOff]);

  // Mute audio track
  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted, localStream]);

  // Toggle video track
  useEffect(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !isVideoOff;
      });
    }
  }, [isVideoOff, localStream]);

  // Setup WebRTC Video Call Hook
  const { callStatus, remoteStream, endCall } = useVideoCall({
    appointmentId,
    partnerId: doctorId,
    isInitiator: false,
    roomId,
    localStream,
    onCallEnded: () => {
      toast.success("Cuộc khám trực tuyến đã kết thúc.");
      router.push("/my-appointments");
    },
  });

  // Assign remote video stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Call duration counter
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callStatus === "IN_CALL") {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
  };

  const hasVideoTrack = localStream && localStream.getVideoTracks().length > 0 && localStream.getVideoTracks()[0].readyState === "live";

  return (
    <div className="flex-1 bg-slate-950 text-white flex flex-col items-center justify-center p-4 relative min-h-[calc(100vh-8rem)]">
      
      {/* Top Header info */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 px-4 py-3 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="font-mono text-sm tracking-wider bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            {callStatus === "IN_CALL" ? formatTime(callDuration) : "00:00"}
          </span>
          <span className="text-slate-300 font-semibold text-sm">
            Tư vấn trực tuyến với Bác sĩ {appointment?.doctor?.user?.fullName || ""}
          </span>
        </div>
        <div className="flex items-center gap-2 text-emerald-400 text-xs bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" /> Kết nối mã hóa đầu cuối (P2P)
        </div>
      </div>

      {/* Main Video Stream Container */}
      <div className="w-full max-w-5xl aspect-video bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 relative shadow-2xl flex items-center justify-center">
        
        {callStatus === "IN_CALL" && remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400 space-y-4 p-8 text-center">
            <div className="relative">
              <div className="absolute inset-0 bg-teal-500/20 rounded-full animate-ping" />
              <div className="relative w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center text-teal-400 border border-slate-700">
                <HeartHandshake className="w-10 h-10 animate-pulse" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-200">Đang thiết lập kết nối WebRTC...</h3>
            <p className="text-sm text-slate-500 max-w-md">
              Vui lòng giữ kết nối. Bạn sẽ trò chuyện với Bác sĩ ngay sau khi kết nối hoàn tất.
            </p>
          </div>
        )}

        {/* Local Stream (PIP) */}
        <div className="absolute bottom-6 right-6 w-32 h-44 sm:w-40 sm:h-56 bg-slate-850 rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700 transition-all hover:scale-105 z-20">
          {!isVideoOff && hasVideoTrack ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-500">
              <VideoOff className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-medium">{isVideoOff ? "Cam Tắt" : "Không có Cam"}</span>
            </div>
          )}
        </div>
      </div>

      {/* Control Buttons Panel */}
      <div className="mt-6 flex items-center justify-center gap-4 bg-slate-900/60 backdrop-blur-md px-8 py-4 rounded-3xl border border-slate-800 shadow-xl">
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-slate-800 text-white hover:bg-slate-750'}`}
          title={isMuted ? "Bật Mic" : "Tắt Mic"}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <button 
          onClick={() => setIsVideoOff(!isVideoOff)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isVideoOff ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-slate-800 text-white hover:bg-slate-750'}`}
          title={isVideoOff ? "Bật Cam" : "Tắt Cam"}
        >
          {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </button>

        <button 
          onClick={endCall}
          className="w-16 h-12 rounded-2xl flex items-center justify-center bg-red-500 hover:bg-red-600 text-white transition-all shadow-lg shadow-red-500/25 ml-4"
          title="Kết thúc cuộc gọi"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>

    </div>
  );
}

export default function PatientVideoCallPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">Đang tải cuộc gọi video...</div>}>
      <PatientVideoCallContent />
    </Suspense>
  );
}
