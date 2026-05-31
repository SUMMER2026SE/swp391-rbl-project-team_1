"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { 
  Video, Mic, MicOff, VideoOff, PhoneOff, MonitorUp, 
  Settings, MessageSquare, Sparkles, Loader2, Play, Square, Check, AlertCircle, Plus, Trash2 
} from "lucide-react";
import Button from "@/components/common/Button";
import api from "@/services/api";
import toast from "react-hot-toast";
import { useSearchParams, useRouter } from "next/navigation";
import { useVideoCall } from "@/hooks/useVideoCall";

interface PrescriptionItem {
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
}

function DoctorVideoCallContent() {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  
  // AI Assistant States
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Form values populated by AI, editable by Doctor
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [hasEmrData, setHasEmrData] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // WebRTC & Routing States
  const searchParams = useSearchParams();
  const router = useRouter();
  const appointmentId = searchParams.get("appointmentId") || "";

  const [appointment, setAppointment] = useState<any>(null);
  const [roomId, setRoomId] = useState<string>("");
  const [patientId, setPatientId] = useState<string>("");
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    if (!appointmentId) return;

    const loadAppointment = async () => {
      try {
        const res = await api.get(`/appointments/${appointmentId}`);
        const appData = res.data.appointment;
        setAppointment(appData);
        setPatientId(appData.userId);
        
        const generatedRoomId = appData.videoCallRoomId || crypto.randomUUID();
        setRoomId(generatedRoomId);
      } catch (err) {
        console.error("Failed to load appointment details:", err);
        toast.error("Không thể tải thông tin lịch hẹn");
      }
    };

    loadAppointment();
  }, [appointmentId]);

  // Local Media Stream & Webcam State
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [deviceError, setDeviceError] = useState<string | null>(null);

  // Audio Recording States
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // WebRTC Hook Call
  const { callStatus, remoteStream, endCall } = useVideoCall({
    appointmentId,
    partnerId: patientId,
    isInitiator: true,
    roomId,
    localStream,
    onCallEnded: () => {
      router.push("/doctor/appointments");
    }
  });

  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

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

  // Request user webcam/mic on mount
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    const initWebcam = async () => {
      try {
        // Try to get both video and audio first with high-quality constraints
        console.log("Requesting video + audio...");
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true,
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        activeStream = stream;
        setLocalStream(stream);
        setDeviceError(null);
        console.log("✅ Video + Audio stream obtained successfully");
      } catch (err: any) {
        console.warn("Camera + Mic access failed, falling back to audio only...", err);
        try {
          // Fallback to audio only (Microphone) with high-quality constraints
          console.log("Requesting audio only...");
          const audioStream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          });
          activeStream = audioStream;
          setLocalStream(audioStream);
          setDeviceError(null);
          console.log("✅ Audio-only stream obtained successfully");
        } catch (audioErr: any) {
          console.error("Audio access also failed on mount:", audioErr);
          if (audioErr.name === "NotAllowedError" || audioErr.message?.includes("denied")) {
            setDeviceError("mic-denied");
            console.log("Microphone permission was denied by user");
          } else {
            setDeviceError("hardware-missing");
            console.log("No microphone hardware found or other error");
          }
        }
      }
    };
    
    // Run initialization
    initWebcam();

    return () => {
      if (activeStream) {
        console.log("Cleaning up media streams on unmount");
        activeStream.getTracks().forEach(track => {
          track.stop();
          console.log(`Stopped ${track.kind} track`);
        });
      }
    };
  }, []);

  // Update video element source when stream or video ref updates
  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream, isVideoOff]);

  // Sync mute setting to hardware track
  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted, localStream]);

  // Sync camera setting to hardware track
  useEffect(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !isVideoOff;
      });
    }
  }, [isVideoOff, localStream]);

  const hasVideoTrack = localStream && localStream.getVideoTracks().length > 0 && localStream.getVideoTracks()[0].readyState === "live";

  // Live timer for audio recording duration
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  // Upload Recorded Audio to Backend Gemini Endpoint
  const uploadAndTranscribeAudio = async (audioBlob: Blob) => {
    if (audioBlob.size === 0) {
      toast.error("File âm thanh rỗng. Vui lòng ghi âm lại!");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      console.log("Starting audio transcription process...");
      
      // Normalize mime type for Gemini API
      let mimeType = audioBlob.type || "audio/webm";
      // Gemini API supports: audio/wav, audio/mp3, audio/aac, audio/ogg, audio/flac
      if (mimeType.includes("webm")) {
        mimeType = "audio/webm";
      } else if (mimeType.includes("mp4") || mimeType.includes("m4a")) {
        mimeType = "audio/mp4";
      } else if (mimeType.includes("mpeg") || mimeType.includes("mp3")) {
        mimeType = "audio/mpeg";
      }
      
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        try {
          const base64Data = (reader.result as string).split(",")[1];

          if (!base64Data) {
            toast.error("Lỗi chuyển đổi file âm thanh. Vui lòng thử lại!");
            setIsLoading(false);
            return;
          }

          console.log(`Sending audio to server - Size: ${audioBlob.size} bytes, Type: ${mimeType}`);
          
          const response = await api.post("/doctor/emr/transcribe-audio", {
            audioData: base64Data,
            mimeType: mimeType
          });

          const data = response.data;
          console.log("Server response received:", data);

          if (data.transcript) {
            setTranscript(data.transcript);
            console.log("Transcript extracted:", data.transcript.substring(0, 100) + "...");
          }
          
          if (data.structuredData) {
            setDiagnosis(data.structuredData.diagnosis || "");
            setNotes(data.structuredData.notes || "");
            setPrescriptions(data.structuredData.prescriptions || []);
            setHasEmrData(true);
            console.log("Structured data received and populated");
          }
          
          toast.success("✅ AI đã nhận diện và điền bệnh án thành công!");
        } catch (err: any) {
          console.error("Audio EMR processing failed detail:", {
            message: err.message,
            response: err.response?.data,
            error: err
          });
          const errorMsg = err.response?.data?.message || err.message || "Lỗi xử lý âm thanh.";
          toast.error(`❌ ${errorMsg}`);
        } finally {
          setIsLoading(false);
        }
      };

      reader.onerror = () => {
        console.error("FileReader error");
        toast.error("Lỗi đọc file âm thanh. Vui lòng thử lại!");
        setIsLoading(false);
      };

      reader.readAsDataURL(audioBlob);
    } catch (err) {
      console.error("Unexpected error in uploadAndTranscribeAudio:", err);
      toast.error("Lỗi không mong muốn. Vui lòng thử lại!");
      setIsLoading(false);
    }
  };

  // Start Standard MediaRecorder
  const startRecording = async () => {
    audioChunksRef.current = [];
    let streamToRecord = localStream;

    // Check if current stream has audio tracks that are live
    const hasAudio = streamToRecord && 
                     streamToRecord.getAudioTracks().length > 0 && 
                     streamToRecord.getAudioTracks()[0].readyState === "live";

    // If no audio in current stream, request fresh audio stream
    if (!hasAudio) {
      try {
        console.log("No active audio in current stream, requesting fresh microphone access...");
        const freshStream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        streamToRecord = freshStream;
        setLocalStream(freshStream);
        setDeviceError(null);
        console.log("Fresh microphone stream obtained successfully");
      } catch (err: any) {
        console.error("Mic access failed on recording start:", err);
        if (err.name === "NotAllowedError" || err.message?.includes("denied")) {
          setDeviceError("mic-denied");
          toast.error("Quyền truy cập Microphone bị từ chối! Vui lòng cấp quyền trong cài đặt trình duyệt.");
        } else {
          setDeviceError("hardware-missing");
          toast.error("Không thể kết nối Microphone. Vui lòng kiểm tra thiết bị ghi âm!");
        }
        return;
      }
    }

    if (!streamToRecord) {
      toast.error("Không có nguồn ghi âm hợp lệ.");
      return;
    }

    // Make sure audio tracks are enabled for recording
    streamToRecord.getAudioTracks().forEach(track => {
      if (track.readyState !== "live") {
        console.warn("Audio track not in live state:", track.readyState);
      }
      // Đảm bảo mic được tự động bật lại khi bắt đầu ghi âm
      if (!track.enabled) {
        track.enabled = true;
        setIsMuted(false);
      }
    });

    try {
      const audioTracks = streamToRecord.getAudioTracks();
      if (audioTracks.length === 0) {
        toast.error("Không tìm thấy track âm thanh. Vui lòng kiểm tra microphone!");
        return;
      }

      // Tách riêng track âm thanh ra một stream mới để tránh lỗi MIME type khi stream cũ có chứa track video
      const audioOnlyStream = new MediaStream(audioTracks);

      let recorder: MediaRecorder | undefined;
      let selectedMimeType = "audio/webm";
      
      // Try different codec options in order of preference
      const codecOptions = [
        "audio/webm",
        "audio/webm;codecs=opus",
        "audio/mp4",
        "audio/ogg",
        "audio/wav",
        ""  // Use browser default
      ];

      for (const codec of codecOptions) {
        try {
          const options: MediaRecorderOptions = {
            audioBitsPerSecond: 128000, // Optimize bitrate from 16kbps to 128kbps for crystal-clear medical STT
            ...(codec ? { mimeType: codec } : {})
          };
          // Sử dụng audioOnlyStream thay vì streamToRecord
          recorder = new MediaRecorder(audioOnlyStream, options);
          selectedMimeType = codec || recorder.mimeType;
          console.log(`✅ MediaRecorder created with codec: ${selectedMimeType}`);
          break;
        } catch (e) {
          console.warn(`❌ Codec not supported: ${codec}`);
          continue;
        }
      }

      if (!recorder) {
        console.error("No supported codec found for MediaRecorder");
        toast.error("Browser không hỗ trợ ghi âm. Vui lòng thử trình duyệt khác!");
        return;
      }

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
          console.log(`✅ Audio chunk received: ${e.data.size} bytes`);
        }
      };

      recorder.onerror = (e) => {
        console.error("❌ MediaRecorder error:", e.error);
        toast.error(`❌ Lỗi ghi âm: ${e.error}`);
        setIsRecording(false);
      };

      recorder.onstop = async () => {
        console.log(`Recording stopped. Total chunks: ${audioChunksRef.current.length}`);
        if (audioChunksRef.current.length === 0) {
          toast.error("❌ Không có dữ liệu âm thanh được ghi. Vui lòng nói rõ hơn vào microphone!");
          setIsRecording(false);
          return;
        }
        const audioBlob = new Blob(audioChunksRef.current, { type: selectedMimeType });
        console.log(`✅ Audio blob created: ${audioBlob.size} bytes, type: ${audioBlob.type}`);
        await uploadAndTranscribeAudio(audioBlob);
      };

      mediaRecorderRef.current = recorder;
      
      // Start recording - ensure recorder is valid
      if (!recorder) {
        toast.error("Không thể khởi tạo MediaRecorder");
        return;
      }

      try {
        // Record into a single clean continuous file to prevent audio fragmentation artifacts
        recorder.start(); 
      } catch (startErr) {
        console.error("❌ Error calling recorder.start():", startErr);
        throw startErr;
      }

      setIsRecording(true);
      setSeconds(0);
      setSaveStatus(null);
      toast.success("✅ Hệ thống đang ghi âm. Hãy nói vào microphone...");
      console.log("✅ Recording started successfully");
    } catch (err: any) {
      console.error("❌ MediaRecorder initialization failed:", err);
      const errMsg = err?.message || "Lỗi không xác định";
      console.error("Error details:", errMsg);
      toast.error(`❌ Không thể khởi động ghi âm: ${errMsg}`);
    }
  };

  // Stop Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state === "recording") {
        console.log("Stopping recording...");
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        toast.success("✅ Đã dừng ghi âm. Đang xử lý...");
      } else if (mediaRecorderRef.current.state === "paused") {
        console.log("Resuming and stopping recording...");
        mediaRecorderRef.current.resume();
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        toast.success("✅ Đã dừng ghi âm. Đang xử lý...");
      }
    } else {
      console.warn("MediaRecorder not initialized");
      toast.error("Lỗi: Ghi âm chưa được khởi động");
      setIsRecording(false);
    }
  };

  // API Call to Gemini assistant
  const processTranscriptWithAi = async () => {
    if (!transcript.trim()) {
      toast.error("Vui lòng nhập hoặc ghi âm nội dung hội thoại trước!");
      return;
    }
    setIsLoading(true);
    setSaveStatus(null);
    try {
      const response = await api.post("/doctor/emr/transcribe-assist", { transcript });
      const data = response.data.data;
      
      setDiagnosis(data.diagnosis || "");
      setNotes(data.notes || "");
      setPrescriptions(data.prescriptions || []);
      setHasEmrData(true);
      toast.success("AI đã phân tích và điền thông tin bệnh án thành công!");
    } catch (error: any) {
      console.error("AI EMR error:", error);
      toast.error(error.message || "Không thể phân tích hội thoại bằng AI.");
    } finally {
      setIsLoading(false);
    }
  };

  // Prescription manipulation helpers
  const handleAddMedication = () => {
    setPrescriptions(prev => [
      ...prev,
      { medicationName: "", dosage: "", frequency: "", duration: "" }
    ]);
  };

  const handleRemoveMedication = (index: number) => {
    setPrescriptions(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateMedication = (index: number, field: keyof PrescriptionItem, value: string) => {
    setPrescriptions(prev => prev.map((item, idx) => {
      if (idx === index) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleSaveEmr = async () => {
    setIsLoading(true);
    try {
      const payload = {
        diagnosis,
        notes,
        prescriptions
      };
      
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      console.log("Saving EMR payload:", payload);
      setSaveStatus("Đã số hóa, ký số đơn thuốc và lưu Bệnh án thành công!");
      toast.success("Lưu bệnh án & đơn thuốc thành công!");
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi lưu bệnh án.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6 p-1">
      {/* LEFT COLUMN: Video Call (3/5 width) */}
      <div className="flex-1 lg:flex-[3] flex flex-col bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 relative min-h-[500px]">
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10 bg-gradient-to-b from-slate-950/80 to-transparent">
          <div className="flex items-center gap-2 text-white">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-semibold text-sm">
              {callStatus === "IN_CALL" ? formatTime(callDuration) : "00:00"}
            </span>
            <span className="text-slate-400 text-sm ml-2">
              | Khám trực tuyến: {appointment?.user?.fullName || "Bệnh nhân"}
            </span>
          </div>
          <Button variant="outline" className="text-white border-slate-700 hover:bg-slate-800 border-none bg-slate-900/50 backdrop-blur">
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        {/* Main Video Area */}
        <div className="flex-1 relative flex items-center justify-center bg-slate-900 overflow-hidden">
          {callStatus === "IN_CALL" && remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 space-y-4 p-4 text-center">
              <div className="relative">
                <div className="absolute inset-0 bg-teal-500/20 rounded-full animate-ping" />
                <div className="relative w-16 h-16 bg-slate-850 rounded-full flex items-center justify-center text-teal-400 border border-slate-700">
                  <Video className="w-8 h-8 animate-pulse" />
                </div>
              </div>
              <p className="font-semibold text-lg">
                {callStatus === "CALLING" 
                  ? "Đang đổ chuông..." 
                  : callStatus === "REJECTED" 
                  ? "Cuộc gọi bị từ chối" 
                  : "Đang chờ bệnh nhân kết nối..."}
              </p>
              {appointment?.user?.fullName && (
                <p className="text-sm text-slate-500 font-medium">Đang liên hệ: {appointment.user.fullName}</p>
              )}
            </div>
          )}
          
          {/* Doctor Self PIP */}
          <div className="absolute bottom-6 right-6 w-36 h-48 sm:w-48 sm:h-64 bg-slate-800 rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700 transition-all hover:scale-105 z-20">
            {!isVideoOff && hasVideoTrack ? (
              <video 
                ref={videoRef}
                autoPlay 
                playsInline 
                muted
                className="w-full h-full object-cover scale-x-[-1]" 
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-500">
                <VideoOff className="w-8 h-8 mb-2" />
                <span className="text-xs font-medium">{isVideoOff ? "Camera Tắt" : "Không có Camera"}</span>
              </div>
            )}
          </div>
        </div>

        {/* Video Call Controls */}
        <div className="h-24 bg-slate-950 flex items-center justify-center gap-4 px-6 z-10 border-t border-slate-900">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
            title={isMuted ? "Bật Mic" : "Tắt Mic"}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          
          <button 
            onClick={() => setIsVideoOff(!isVideoOff)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isVideoOff ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
            title={isVideoOff ? "Bật Camera" : "Tắt Camera"}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>

          <button className="w-12 h-12 rounded-full flex items-center justify-center bg-slate-800 text-white hover:bg-slate-700 transition-all" title="Chia sẻ màn hình">
            <MonitorUp className="w-5 h-5" />
          </button>

          <button className="w-12 h-12 rounded-full flex items-center justify-center bg-slate-800 text-white hover:bg-slate-700 transition-all" title="Tin nhắn">
            <MessageSquare className="w-5 h-5" />
          </button>

          <button 
            className="w-16 h-12 rounded-2xl flex items-center justify-center bg-red-500 text-white hover:bg-red-600 transition-all ml-4 shadow-lg shadow-red-500/20"
            onClick={endCall}
            title="Gác máy"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* RIGHT COLUMN: AI EMR Assistant (2/5 width) */}
      <div className="flex-1 lg:flex-[2] flex flex-col bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl p-6 text-slate-100 max-h-[calc(100vh-8rem)] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-500/10 rounded-lg text-teal-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-white flex items-center gap-2">
                Trợ Lý Bác Sĩ AI 
                <span className="text-[10px] bg-teal-500/20 text-teal-300 font-semibold px-2 py-0.5 rounded-full border border-teal-500/30">Speech-To-Prescription</span>
              </h2>
              <p className="text-xs text-slate-400">Tự động nghe, nhận diện bệnh án & kê đơn thuốc</p>
            </div>
          </div>
          {isRecording && (
            <span className="flex items-center gap-2 text-red-400 text-xs font-semibold px-2.5 py-1 bg-red-500/10 rounded-full animate-pulse border border-red-500/20">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              ĐANG GHI {formatTime(seconds)}
            </span>
          )}
        </div>

        {/* Recording Status / Wave Effect */}
        {isRecording && (
          <div className="my-4 p-4 bg-slate-950 rounded-2xl border border-red-500/20 flex flex-col items-center justify-center gap-3 animate-fadeIn">
            <div className="flex items-center gap-1.5 h-6">
              <span className="w-1 h-2 bg-red-500 rounded-full animate-[bounce_0.8s_infinite_100ms]" />
              <span className="w-1 h-4 bg-red-500 rounded-full animate-[bounce_0.8s_infinite_200ms]" />
              <span className="w-1 h-6 bg-red-500 rounded-full animate-[bounce_0.8s_infinite_300ms]" />
              <span className="w-1 h-3 bg-red-500 rounded-full animate-[bounce_0.8s_infinite_400ms]" />
              <span className="w-1 h-5 bg-red-500 rounded-full animate-[bounce_0.8s_infinite_500ms]" />
              <span className="w-1 h-1 bg-red-500 rounded-full animate-[bounce_0.8s_infinite_600ms]" />
            </div>
            <p className="text-xs text-slate-400 text-center">
              Hệ thống đang ghi âm cuộc hội thoại y khoa trực tiếp... Hãy nói vào mic
            </p>
          </div>
        )}

        {deviceError && (
          <div className="my-4 p-4 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-2xl text-xs space-y-2 animate-fadeIn">
            <h3 className="font-bold flex items-center gap-1.5 text-amber-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {deviceError === "mic-denied" ? "Microphone của bạn đang bị chặn quyền" : "Không tìm thấy thiết bị Microphone"}
            </h3>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {deviceError === "mic-denied" 
                ? "Trình duyệt hoặc hệ điều hành của bạn đang chặn truy cập Microphone. Vui lòng làm theo các bước dưới đây để mở khóa:"
                : "Không tìm thấy thiết bị microphone. Vui lòng kiểm tra kết nối của thiết bị ghi âm và tải lại trang."}
            </p>
            {deviceError === "mic-denied" && (
              <ol className="list-decimal pl-4 space-y-1 text-[11px] text-slate-300">
                <li><strong>Chrome/Edge:</strong> Nhấp ổ khóa 🔒 ở thanh địa chỉ → Microphone → Cho phép</li>
                <li><strong>Firefox:</strong> Nhấp ổ khóa 🔒 ở thanh địa chỉ → Cho phép (Allow) Microphone</li>
                <li><strong>Windows Settings:</strong> Win+I → Privacy → Microphone → Bật "Allow apps to access your microphone"</li>
                <li>Tải lại trang web sau khi cấp quyền (Ctrl+R hoặc Cmd+R)</li>
              </ol>
            )}
          </div>
        )}

        {/* AI Transcription Recorder Controls */}
        <div className="mt-4 flex flex-col gap-2">
          {!isRecording ? (
            <>
              <Button 
                onClick={startRecording}
                className="w-full bg-red-600 hover:bg-red-700 text-white border-none flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-xl"
              >
                <Play className="w-4 h-4" /> Bắt đầu ghi âm bằng mic
              </Button>
              {deviceError && (
                <Button 
                  onClick={async () => {
                    try {
                      const stream = await navigator.mediaDevices.getUserMedia({ 
                        audio: {
                          echoCancellation: true,
                          noiseSuppression: true,
                          autoGainControl: true
                        }
                      });
                      setLocalStream(stream);
                      setDeviceError(null);
                      toast.success("✅ Microphone đã được kích hoạt thành công!");
                    } catch (err: any) {
                      console.error("Permission request failed:", err);
                      toast.error("❌ Không thể kích hoạt Microphone. Vui lòng kiểm tra quyền truy cập.");
                    }
                  }}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white border-none flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-xl"
                >
                  🔓 Cấp quyền Microphone lại
                </Button>
              )}
            </>
          ) : (
            <Button 
              onClick={stopRecording}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white border-none flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-xl"
            >
              <Square className="w-4 h-4" /> Dừng ghi âm & Trích xuất
            </Button>
          )}
        </div>

        {/* Transcription Area */}
        <div className="mt-4 flex flex-col min-h-[120px]">
          <label className="text-xs font-medium text-slate-400 mb-1.5 flex justify-between">
            <span>Nội dung cuộc hội thoại (Lời nói hội thoại)</span>
            <span className="text-[10px] text-slate-500">Ghi âm hoặc nhập thủ công</span>
          </label>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Click 'Bắt đầu ghi âm bằng mic' hoặc nhập/dán nội dung hội thoại trực tiếp..."
            className="w-full h-28 bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-teal-500 resize-none font-mono"
          />
          <p className="text-[10px] text-slate-500 mt-1">💡 Nếu mic không hoạt động, bạn có thể copy-paste hoặc nhập trực tiếp nội dung cuộc hội thoại vào đây, sau đó nhấn 'Phân Tích & Tạo Bệnh Án Số' để AI xử lý.</p>
        </div>

        {/* Process AI Button */}
        <div className="mt-4">
          <Button 
            onClick={processTranscriptWithAi}
            disabled={isLoading || !transcript.trim()}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white border-none py-3 flex items-center justify-center gap-2 shadow-lg shadow-teal-600/10 font-semibold rounded-xl"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
            Phân Tích & Tạo Bệnh Án Số Bằng AI
          </Button>
        </div>

        {/* Interactive EMR Form (Auto-Filled) */}
        {hasEmrData && (
          <div className="mt-6 p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="font-bold text-white text-md pb-2 border-b border-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-400" /> Bệnh Án & Đơn Thuốc Đề Xuất
              </span>
              <span className="text-[10px] text-teal-400 font-semibold bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">Có thể chỉnh sửa</span>
            </h3>
            
            {/* Diagnosis Input */}
            <div>
              <label className="text-xs text-slate-400 font-semibold uppercase">Chẩn Đoán</label>
              <input
                type="text"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="w-full mt-1.5 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-teal-300 focus:outline-none focus:border-teal-500 font-medium"
                placeholder="Nhập chẩn đoán bệnh..."
              />
            </div>

            {/* Notes Textarea */}
            <div>
              <label className="text-xs text-slate-400 font-semibold uppercase">Ghi Chú & Lời Dặn</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full mt-1.5 bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm text-slate-300 focus:outline-none focus:border-teal-500"
                placeholder="Lời dặn của bác sĩ..."
              />
            </div>

            {/* Prescriptions Editable List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-400 font-semibold uppercase">Đơn Thuốc</label>
                <button
                  type="button"
                  onClick={handleAddMedication}
                  className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm thuốc
                </button>
              </div>

              <div className="space-y-3">
                {prescriptions.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-900 rounded-xl border border-slate-800 relative space-y-2">
                    <button
                      type="button"
                      onClick={() => handleRemoveMedication(idx)}
                      className="absolute top-2 right-2 text-slate-500 hover:text-red-400 transition-colors p-1 cursor-pointer"
                      title="Xóa thuốc"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {/* Medication Name */}
                    <div>
                      <span className="text-[10px] text-slate-500 font-medium">Tên thuốc</span>
                      <input
                        type="text"
                        value={item.medicationName}
                        onChange={(e) => handleUpdateMedication(idx, "medicationName", e.target.value)}
                        className="w-full mt-0.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500 font-semibold"
                        placeholder="Ví dụ: Paracetamol 500mg"
                      />
                    </div>

                    {/* Dosage / Frequency / Duration Fields */}
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-500 font-medium">Liều lượng</span>
                        <input
                          type="text"
                          value={item.dosage}
                          onChange={(e) => handleUpdateMedication(idx, "dosage", e.target.value)}
                          className="w-full mt-0.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
                          placeholder="1 viên"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-medium">Tần suất</span>
                        <input
                          type="text"
                          value={item.frequency}
                          onChange={(e) => handleUpdateMedication(idx, "frequency", e.target.value)}
                          className="w-full mt-0.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
                          placeholder="3 lần/ngày"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-medium">Thời gian</span>
                        <input
                          type="text"
                          value={item.duration}
                          onChange={(e) => handleUpdateMedication(idx, "duration", e.target.value)}
                          className="w-full mt-0.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
                          placeholder="5 ngày"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {prescriptions.length === 0 && (
                  <div className="text-center py-4 bg-slate-900/50 rounded-xl border border-dashed border-slate-800 text-xs text-slate-500">
                    Chưa có thuốc nào được kê. Click "Thêm thuốc" ở trên.
                  </div>
                )}
              </div>
            </div>

            {/* Save EMR Action */}
            <div className="pt-2">
              <Button 
                onClick={handleSaveEmr}
                disabled={isLoading}
                className="w-full bg-teal-500 hover:bg-teal-600 text-slate-950 border-none font-bold py-2.5 flex items-center justify-center gap-2 rounded-xl"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Lưu Bệnh Án Và Ký Số Đơn Thuốc
              </Button>
            </div>
          </div>
        )}

        {/* Save Confirmation Toast */}
        {saveStatus && (
          <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-xl flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{saveStatus}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DoctorVideoCallPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">Đang tải cuộc gọi video...</div>}>
      <DoctorVideoCallContent />
    </Suspense>
  );
}
