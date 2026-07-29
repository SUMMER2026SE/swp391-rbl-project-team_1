"use client";

import { useEffect, useRef, useState } from "react";
import {
  Camera, CameraOff, Mic, MicOff, RotateCcw,
  Video, User, Clock, Stethoscope, AlertTriangle, CheckCircle
} from "lucide-react";

interface AppointmentInfo {
  doctorName?: string;
  patientName?: string;
  time?: string;
  specialty?: string;
  role?: "doctor" | "patient";
}

interface WaitingRoomProps {
  appointmentInfo?: AppointmentInfo;
  onReady: () => void;
  onCancel: () => void;
}

function DeviceStatus({
  ok,
  label,
  icon,
}: {
  ok: boolean | null;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border ${
        ok === null
          ? "bg-slate-800 border-slate-700 text-slate-400"
          : ok
          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
          : "bg-red-500/10 border-red-500/20 text-red-400"
      }`}
    >
      {icon}
      <span>{label}</span>
      {ok === null ? (
        <span className="ml-auto w-2 h-2 rounded-full bg-slate-600 animate-pulse" />
      ) : ok ? (
        <CheckCircle className="ml-auto w-3.5 h-3.5" />
      ) : (
        <AlertTriangle className="ml-auto w-3.5 h-3.5" />
      )}
    </div>
  );
}

export default function WaitingRoom({ appointmentInfo, onReady, onCancel }: WaitingRoomProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [hasMic, setHasMic] = useState<boolean | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [checking, setChecking] = useState(true);

  const otherParty = appointmentInfo?.role === "doctor"
    ? appointmentInfo?.patientName || "Bệnh nhân"
    : appointmentInfo?.doctorName || "Bác sĩ";

  // Khởi tạo camera & mic
  const initMedia = async () => {
    setChecking(true);

    // Dừng stream cũ nếu có
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    cancelAnimationFrame(animFrameRef.current);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: true,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setHasCamera(stream.getVideoTracks().length > 0);
      setHasMic(stream.getAudioTracks().length > 0);

      // Thiết lập visualizer sóng âm mic
      setupAudioVisualizer(stream);
    } catch (err: any) {
      console.warn("Media init failed:", err);

      // Thử chỉ audio nếu camera fail
      try {
        const audioOnly = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = audioOnly;
        setHasCamera(false);
        setHasMic(true);
        setupAudioVisualizer(audioOnly);
      } catch {
        setHasCamera(false);
        setHasMic(false);
      }
    } finally {
      setChecking(false);
    }
  };

  // Web Audio API visualizer
  const setupAudioVisualizer = (stream: MediaStream) => {
    try {
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const drawWave = () => {
        animFrameRef.current = requestAnimationFrame(drawWave);
        const canvas = canvasRef.current;
        if (!canvas || !analyserRef.current) return;

        const canvasCtx = canvas.getContext("2d");
        if (!canvasCtx) return;

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);

        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 2.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height;
          const alpha = 0.5 + (dataArray[i] / 255) * 0.5;

          canvasCtx.fillStyle = `rgba(20, 184, 166, ${alpha})`; // teal-500
          canvasCtx.fillRect(
            x,
            canvas.height - barHeight,
            barWidth - 1,
            barHeight
          );
          x += barWidth;
        }
      };

      drawWave();
    } catch (e) {
      console.warn("Audio visualizer setup failed:", e);
    }
  };

  const toggleCamera = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach((t) => {
        t.enabled = !isCameraOn ? true : false;
      });
      setIsCameraOn(!isCameraOn);
    }
  };

  const toggleMic = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = !isMicOn ? true : false;
      });
      setIsMicOn(!isMicOn);
    }
  };

  useEffect(() => {
    initMedia();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);


  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Cột trái — Preview Camera */}
        <div className="space-y-4">
          <div className="bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 relative aspect-video flex items-center justify-center">
            {hasCamera === false || !isCameraOn ? (
              <div className="flex flex-col items-center gap-3 text-slate-500">
                <CameraOff className="w-12 h-12" />
                <span className="text-sm font-medium">
                  {hasCamera === false ? "Không tìm thấy camera" : "Camera đang tắt"}
                </span>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover transform -scale-x-100"
              />
            )}

            {/* Label */}
            <div className="absolute bottom-3 left-3 bg-slate-950/70 backdrop-blur text-xs font-semibold px-2 py-1 rounded-lg text-white">
              Bạn
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={toggleCamera}
              disabled={hasCamera === false}
              title={isCameraOn ? "Tắt camera" : "Bật camera"}
              className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                !isCameraOn
                  ? "bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30"
                  : "bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
              }`}
            >
              {isCameraOn ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleMic}
              disabled={hasMic === false}
              title={isMicOn ? "Tắt mic" : "Bật mic"}
              className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                !isMicOn
                  ? "bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30"
                  : "bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
              }`}
            >
              {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>

            <button
              onClick={initMedia}
              title="Kiểm tra lại thiết bị"
              className="w-12 h-12 rounded-full flex items-center justify-center border bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white transition-all"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Mic Visualizer */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-3">
            <p className="text-xs text-slate-500 mb-2 font-medium">Sóng âm microphone</p>
            <canvas
              ref={canvasRef}
              width={400}
              height={48}
              className="w-full h-12 rounded-lg"
            />
            {hasMic === false && (
              <p className="text-xs text-slate-500 text-center py-2">
                Không tìm thấy microphone
              </p>
            )}
          </div>

          {/* Trạng thái thiết bị */}
          <div className="grid grid-cols-2 gap-2">
            <DeviceStatus
              ok={hasCamera}
              label="Camera"
              icon={<Camera className="w-3.5 h-3.5" />}
            />
            <DeviceStatus
              ok={hasMic}
              label="Microphone"
              icon={<Mic className="w-3.5 h-3.5" />}
            />
          </div>

          {/* Cảnh báo thiết bị */}
          {(hasCamera === false || hasMic === false) && !checking && (
            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3 rounded-xl text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Không tìm thấy {hasCamera === false && hasMic === false
                  ? "camera và microphone"
                  : hasCamera === false ? "camera" : "microphone"}
                . Bạn vẫn có thể tham gia phòng nhưng trải nghiệm sẽ bị hạn chế.
              </span>
            </div>
          )}
        </div>

        {/* Cột phải — Thông tin buổi khám + Actions */}
        <div className="flex flex-col justify-between space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 text-teal-400 mb-2">
              <Video className="w-5 h-5" />
              <span className="text-sm font-bold uppercase tracking-wider">Phòng chờ khám</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Sẵn sàng tham gia?</h1>
            <p className="text-slate-400 text-sm">
              Kiểm tra thiết bị trước khi vào phòng khám.
            </p>
          </div>

          {/* Thông tin buổi khám */}
          {appointmentInfo && (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Thông tin buổi khám
              </h3>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">
                      {appointmentInfo.role === "doctor" ? "Bệnh nhân" : "Bác sĩ"}
                    </p>
                    <p className="text-sm font-semibold text-white">{otherParty}</p>
                  </div>
                </div>

                {appointmentInfo.specialty && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Chuyên khoa</p>
                      <p className="text-sm font-semibold text-white">{appointmentInfo.specialty}</p>
                    </div>
                  </div>
                )}

                {appointmentInfo.time && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Thời gian hẹn</p>
                      <p className="text-sm font-semibold text-white">{appointmentInfo.time}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="bg-slate-900/50 rounded-2xl border border-slate-800/50 p-4 space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lưu ý</p>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-teal-500 shrink-0" />
                Đảm bảo kết nối Internet ổn định
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-teal-500 shrink-0" />
                Ở nơi đủ ánh sáng và yên tĩnh
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-teal-500 shrink-0" />
                Kiểm tra camera và mic đã hoạt động
              </li>
            </ul>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <button
              onClick={onReady}
              disabled={checking}
              className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-800 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all text-sm shadow-lg shadow-teal-500/20"
            >
              <Video className="w-5 h-5" />
              Vào phòng khám
            </button>

            <button
              onClick={onCancel}
              className="w-full text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 font-medium py-3 rounded-2xl transition-colors text-sm"
            >
              Huỷ bỏ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
