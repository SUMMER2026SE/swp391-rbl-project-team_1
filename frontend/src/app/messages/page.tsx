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
  const [incomingCall, setIncomingCall] = useState<{ conversationId: string; doctorId: string; doctorName: string } | null>(null);
  const [outgoingCall, setOutgoingCall] = useState<Conversation | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inviteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeConvIdRef = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
        const convs = res.data.conversations;
        setConversations(convs);
        if (initialDoctorId && user?.role === "USER") {
          const target = convs.find((c: any) => c.doctor?.id === initialDoctorId);
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

    socket.on("receive-direct-message", (data: { conversationId: string; message: Message }) => {
      const { conversationId, message: msg } = data;
      setMessages((prev) => {
        if (conversationId !== activeConvIdRef.current) return prev;
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      setConversations((prev) =>
        prev
          .map((c) => c.id === conversationId ? { ...c, messages: [msg], updatedAt: new Date().toISOString() } : c)
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      );
    });

    // Receive incoming call
    socket.on("video_call_invite", (data: any) => {
      setIncomingCall(data);
      // Auto-dismiss after 30s
      setTimeout(() => setIncomingCall(null), 30000);
    });

    socket.on("video_call_accepted", (data: { conversationId: string }) => {
      if (inviteTimeoutRef.current) { clearTimeout(inviteTimeoutRef.current); inviteTimeoutRef.current = null; }
      setOutgoingCall(null);
      toast.success("Đã kết nối cuộc gọi video!");
      router.push(`/consult/video/${data.conversationId}`);
    });

    socket.on("video_call_declined", () => {
      if (inviteTimeoutRef.current) { clearTimeout(inviteTimeoutRef.current); inviteTimeoutRef.current = null; }
      setOutgoingCall(null);
      const isDoc = user?.role === "DOCTOR";
      toast.error(isDoc ? "Bệnh nhân hiện không thể nghe máy." : "Bác sĩ hiện không thể nghe máy.");
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
        setMessages(res.data.messages);
        socketRef.current?.emit("join-chat", { conversationId: activeConversation.id });
      } catch (err) {
        console.error("Lỗi tải tin nhắn", err);
      }
    };
    fetchMessages();
  }, [activeConversation]);

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
    try {
      const res = await api.post(`/messages/${activeConversation.id}`, { content });
      const newMsg = res.data.message;
      setMessages((prev) => [...prev, newMsg]);
      socketRef.current?.emit("send-direct-message", { conversationId: activeConversation.id, message: newMsg });
      setConversations((prev) =>
        prev
          .map((c) => c.id === activeConversation.id ? { ...c, messages: [newMsg], updatedAt: new Date().toISOString() } : c)
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      );
    } catch (err) {
      console.error("Lỗi gửi tin nhắn", err);
    }
  };

  const handleSelectConversation = (conv: Conversation) => {
    setActiveConversation(conv);
    setShowSidebar(false);
  };

  const handleVideoCall = () => {
    if (!activeConversation) return;
    setOutgoingCall(activeConversation);
    socketRef.current?.emit("video_call_invite", {
      conversationId: activeConversation.id,
      doctorId: user?.role === "DOCTOR" ? user?.doctorId : activeConversation.doctor?.id,
      doctorName: user?.role === "DOCTOR" ? user?.fullName : activeConversation.doctor?.name,
      callerId: user?.id,
      callerName: user?.fullName,
      callerRole: user?.role,
      isDoctor: user?.role === "DOCTOR",
    });
    if (inviteTimeoutRef.current) clearTimeout(inviteTimeoutRef.current);
    inviteTimeoutRef.current = setTimeout(() => {
      setOutgoingCall(null);
      const isDoc = user?.role === "DOCTOR";
      toast.error(isDoc ? "Bệnh nhân không phản hồi." : "Bác sĩ không phản hồi.");
    }, 30000);
  };

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((c) => {
      const name = isDoctor ? c.user?.fullName : c.doctor?.name;
      return name?.toLowerCase().includes(q);
    });
  }, [conversations, searchQuery]);

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

  const isDoctor = user?.role === "DOCTOR";

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
            });
            setIncomingCall(null);
            router.push(`/consult/video/${incomingCall.conversationId}`);
          }}
          onDecline={() => {
            socketRef.current?.emit("video_call_declined", {
              conversationId: incomingCall.conversationId,
              doctorId: incomingCall.doctorId,
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
                const target = isDoctor ? conv.user : conv.doctor;
                const targetName = isDoctor ? (target as any)?.fullName : (target as any)?.name;
                const specialty = !isDoctor ? (conv.doctor as any)?.specialty?.name : null;
                const lastMsg = conv.messages?.[0];
                const isActive = activeConversation?.id === conv.id;
                const unreadCount = conv.messages?.filter((m) => !m.isRead && m.senderId !== user?.id).length || 0;

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
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
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
                <div className="relative">
                  <Avatar src={(activeTarget as any)?.avatar} name={activeName} size={42} />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-black text-sm truncate">
                    {activeName || "Người dùng"}
                  </h3>
                  {isDoctor ? (
                    <p className="text-[12px] text-green-500 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Trực tuyến
                    </p>
                  ) : (
                    <p className="text-[12px] text-teal-600 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      {(activeConversation.doctor as any)?.specialty?.name}
                    </p>
                  )}
                </div>

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
                      const isMe = msg.senderId === user!.id;
                      const isDoctorMsg = (isDoctor && isMe) || (!isDoctor && !isMe);
                      const prevMsg = messages[idx - 1];
                      const showAvatar = !isMe && (idx === 0 || prevMsg?.senderId !== msg.senderId);
                      const showTime = idx === messages.length - 1 || messages[idx + 1]?.senderId !== msg.senderId;

                      return (
                        <div key={msg.id} className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"} ${idx > 0 && messages[idx - 1].senderId === msg.senderId ? "mt-0.5" : "mt-3"}`}>
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
                                {isDoctorMsg && isMe && (
                                  <CheckCheck className={`w-3.5 h-3.5 ml-0.5 ${msg.isRead ? "text-teal-500" : "text-gray-300"}`} />
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
