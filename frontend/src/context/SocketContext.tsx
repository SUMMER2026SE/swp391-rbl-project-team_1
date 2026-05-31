"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

interface IncomingCallData {
  appointmentId: string;
  doctorId: string;
  doctorName: string;
  roomId: string;
}

interface SocketContextType {
  socket: Socket | null;
  incomingCall: IncomingCallData | null;
  setIncomingCall: (call: IncomingCallData | null) => void;
  acceptCall: () => void;
  rejectCall: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const auth = useContext(AuthContext);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);

  useEffect(() => {
    if (!auth || !auth.user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace("/api", "");
    console.log(`🔌 Initializing Socket connection to: ${socketUrl} for user ${auth.user.id}`);

    const newSocket = io(socketUrl, {
      query: { userId: auth.user.id },
      transports: ["polling", "websocket"], // Cho phép tự động chuyển đổi từ HTTP Polling lên WebSocket
      reconnectionAttempts: 5,
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("🔌 Connected to Socket.io signaling server");
    });

    newSocket.on("patient:incoming-call", (data: IncomingCallData) => {
      console.log("📞 Received incoming call:", data);
      setIncomingCall(data);
    });

    newSocket.on("connect_error", (error) => {
      console.warn("🔌 Socket connection error:", error);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [auth?.user?.id]);

  const acceptCall = () => {
    if (socket && incomingCall && auth?.user) {
      socket.emit("patient:accept-call", {
        appointmentId: incomingCall.appointmentId,
        doctorId: incomingCall.doctorId,
        patientId: auth.user.id,
        roomId: incomingCall.roomId,
      });
      // Redirect will be handled by the component using router
    }
  };

  const rejectCall = () => {
    if (socket && incomingCall && auth?.user) {
      socket.emit("patient:reject-call", {
        appointmentId: incomingCall.appointmentId,
        doctorId: incomingCall.doctorId,
        patientId: auth.user.id,
      });
      setIncomingCall(null);
      toast.success("Đã từ chối cuộc gọi");
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        incomingCall,
        setIncomingCall,
        acceptCall,
        rejectCall,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}
