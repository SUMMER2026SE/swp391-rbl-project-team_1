"use client";

import React, { useEffect, useRef } from "react";
import { Phone, PhoneOff } from "lucide-react";
import { useSocket } from "../../context/SocketContext";
import { useRouter } from "next/navigation";

export default function PatientIncomingCall() {
  const { incomingCall, acceptCall, rejectCall, setIncomingCall } = useSocket();
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Play a simple synthesized call sound
  useEffect(() => {
    if (incomingCall) {
      // Setup synthetic ringtone
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      let isPlaying = true;
      let intervalId: any;

      const playRingtone = () => {
        if (!isPlaying) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.type = "sine";
        // Classic ring tone: dual frequency 440Hz & 480Hz alternating
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc.start();
        
        // Stop after 1.5 seconds
        setTimeout(() => {
          try {
            osc.stop();
            osc.disconnect();
            gain.disconnect();
          } catch (e) {}
        }, 1500);
      };

      // Play immediately
      playRingtone();
      // Repeat every 3 seconds
      intervalId = setInterval(playRingtone, 3000);

      return () => {
        isPlaying = false;
        clearInterval(intervalId);
        audioCtx.close();
      };
    }
  }, [incomingCall]);

  if (!incomingCall) return null;

  const handleAccept = () => {
    acceptCall();
    // Redirect to patient video call page
    router.push(`/patient/video-call?appointmentId=${incomingCall.appointmentId}&roomId=${incomingCall.roomId}&doctorId=${incomingCall.doctorId}`);
    setIncomingCall(null);
  };

  const handleReject = () => {
    rejectCall();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform scale-100 transition-transform duration-300 p-6 flex flex-col items-center space-y-6">
        
        {/* Animated pulse background for call icon */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-teal-500/20 animate-ping" />
          <div className="relative flex items-center justify-center w-20 h-20 bg-teal-500 text-white rounded-full shadow-lg">
            <Phone className="w-10 h-10 animate-bounce" />
          </div>
        </div>

        {/* Text */}
        <div className="text-center space-y-2">
          <h3 className="text-xl font-bold text-slate-800 animate-pulse">Cuộc gọi đến từ bác sĩ</h3>
          <p className="text-slate-600 font-semibold text-lg">{incomingCall.doctorName}</p>
          <p className="text-sm text-slate-400">Vui lòng bấm chấp nhận để bắt đầu tư vấn trực tuyến.</p>
        </div>

        {/* Action Buttons */}
        <div className="flex w-full gap-4 pt-2">
          <button
            onClick={handleReject}
            className="flex-1 py-3.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-2xl border border-red-100 transition-colors flex items-center justify-center gap-2"
          >
            <PhoneOff className="w-5 h-5" /> Từ chối
          </button>
          
          <button
            onClick={handleAccept}
            className="flex-1 py-3.5 px-4 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-2xl shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2"
          >
            <Phone className="w-5 h-5" /> Chấp nhận
          </button>
        </div>

      </div>
    </div>
  );
}
