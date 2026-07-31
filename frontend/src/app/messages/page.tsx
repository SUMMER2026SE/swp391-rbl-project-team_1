"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import api from "@/services/api";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";
import {
  Send,
  User,
  MessageCircle,
  Clock,
  Video,
  Search,
  ArrowLeft,
  X,
  CheckCheck,
  ImageIcon,
  Info,
  Phone,
} from "lucide-react";
import { io, Socket } from "socket.io-client";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";

interface Conversation {
  id: string;
  doctor?: { id: string; name: string; avatar: string; specialty: { name: string } };
  user?: { id: string; fullName: string; avatar: string };
  messages: Message[];
  updatedAt: string;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  isRead: boolean;
}

function AvatarFallback({ name, size = 40, className = "" }: { name?: string; size?: number; className?: string }) {
  const initials = name
    ? name.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase()
    : "?";
  return (
    <div
      className={`rounded-full bg-gradient-to-br from-teal-400 to-teal-700 flex items-center justify-center text-white font-bold shrink-0 ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials}
    </div>
  );
}

function Avatar({ src, name, size = 40, className = "" }: { src?: string; name?: string; size?: number; className?: string }) {
  const [error, setError] = useState(false);
  if (!src || error) return <AvatarFallback name={name} size={size} className={className} />;
  const resolvedSrc = src.startsWith("http") ? src : `${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "")}${src}`;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolvedSrc}
      alt={name || "Avatar"}
      width={size}
      height={size}
      className={`rounded-full object-cover shrink-0 ${className}`}
      style={{ width: size, height: size }}
      onError={() => setError(true)}
    />
  );
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Hôm qua";
  if (diffDays < 7) return date.toLocaleDateString("vi-VN", { weekday: "short" });
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

// Video Call Incoming Modal
function IncomingCallModal({
  data,
  onAccept,
  onDecline,
}: {
  data: any;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const isFromDoctor = data.callerRole === "DOCTOR" || data.isDoctor !== false;
  const callerName = data.callerName || data.doctorName;
  const title = isFromDoctor ? `Bs. ${callerName}` : callerName;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative bg-[#1a2535] rounded-3xl p-8 flex flex-col items-center gap-5 shadow-2xl w-80 text-center animate-in zoom-in-95 duration-200">
        {/* Animated ring */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-teal-500/20 animate-ping" style={{ margin: -8 }} />
          <div className="absolute inset-0 rounded-full bg-teal-500/10 animate-ping" style={{ margin: -16, animationDelay: "0.3s" }} />
          <AvatarFallback name={callerName} size={80} />
        </div>
        <div>
          <p className="text-teal-400 text-xs font-semibold uppercase tracking-wider mb-1">Cuộc gọi video đến</p>
          <h3 className="text-white text-xl font-bold">{title}</h3>
          <p className="text-slate-400 text-sm mt-1">Đang mời bạn vào phòng tư vấn</p>
        </div>
        <div className="flex gap-4 w-full mt-2">
          <button
            onClick={onDecline}
            className="flex-1 flex flex-col items-center gap-2 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white transition-colors"
          >
            <Phone className="w-5 h-5 rotate-[135deg]" />
            <span className="text-xs font-semibold">Từ chối</span>
          </button>
          <button
            onClick={onAccept}
            className="flex-1 flex flex-col items-center gap-2 py-3 rounded-2xl bg-teal-500 hover:bg-teal-600 text-white transition-colors"
          >
            <Video className="w-5 h-5" />
            <span className="text-xs font-semibold">Chấp nhận</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Video Call Outgoing Modal
function OutgoingCallModal({
  conversation,
  onCancel,
  isDoctor
}: {
  conversation: any;
  onCancel: () => void;
  isDoctor: boolean;
}) {
  const target = isDoctor ? conversation.user : conversation.doctor;
  const targetName = isDoctor ? target?.fullName : target?.name;
  const title = isDoctor ? (targetName || "Bệnh nhân") : `Bs. ${targetName || ""}`;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative bg-[#1a2535] rounded-3xl p-8 flex flex-col items-center gap-5 shadow-2xl w-80 text-center animate-in zoom-in-95 duration-200">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-teal-500/20 animate-ping" style={{ margin: -8 }} />
          <div className="absolute inset-0 rounded-full bg-teal-500/10 animate-ping" style={{ margin: -16, animationDelay: "0.3s" }} />
          <Avatar src={target?.avatar} name={targetName} size={80} />
        </div>
        <div>
          <p className="text-teal-400 text-xs font-semibold uppercase tracking-wider mb-1">Đang gọi...</p>
          <h3 className="text-white text-xl font-bold">{title}</h3>
          <p className="text-slate-400 text-sm mt-1">Đang chờ {isDoctor ? "bệnh nhân" : "bác sĩ"} chấp nhận</p>
        </div>
        <div className="flex gap-1 mt-2 mb-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        <button
          onClick={onCancel}
          className="w-full py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-semibold flex items-center justify-center gap-2 transition-colors mt-2"
        >
          <X className="w-5 h-5" />
          Hủy
        </button>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDoctorId = searchParams.get("doctorId");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSidebar, setShowSidebar] = useState(true); // mobile toggle
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [outgoingCall, setOutgoingCall] = useState<Conversation | null>(null);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const currentCallIdRef = useRef<string | null>(null);
  const outgoingCallRef = useRef<any>(null);

  useEffect(() => {
    outgoingCallRef.current = outgoingCall;
  }, [outgoingCall]);

  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inviteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeConvIdRef = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isDoctor = user?.role === "DOCTOR";

  // Keep activeConvIdRef updated
  useEffect(() => {
    activeConvIdRef.current = activeConversation?.id || null;
  }, [activeConversation]);

  // Fetch conversations
  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }

    async function initChat() {
      try {
        if (initialDoctorId && user?.role === "USER") {
          await api.post("/messages/conversations", { doctorId: initialDoctorId });
        }
        const res = await api.get("/messages/conversations");
        const convs = (res.data.conversations || []).filter((c: any) => c && c.id);
        setConversations(convs);
        if (initialDoctorId && user?.role === "USER") {
          const target = convs.find((c: any) => c && c.doctor?.id === initialDoctorId);
          if (target) { setActiveConversation(target); setShowSidebar(false); }
        } else if (convs.length > 0) {
          setActiveConversation(convs[0]);
        }
      } catch (err: any) {
        setError("Lỗi tải cuộc hội thoại.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    initChat();
  }, [user, authLoading, initialDoctorId, router]);

  // Setup Socket
  useEffect(() => {
    if (!user) return;
    const backendUrl = process.env.NEXT_PUBLIC_API_URL
      ? process.env.NEXT_PUBLIC_API_URL.replace("/api", "")
      : "http://localhost:5000";

    const socket = io(backendUrl, { withCredentials: true, transports: ["websocket", "polling"] });
    socketRef.current = socket;

    // Join personal rooms
    socket.emit("join_user_room", { userId: user.id });
    if (user.role === "DOCTOR" && user.doctorId) {
      socket.emit("join_doctor_room", { doctorId: user.doctorId });
    }

    // Go online & get online users list
    socket.emit("user-online", { userId: user.id });
    socket.emit("get-online-users");

    socket.on("online-users-list", (userIds: string[]) => {
      setOnlineUserIds(new Set(userIds));
    });

    socket.on("user-status-changed", (data: { userId: string; status: string }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        if (data.status === "online") {
          next.add(data.userId);
        } else {
          next.delete(data.userId);
        }
        return next;
      });
    });

    socket.on("receive-direct-message", (data: { conversationId: string; message: Message }) => {
      const { conversationId, message: msg } = data;
      if (!msg) return;

      // Update messages list if active
      if (conversationId === activeConvIdRef.current) {
        setMessages((prev) => {
          const validPrev = (prev || []).filter((m) => m && m.id);
          if (validPrev.find((m) => m.id === msg.id)) {
            return validPrev.map((m) => m.id === msg.id ? msg : m);
          }
          return [...validPrev, msg];
        });

        // Auto mark as seen if message from other party
        if (msg.senderId !== user.id) {
          socketRef.current?.emit("mark-as-seen", { conversationId, userId: user.id });
        }
      }

      // Update conversation list
      setConversations((prev) => {
        const validPrev = (prev || []).filter((c) => c && c.id);
        return validPrev
          .map((c) => {
            if (c.id === conversationId) {
              const updatedMessages = [msg];
              const isCurrent = conversationId === activeConvIdRef.current;
              let currentUnread = (c as any).unreadCount || 0;

              if (isCurrent) {
                currentUnread = 0;
              } else if (msg.senderId !== user.id && !msg.isRead) {
                currentUnread += 1;
              }

              return {
                ...c,
                messages: updatedMessages,
                updatedAt: new Date().toISOString(),
                unreadCount: currentUnread
              };
            }
            return c;
          })
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      });
    });

    socket.on("messages-seen", (data: { conversationId: string }) => {
      if (data.conversationId === activeConvIdRef.current) {
        setMessages((prev) =>
          (prev || []).map((m) => (m.senderId === user.id ? { ...m, isRead: true, status: "SEEN" } : m))
        );
      }
      setConversations((prev) =>
        (prev || []).map((c) =>
          c.id === data.conversationId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.senderId === user.id ? { ...m, isRead: true, status: "SEEN" } : m
                ),
              }
            : c
        )
      );
    });

    // Receive incoming call
    socket.on("video_call_invite", (data: any) => {
      if (data.callerId === user?.id) {
        currentCallIdRef.current = data.callId;
        return;
      }
      currentCallIdRef.current = data.callId;
      setIncomingCall(data);
      if (inviteTimeoutRef.current) clearTimeout(inviteTimeoutRef.current);
      inviteTimeoutRef.current = setTimeout(() => {
        setIncomingCall((prev: any) => {
          if (prev && prev.callId === data.callId) {
            return null;
          }
          return prev;
        });
      }, 30000);
    });

    socket.on("video_call_accepted", (data: { conversationId: string; callId: string }) => {
      if (inviteTimeoutRef.current) { clearTimeout(inviteTimeoutRef.current); inviteTimeoutRef.current = null; }
      setOutgoingCall(null);
      toast.success("Đã kết nối cuộc gọi video!");
      router.push(`/consult/video/${data.conversationId}?callId=${data.callId}`);
    });

    socket.on("video_call_declined", (data: { conversationId: string; callId: string }) => {
      if (inviteTimeoutRef.current) { clearTimeout(inviteTimeoutRef.current); inviteTimeoutRef.current = null; }
      setOutgoingCall(null);
      setIncomingCall((prev: any) => (prev && prev.callId === data.callId ? null : prev));
      const isDoc = user?.role === "DOCTOR";
      toast.error(isDoc ? "Cuộc gọi bị từ chối." : "Bác sĩ đã từ chối cuộc gọi.");
    });

    socket.on("video_call_missed", (data: { conversationId: string; callId: string }) => {
      if (inviteTimeoutRef.current) { clearTimeout(inviteTimeoutRef.current); inviteTimeoutRef.current = null; }
      setOutgoingCall(null);
      setIncomingCall((prev: any) => (prev && prev.callId === data.callId ? null : prev));
      toast.error("Cuộc gọi nhỡ.");
    });

    return () => {
      socket.disconnect();
      if (inviteTimeoutRef.current) clearTimeout(inviteTimeoutRef.current);
    };
  }, [user, router]);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (!activeConversation || !socketRef.current) return;
    const fetchMessages = async () => {
      try {
        const res = await api.get(`/messages/${activeConversation.id}`);
        setMessages((res.data.messages || []).filter((m: any) => m && m.id));
        socketRef.current?.emit("join-chat", { conversationId: activeConversation.id, userId: user?.id });
        setConversations((prev) =>
          (prev || []).map((c) => (c.id === activeConversation.id ? { ...c, unreadCount: 0 } : c))
        );
      } catch (err) {
        console.error("Lỗi tải tin nhắn", err);
      }
    };
    fetchMessages();
  }, [activeConversation, user]);

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeConversation) return;
    const content = chatInput.trim();
    setChatInput("");
    inputRef.current?.focus();

    const tempId = `temp-${Date.now()}`;
    const tempMsg = {
      id: tempId,
      content,
      senderId: user?.id || "",
      createdAt: new Date().toISOString(),
      isRead: false,
      status: "SENDING"
    };

    setMessages((prev) => [...(prev || []).filter((m) => m && m.id), tempMsg]);

    try {
      const res = await api.post(`/messages/${activeConversation.id}`, { content });
      const newMsg = res.data.message;
      if (newMsg) {
        setMessages((prev) =>
          (prev || []).map((m) => (m.id === tempId ? { ...newMsg, status: "SENT" } : m))
        );
        socketRef.current?.emit("send-direct-message", { conversationId: activeConversation.id, message: newMsg });
        setConversations((prev) =>
          (prev || [])
            .filter((c) => c && c.id)
            .map((c) => c.id === activeConversation.id ? { ...c, messages: [newMsg], updatedAt: new Date().toISOString() } : c)
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        );
      }
    } catch (err) {
      console.error("Lỗi gửi tin nhắn", err);
      setMessages((prev) =>
        (prev || []).map((m) => (m.id === tempId ? { ...m, status: "ERROR" } : m))
      );
    }
  };

  const handleSelectConversation = (conv: Conversation) => {
    setActiveConversation(conv);
    setShowSidebar(false);
    setConversations((prev) =>
      (prev || []).map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c))
    );
    socketRef.current?.emit("mark-as-seen", { conversationId: conv.id, userId: user?.id });
  };

  const handleVideoCall = () => {
    if (!activeConversation) return;
    const callId = Date.now().toString();
    currentCallIdRef.current = callId;
    setOutgoingCall(activeConversation);
    socketRef.current?.emit("video_call_invite", {
      conversationId: activeConversation.id,
      callId,
      doctorId: user?.role === "DOCTOR" ? user?.doctorId : activeConversation.doctor?.id,
      doctorName: user?.role === "DOCTOR" ? user?.fullName : activeConversation.doctor?.name,
      callerId: user?.id,
      callerName: user?.fullName,
      callerRole: user?.role,
      isDoctor: user?.role === "DOCTOR",
    });
    if (inviteTimeoutRef.current) clearTimeout(inviteTimeoutRef.current);
    inviteTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit("video_call_missed", {
        conversationId: activeConversation.id,
        callId,
      });
      setOutgoingCall(null);
      const isDoc = user?.role === "DOCTOR";
      toast.error(isDoc ? "Bệnh nhân không phản hồi." : "Bác sĩ không phản hồi.");
    }, 30000);
  };

  const filteredConversations = useMemo(() => {
    const validConvs = conversations.filter((c) => c && c.id);
    if (!searchQuery.trim()) return validConvs;
    const q = searchQuery.toLowerCase();
    return validConvs.filter((c) => {
      const target = isDoctor ? c.user : c.doctor;
      const name = isDoctor ? (target as any)?.fullName : (target as any)?.name;
      return name?.toLowerCase()?.includes(q) ?? false;
    });
  }, [conversations, isDoctor, searchQuery]);

  if (authLoading || loading)
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-[#0f1923]">
        <LoadingSpinner className="text-teal-500 w-8 h-8" />
      </div>
    );
  if (error)
    return (
      <div className="p-6 h-[calc(100vh-64px)] flex items-center justify-center">
        <Alert type="error" message={error} />
      </div>
    );

  const activeTarget = activeConversation
    ? isDoctor ? activeConversation.user : activeConversation.doctor
    : null;
  const activeName = activeTarget
    ? isDoctor ? (activeTarget as any).fullName : (activeTarget as any).name
    : null;

  return (
    <>
      {/* Incoming call modal (patient) */}
      {incomingCall && (
        <IncomingCallModal
          data={incomingCall}
          onAccept={() => {
            socketRef.current?.emit("video_call_accepted", {
              conversationId: incomingCall.conversationId,
              doctorId: incomingCall.doctorId,
              callId: incomingCall.callId,
            });
            setIncomingCall(null);
            router.push(`/consult/video/${incomingCall.conversationId}?callId=${incomingCall.callId}`);
          }}
          onDecline={() => {
            socketRef.current?.emit("video_call_declined", {
              conversationId: incomingCall.conversationId,
              doctorId: incomingCall.doctorId,
              callId: incomingCall.callId,
            });
            setIncomingCall(null);
          }}
        />
      )}

      {/* Outgoing call modal */}
      {outgoingCall && (
        <OutgoingCallModal
          conversation={outgoingCall}
          isDoctor={isDoctor}
          onCancel={() => {
            socketRef.current?.emit("video_call_declined", {
              conversationId: outgoingCall.id,
              callId: currentCallIdRef.current,
            });
            setOutgoingCall(null);
            if (inviteTimeoutRef.current) clearTimeout(inviteTimeoutRef.current);
            toast("Đã hủy cuộc gọi.");
          }}
        />
      )}

      <div className="h-[calc(100vh-64px)] bg-white flex overflow-hidden font-sans">
        {/* ═══════════════ LEFT SIDEBAR ═══════════════ */}
        <div
          className={`
            flex flex-col shrink-0 bg-[#f5f7fa] border-r border-gray-200
            transition-all duration-300
            ${showSidebar ? "w-full md:w-[320px]" : "hidden md:flex md:w-[320px]"}
          `}
        >
          {/* Sidebar Header */}
          <div className="p-5 bg-[#f5f7fa]">
            <h2 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
              {isDoctor ? "Tin nhắn Bệnh nhân" : "Tư vấn Bác Sĩ"}
            </h2>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={isDoctor ? "Tìm bệnh nhân..." : "Tìm bác sĩ..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-full pl-9 pr-4 py-2 text-sm text-black placeholder-gray-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Conversations list */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-gray-400 flex flex-col items-center gap-3">
                <MessageCircle className="w-10 h-10 text-gray-300" />
                <p className="text-sm">
                  {searchQuery ? "Không tìm thấy kết quả" : "Chưa có cuộc hội thoại nào"}
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                if (!conv || !conv.id) return null;
                const target = isDoctor ? conv.user : conv.doctor;
                const targetName = isDoctor ? (target as any)?.fullName : (target as any)?.name;
                const specialty = !isDoctor ? (conv.doctor as any)?.specialty?.name : null;
                const lastMsg = conv.messages?.[0];
                const isActive = activeConversation?.id === conv.id;
                const unreadCount = typeof (conv as any).unreadCount === "number"
                  ? (conv as any).unreadCount
                  : (conv.messages?.filter((m) => m && !m.isRead && m.senderId !== user?.id).length || 0);

                return (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`
                      flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors
                      border-l-[3px]
                      ${isActive
                        ? "bg-white border-l-teal-500 shadow-sm"
                        : "bg-[#f5f7fa] border-l-transparent hover:bg-white"
                      }
                    `}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <Avatar src={(target as any)?.avatar} name={targetName} size={48} />
                      {(() => {
                        const targetUserId = isDoctor ? conv.user?.id : (conv.doctor as any)?.userAccount?.id;
                        const isOnline = targetUserId ? onlineUserIds.has(targetUserId) : false;
                        return (
                          <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isOnline ? "bg-green-500" : "bg-gray-400"}`} />
                        );
                      })()}
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <h3 className="font-bold text-sm text-black truncate">
                          {targetName || "Người dùng"}
                        </h3>
                        {lastMsg && (
                          <span className="text-[11px] text-gray-400 shrink-0 font-medium">
                            {formatTime(lastMsg.createdAt)}
                          </span>
                        )}
                      </div>
                      {specialty && (
                        <p className="text-[11px] text-teal-600 font-medium mb-0.5">{specialty}</p>
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-xs truncate ${unreadCount > 0 ? "text-black font-semibold" : "text-gray-500"}`}>
                          {lastMsg
                            ? `${lastMsg.senderId === user?.id ? "Bạn: " : ""}${lastMsg.content}`
                            : "Chưa có tin nhắn"}
                        </p>
                        {unreadCount > 0 && (
                          <span className="shrink-0 min-w-[18px] h-[18px] bg-red-500 rounded-full text-[10px] text-white font-bold flex items-center justify-center px-1">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ═══════════════ RIGHT CHAT PANEL ═══════════════ */}
        <div className={`flex-1 flex flex-col min-w-0 bg-white ${showSidebar ? "hidden md:flex" : "flex"}`}>
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="h-[65px] px-4 md:px-6 border-b border-gray-200 bg-white flex items-center gap-3 shrink-0">
                {/* Mobile back button */}
                <button
                  onClick={() => setShowSidebar(true)}
                  className="md:hidden p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                {/* Avatar */}
                {(() => {
                  const activeTargetUserId = isDoctor ? activeConversation.user?.id : (activeConversation.doctor as any)?.userAccount?.id;
                  const isActiveOnline = activeTargetUserId ? onlineUserIds.has(activeTargetUserId) : false;
                  return (
                    <>
                      <div className="relative">
                        <Avatar src={(activeTarget as any)?.avatar} name={activeName} size={42} />
                        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isActiveOnline ? "bg-green-500" : "bg-gray-400"}`} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-black text-sm truncate">
                          {activeName || "Người dùng"}
                        </h3>
                        {isDoctor ? (
                          <p className={`text-[12px] font-medium flex items-center gap-1 ${isActiveOnline ? "text-green-500" : "text-gray-400"}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isActiveOnline ? "bg-green-500" : "bg-gray-400"}`} /> {isActiveOnline ? "Trực tuyến" : "Ngoại tuyến"}
                          </p>
                        ) : (
                          <div className="flex items-center gap-2">
                            <p className={`text-[12px] font-medium flex items-center gap-1 ${isActiveOnline ? "text-green-500" : "text-gray-400"}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isActiveOnline ? "bg-green-500" : "bg-gray-400"}`} /> {isActiveOnline ? "Trực tuyến" : "Ngoại tuyến"}
                            </p>
                            <span className="text-[12px] text-gray-300">|</span>
                            <p className="text-[12px] text-teal-600 font-medium">
                              {(activeConversation.doctor as any)?.specialty?.name}
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}

                {/* Action buttons */}
                <div className="flex items-center gap-3">
                  {(isDoctor || (!isDoctor && (activeConversation.doctor as any)?.can_video_call !== false)) && (
                    <button
                      onClick={handleVideoCall}
                      disabled={!!outgoingCall}
                      className={`flex items-center gap-1.5 text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors shadow-sm ${
                        outgoingCall ? "bg-orange-500 cursor-not-allowed" : "bg-[#0d9488] hover:bg-teal-700"
                      }`}
                    >
                      <Video className="w-4 h-4" />
                      <span className="hidden sm:inline">{outgoingCall ? "Đang gọi..." : "Gọi video"}</span>
                    </button>
                  )}
                  <button className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                    <Info className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2 bg-white">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-3">
                    <MessageCircle className="w-16 h-16 text-gray-200 stroke-1" />
                    <div className="text-center">
                      <p className="text-gray-400 font-medium">Hãy gửi lời chào đầu tiên!</p>
                      <p className="text-xs text-gray-300 mt-1">Bắt đầu cuộc trò chuyện với {activeName}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, idx) => {
                      if (!msg || !msg.id) return null;
                      const isMe = msg.senderId === user?.id;
                      const isDoctorMsg = (isDoctor && isMe) || (!isDoctor && !isMe);
                      const prevMsg = messages[idx - 1];
                      const showAvatar = !isMe && (idx === 0 || (prevMsg && prevMsg.senderId !== msg.senderId));
                      const showTime = idx === messages.length - 1 || (messages[idx + 1] && messages[idx + 1].senderId !== msg.senderId);

                      return (
                        <div key={msg.id} className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"} ${idx > 0 && messages[idx - 1] && messages[idx - 1].senderId === msg.senderId ? "mt-0.5" : "mt-3"}`}>
                          {/* Avatar: Only show for patient's message. Wait, prompt says: bubble bệnh nhân có ảnh 32px, bubble bác sĩ không ảnh. */}
                          {!isDoctorMsg && (
                            <div className="w-8 h-8 shrink-0">
                              {showAvatar ? (
                                <Avatar
                                  src={(activeTarget as any)?.avatar}
                                  name={activeName}
                                  size={32}
                                />
                              ) : (
                                <div className="w-8 h-8" />
                              )}
                            </div>
                          )}

                          <div className={`flex flex-col gap-1 max-w-[70%] md:max-w-[60%] ${isMe ? "items-end" : "items-start"}`}>
                            <div
                              className={`
                                px-4 py-2 text-[15px] leading-relaxed break-words
                                ${isDoctorMsg
                                  ? "bg-[#0d9488] text-white rounded-2xl rounded-tr-sm"
                                  : "bg-[#f0f2f5] text-black rounded-2xl rounded-tl-sm"
                                }
                              `}
                            >
                              {msg.content}
                            </div>

                            {showTime && (
                              <div className={`flex items-center gap-1 text-[11px] text-gray-400 px-1 ${isMe ? "flex-row-reverse" : ""}`}>
                                <span>
                                  {new Date(msg.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                                </span>
                                {isMe && (
                                  <span className="text-[10px] font-medium text-gray-400 ml-1 mr-1">
                                    {(msg as any).status === "SEEN" || msg.isRead
                                      ? "Đã xem"
                                      : (msg as any).status === "DELIVERED"
                                      ? "Đã nhận"
                                      : (msg as any).status === "SENDING"
                                      ? "Đang gửi"
                                      : "Đã gửi"}
                                  </span>
                                )}
                                {isMe && (
                                  <CheckCheck className={`w-3.5 h-3.5 ml-0.5 ${((msg as any).status === "SEEN" || msg.isRead) ? "text-teal-500" : (msg as any).status === "DELIVERED" ? "text-blue-500" : "text-gray-300"}`} />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input Bar */}
              <div className="px-4 md:px-6 py-4 bg-white border-t border-gray-200 shrink-0">
                <form onSubmit={handleSendMessage}>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                      title="Gửi ảnh"
                    >
                      <ImageIcon className="w-6 h-6" />
                    </button>
                    <div className="flex-1 bg-[#f5f7fa] rounded-full px-4 py-2.5 flex items-center">
                      <input
                        ref={inputRef}
                        type="text"
                        placeholder="Nhập tin nhắn..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        className="flex-1 bg-transparent border-none outline-none text-[15px] text-black placeholder-gray-400"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!chatInput.trim()}
                      className={`p-2.5 rounded-full flex items-center justify-center transition-all shrink-0 ${
                        chatInput.trim() ? "text-[#0d9488] hover:bg-teal-50" : "text-gray-300 cursor-not-allowed"
                      }`}
                    >
                      <Send className="w-6 h-6" />
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-white space-y-4">
              <MessageCircle className="w-16 h-16 text-gray-200 stroke-1" />
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-700 mb-1">
                  {isDoctor ? "Chọn bệnh nhân để tư vấn" : "Chọn một bác sĩ để bắt đầu tư vấn"}
                </h3>
                <p className="text-sm text-gray-400 max-w-xs">
                  {isDoctor
                    ? "Chọn bệnh nhân từ danh sách bên trái để xem và trả lời tin nhắn"
                    : "Chọn bác sĩ từ danh sách bên trái để đặt câu hỏi về sức khỏe của bạn"
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
