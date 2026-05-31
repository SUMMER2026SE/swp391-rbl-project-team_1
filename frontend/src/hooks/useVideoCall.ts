"use client";

import { useEffect, useRef, useState } from "react";
import { useSocket } from "../context/SocketContext";
import useAuth from "./useAuth";
import toast from "react-hot-toast";

interface UseVideoCallProps {
  appointmentId: string;
  partnerId: string; // Doctor ID if patient, Patient ID if doctor
  isInitiator: boolean; // true if Doctor, false if Patient
  roomId: string;
  localStream: MediaStream | null;
  onCallEnded?: () => void;
}

export function useVideoCall({
  appointmentId,
  partnerId,
  isInitiator,
  roomId,
  localStream,
  onCallEnded,
}: UseVideoCallProps) {
  const { socket } = useSocket();
  const { user } = useAuth();
  
  const [callStatus, setCallStatus] = useState<"IDLE" | "CALLING" | "IN_CALL" | "REJECTED" | "ENDED">("IDLE");
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  
  const peerRef = useRef<any>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  
  // Track localStream in ref to avoid re-runs
  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      destroyPeer();
    };
  }, []);

  const destroyPeer = () => {
    if (peerRef.current) {
      console.log("🔌 Destroying simple-peer instance");
      peerRef.current.destroy();
      peerRef.current = null;
    }
    setRemoteStream(null);
  };

  const endCall = () => {
    if (socket && user) {
      socket.emit("call:ended", {
        appointmentId,
        partnerId,
      });
    }
    setCallStatus("ENDED");
    destroyPeer();
    if (onCallEnded) onCallEnded();
  };

  // WebRTC Connection logic
  useEffect(() => {
    if (!socket || !user || !appointmentId || !partnerId) return;

    console.log(`🔌 useVideoCall: socket connected. isInitiator: ${isInitiator}, partnerId: ${partnerId}`);

    // If initiator (Doctor), initiate the call first
    if (isInitiator && callStatus === "IDLE") {
      setCallStatus("CALLING");
      console.log(`📞 Doctor initiating call to patient ${partnerId}`);
      socket.emit("doctor:call-patient", {
        appointmentId,
        doctorId: user.id, // Doctor's user ID
        patientId: partnerId,
        roomId,
      });
    }

    // Initialize receiver (Patient) Peer setup when they enter the room
    if (!isInitiator && callStatus === "IDLE" && localStream) {
      setCallStatus("IN_CALL");
      console.log(`🔌 Patient initializing receiver peer connection...`);
      initializePeer(false);
    }

    // Handlers
    const handleCallAccepted = (data: any) => {
      console.log("📞 Patient accepted the call. Initializing WebRTC Peer...");
      setCallStatus("IN_CALL");
      if (localStreamRef.current) {
        initializePeer(true);
      } else {
        console.warn("⚠️ Local stream not ready yet on doctor side. Waiting...");
        // Fallback: wait a bit or let localStream listener trigger it
        setTimeout(() => {
          if (localStreamRef.current) {
            initializePeer(true);
          } else {
            toast.error("Không thể kết nối: Vui lòng cấp quyền Camera/Mic!");
          }
        }, 1500);
      }
    };

    const handleCallRejected = (data: any) => {
      console.log("❌ Patient rejected the call");
      setCallStatus("REJECTED");
      toast.error(data.message || "Bệnh nhân từ chối cuộc gọi.");
      destroyPeer();
      if (onCallEnded) onCallEnded();
    };

    const handleSignal = async (data: any) => {
      // data: { fromUserId, signal }
      if (data.fromUserId === partnerId && peerRef.current) {
        console.log("📥 Received WebRTC signaling data");
        try {
          peerRef.current.signal(data.signal);
        } catch (err) {
          console.error("Failed to apply peer signal:", err);
        }
      }
    };

    const handleCallEnded = () => {
      console.log("🔌 Partner ended the call");
      setCallStatus("ENDED");
      toast("Cuộc gọi đã kết thúc", { icon: "🔌" });
      destroyPeer();
      if (onCallEnded) onCallEnded();
    };

    const handleCallFailed = (data: any) => {
      toast.error(data.message || "Không thể thực hiện cuộc gọi.");
      setCallStatus("ENDED");
      if (onCallEnded) onCallEnded();
    };

    socket.on("patient:call-accepted", handleCallAccepted);
    socket.on("patient:call-rejected", handleCallRejected);
    socket.on("webrtc:signal", handleSignal);
    socket.on("call:ended", handleCallEnded);
    socket.on("doctor:call-failed", handleCallFailed);

    return () => {
      socket.off("patient:call-accepted", handleCallAccepted);
      socket.off("patient:call-rejected", handleCallRejected);
      socket.off("webrtc:signal", handleSignal);
      socket.off("call:ended", handleCallEnded);
      socket.off("doctor:call-failed", handleCallFailed);
    };
  }, [socket, user, appointmentId, partnerId, isInitiator, localStream, callStatus]);

  // Peer initialization helper
  const initializePeer = async (initiator: boolean) => {
    if (peerRef.current) return;

    try {
      console.log(`🚀 Creating Peer: initiator=${initiator}`);
      
      // Dynamic import to bypass SSR in Next.js
      const SimplePeer = (await import("simple-peer")).default;
      
      const streamToUse = localStreamRef.current || undefined;

      const peer = new SimplePeer({
        initiator,
        trickle: false,
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" }
          ]
        },
        stream: streamToUse,
      });

      peer.on("signal", (signalData: any) => {
        console.log("📤 Generated signaling data, sending to partner...");
        if (socket) {
          socket.emit("webrtc:signal", {
            toUserId: partnerId,
            signal: signalData,
          });
        }
      });

      peer.on("stream", (remoteStreamData: MediaStream) => {
        console.log("📹 Remote video stream received!");
        setRemoteStream(remoteStreamData);
      });

      peer.on("close", () => {
        console.log("🔌 Peer connection closed");
        setCallStatus("ENDED");
        setRemoteStream(null);
      });

      peer.on("error", (err: any) => {
        console.error("❌ Peer connection error:", err);
      });

      peerRef.current = peer;
    } catch (err) {
      console.error("Failed to initialize Peer client-side:", err);
    }
  };

  return {
    callStatus,
    remoteStream,
    endCall,
  };
}
