"use client";

import { useEffect, useRef, useState } from "react";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { Camera, Mic, AlertTriangle, RefreshCw } from "lucide-react";

interface VideoCallRoomProps {
  roomID: string;
  userID: string;
  userName: string;
  onCallEnd?: (durationSeconds: number) => void;
  mode?: "appointment" | "consult";
}

type PermissionState = "checking" | "granted" | "denied" | "error";

function ChromePermissionGuide({ onIgnore }: { onIgnore: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900 rounded-3xl border border-amber-500/30 p-8 space-y-6">
        <div className="flex items-center gap-3 text-amber-400">
          <AlertTriangle className="w-8 h-8 shrink-0" />
          <h2 className="text-xl font-bold">Cần quyền Camera &amp; Microphone</h2>
        </div>

        <p className="text-slate-300 text-sm leading-relaxed">
          Trình duyệt đang chặn quyền truy cập camera và microphone.
          Làm theo các bước sau để cấp quyền:
        </p>

        <ol className="space-y-3 text-sm text-slate-300">
          <li className="flex gap-3">
            <span className="bg-teal-500 text-white w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold text-xs">1</span>
            <span>Nhìn lên thanh địa chỉ, click vào biểu tượng <strong className="text-white">🔒 khóa</strong> hoặc biểu tượng <strong className="text-white">camera bị gạch</strong></span>
          </li>
          <li className="flex gap-3">
            <span className="bg-teal-500 text-white w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold text-xs">2</span>
            <span>Chọn <strong className="text-white">&quot;Cài đặt trang web&quot;</strong> (Site settings)</span>
          </li>
          <li className="flex gap-3">
            <span className="bg-teal-500 text-white w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold text-xs">3</span>
            <span>Tìm mục <strong className="text-white">Camera</strong> và <strong className="text-white">Microphone</strong> → đổi thành <strong className="text-white">&quot;Cho phép&quot;</strong></span>
          </li>
          <li className="flex gap-3">
            <span className="bg-teal-500 text-white w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold text-xs">4</span>
            <span>Tải lại trang này</span>
          </li>
        </ol>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => window.location.reload()}
            className="flex-1 flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Tải lại trang
          </button>
          <button
            onClick={onIgnore}
            className="flex-1 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 font-medium py-3 rounded-xl transition-colors text-sm"
          >
            Vào không có camera
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VideoCallRoom({
  roomID,
  userID,
  userName,
  onCallEnd,
  mode = "appointment",
}: VideoCallRoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const zpRef = useRef<any>(null);
  const [initState, setInitState] = useState<"loading" | "ready" | "error">("loading");
  const [permState, setPermState] = useState<PermissionState>("checking");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const joinTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!roomID || !userID || !userName) return;

    const appID = Number(process.env.NEXT_PUBLIC_ZEGO_APP_ID);
    const serverSecret = process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET || "";

    if (!appID || !serverSecret) {
      setInitState("error");
      setErrorMsg("Thiếu cấu hình ZegoCloud. Vui lòng kiểm tra biến môi trường.");
      return;
    }

    // Kiểm tra quyền truy cập camera/mic trước
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        // Dừng stream ngay sau khi kiểm tra — Zego sẽ tự tạo stream riêng
        stream.getTracks().forEach((t) => t.stop());
        setPermState("granted");
        initZego(appID, serverSecret);
      })
      .catch((err) => {
        console.warn("Camera/Mic permission denied:", err);
        setPermState("denied");
        // Vẫn khởi tạo Zego dù không có camera/mic
        initZego(appID, serverSecret);
      });

    async function initZego(appID: number, serverSecret: string) {
      try {
        const { ZegoUIKitPrebuilt } = await import("@zegocloud/zego-uikit-prebuilt");

        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          appID,
          serverSecret,
          String(roomID),
          String(userID),
          userName
        );

        const zp = ZegoUIKitPrebuilt.create(kitToken);
        zpRef.current = zp;

        zp.joinRoom({
          container: containerRef.current,
          scenario: {
            mode: ZegoUIKitPrebuilt.OneONoneCall,
          },
          // Bật tính năng chia sẻ màn hình
          showScreenSharingButton: true,
          // Bật chat trong call
          showTextChat: true,
          // Ẩn logo ZegoCloud (branding)
          branding: {
            logoURL: "",
          },
          // Layout: camera bệnh nhân nhỏ góc phải, camera lớn ở giữa
          layout: "Sidebar",
          showLayoutButton: false,
          // Ngôn ngữ — Zego chưa hỗ trợ tiếng Việt nên dùng English
          // Language: ZegoUIKitPrebuilt.EN,
          onJoinRoom: () => {
            joinTimeRef.current = Date.now();
            setInitState("ready");
          },
          onLeaveRoom: () => {
            if (onCallEnd) {
              const duration = joinTimeRef.current ? Math.floor((Date.now() - joinTimeRef.current) / 1000) : 0;
              onCallEnd(duration);
            }
          },
          onUserLeave: () => {
            // Đối phương rời phòng
          },
        });

        setInitState("ready");
      } catch (err: any) {
        console.error("ZegoCloud init error:", err);
        setInitState("error");
        setErrorMsg("Không thể khởi tạo phòng khám. Vui lòng thử lại.");
      }
    }

    return () => {
      try {
        if (zpRef.current) {
          zpRef.current.destroy?.();
          zpRef.current = null;
        }
      } catch (e) {
        // ignore cleanup errors
      }
    };
  }, [roomID, userID, userName, onCallEnd]);

  if (initState === "error") {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950">
        <div className="max-w-md w-full text-center space-y-4 p-8">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Lỗi khởi tạo phòng khám</h2>
          <p className="text-slate-400 text-sm">{errorMsg}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-slate-950">
      {/* Camera/Mic bị chặn — hiện hướng dẫn */}
      {permState === "denied" && <ChromePermissionGuide onIgnore={() => setPermState("granted")} />}

      {/* Loading overlay */}
      {initState === "loading" && permState !== "denied" && (
        <div className="absolute inset-0 z-40 bg-slate-950 flex flex-col items-center justify-center gap-4">
          <LoadingSpinner className="w-12 h-12 text-teal-500" />
          <div className="text-center space-y-2">
            <p className="text-white font-semibold">Đang khởi tạo phòng khám...</p>
            <p className="text-slate-400 text-sm">
              {mode === "appointment" ? "Đang kết nối phiên khám trực tuyến" : "Đang kết nối phiên tư vấn"}
            </p>
            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Camera className="w-3 h-3" /> Camera
              </span>
              <span className="flex items-center gap-1">
                <Mic className="w-3 h-3" /> Microphone
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Container Zego UI */}
      <div
        ref={containerRef}
        className="w-full h-full"
      />
    </div>
  );
}
