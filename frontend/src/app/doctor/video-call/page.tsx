"use client";

import React from "react";
import { Video, Mic, MicOff, VideoOff, PhoneOff, MonitorUp, Settings, MessageSquare } from "lucide-react";
import Button from "@/components/common/Button";

export default function DoctorVideoCallPage() {
  const [isMuted, setIsMuted] = React.useState(false);
  const [isVideoOff, setIsVideoOff] = React.useState(false);

  return (
    <div className="h-[calc(100vh-8rem)] min-h-[600px] flex flex-col bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 relative">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10 bg-gradient-to-b from-slate-950/80 to-transparent">
        <div className="flex items-center gap-2 text-white">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="font-semibold text-sm">05:24</span>
          <span className="text-slate-400 text-sm ml-2">| Khám bệnh trực tuyến: Nguyễn Văn A</span>
        </div>
        <Button variant="outline" className="text-white border-slate-700 hover:bg-slate-800 border-none bg-slate-900/50 backdrop-blur">
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      {/* Main Video Area */}
      <div className="flex-1 relative flex items-center justify-center bg-slate-900">
        {/* Patient Video (Mock) */}
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop" 
            alt="Patient" 
            className="w-full h-full object-cover opacity-80"
          />
        </div>
        
        {/* Doctor Video (Self - PIP) */}
        <div className="absolute bottom-6 right-6 w-48 h-64 bg-slate-800 rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700 transition-all hover:scale-105 z-20">
          {!isVideoOff ? (
            <img 
              src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=400&auto=format&fit=crop" 
              alt="Self" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-500">
              <VideoOff className="w-8 h-8 mb-2" />
              <span className="text-xs font-medium">Camera off</span>
            </div>
          )}
        </div>
      </div>

      {/* Control Bar */}
      <div className="h-24 bg-slate-950 flex items-center justify-center gap-4 px-6 z-10">
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
        
        <button 
          onClick={() => setIsVideoOff(!isVideoOff)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isVideoOff ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
        >
          {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </button>

        <button className="w-12 h-12 rounded-full flex items-center justify-center bg-slate-800 text-white hover:bg-slate-700 transition-all">
          <MonitorUp className="w-5 h-5" />
        </button>

        <button className="w-12 h-12 rounded-full flex items-center justify-center bg-slate-800 text-white hover:bg-slate-700 transition-all">
          <MessageSquare className="w-5 h-5" />
        </button>

        <button 
          className="w-16 h-12 rounded-2xl flex items-center justify-center bg-red-500 text-white hover:bg-red-600 transition-all ml-4 shadow-lg shadow-red-500/20"
          onClick={() => alert("Chức năng gọi video hiện đang là bản demo UI.")}
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
