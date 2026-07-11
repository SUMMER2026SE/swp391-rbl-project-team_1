"use client";

import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import api from "@/services/api";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";
import { Send, User, MessageCircle, Clock } from "lucide-react";
import { io, Socket } from "socket.io-client";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

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

export default function MessagesPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialDoctorId = searchParams.get("doctorId");
    
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const socketRef = useRef<Socket | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Fetch conversations
    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push("/login");
            return;
        }

        async function initChat() {
            try {
                // If patient wants to chat with a specific doctor immediately
                if (initialDoctorId && user?.role === "USER") {
                    const res = await api.post("/messages/conversations", { doctorId: initialDoctorId });
                    const newOrExistingConv = res.data.conversation;
                    // Then fetch all conversations to update the list
                }

                const res = await api.get("/messages/conversations");
                const convs = res.data.conversations;
                setConversations(convs);

                // Auto select if initialDoctorId is provided or select first
                if (initialDoctorId && user?.role === "USER") {
                    const targetConv = convs.find((c: any) => c.doctor?.id === initialDoctorId);
                    if (targetConv) setActiveConversation(targetConv);
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

        const socket = io(backendUrl, {
            withCredentials: true,
            transports: ["websocket", "polling"]
        });

        socketRef.current = socket;

        socket.on("receive-direct-message", (msg: Message) => {
            // If the message is for the currently active conversation, append it
            setMessages((prev) => {
                // Prevent duplicate
                if (prev.find(m => m.id === msg.id)) return prev;
                return [...prev, msg];
            });

            // Update conversations list (latest message)
            setConversations((prevConvs) => {
                return prevConvs.map(conv => {
                    // We don't have conversationId in the socket payload easily, 
                    // but we can just refetch conversations or rely on user action.
                    return conv; 
                });
            });
        });

        return () => {
            socket.disconnect();
        };
    }, [user]);

    // Fetch messages when active conversation changes
    useEffect(() => {
        if (!activeConversation || !socketRef.current) return;

        const fetchMessages = async () => {
            try {
                const res = await api.get(`/messages/${activeConversation.id}`);
                setMessages(res.data.messages);
                
                // Join socket room
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
        setChatInput(""); // optimistic clear

        try {
            const res = await api.post(`/messages/${activeConversation.id}`, { content });
            const newMsg = res.data.message;
            setMessages(prev => [...prev, newMsg]);

            if (socketRef.current) {
                socketRef.current.emit("send-direct-message", { 
                    conversationId: activeConversation.id, 
                    message: newMsg 
                });
            }

            // Update local conversation list
            setConversations(prev => {
                return prev.map(c => {
                    if (c.id === activeConversation.id) {
                        return { ...c, messages: [newMsg], updatedAt: new Date().toISOString() };
                    }
                    return c;
                }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
            });

        } catch (err) {
            console.error("Lỗi gửi tin nhắn", err);
        }
    };

    if (authLoading || loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><LoadingSpinner className="text-teal-600" /></div>;
    if (error) return <div className="p-4"><Alert variant="error" message={error} /></div>;

    const isDoctor = user?.role === "DOCTOR";

    return (
        <div className="max-w-6xl mx-auto p-4 h-[calc(100vh-80px)]">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 flex h-full overflow-hidden">
                {/* Left Sidebar - Conversations List */}
                <div className="w-1/3 border-r border-slate-100 bg-slate-50/50 flex flex-col shrink-0">
                    <div className="p-4 border-b border-slate-200/60 bg-white">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <MessageCircle className="w-5 h-5 text-teal-600" />
                            {isDoctor ? "Tin nhắn Bệnh nhân" : "Tư vấn Bác sĩ"}
                        </h2>
                    </div>
                    <div className="flex-1 overflow-y-auto scrollbar-thin">
                        {conversations.length === 0 ? (
                            <div className="p-6 text-center text-slate-400 text-sm">
                                Chưa có cuộc hội thoại nào.
                            </div>
                        ) : (
                            conversations.map((conv) => {
                                const target = isDoctor ? conv.user : conv.doctor;
                                const targetName = isDoctor ? target?.fullName : target?.name;
                                const lastMsg = conv.messages?.[0];
                                const isActive = activeConversation?.id === conv.id;

                                return (
                                    <div 
                                        key={conv.id}
                                        onClick={() => setActiveConversation(conv)}
                                        className={`p-4 border-b border-slate-100 cursor-pointer transition-all ${
                                            isActive ? "bg-teal-50 border-l-4 border-l-teal-500" : "hover:bg-slate-100 border-l-4 border-l-transparent"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {target?.avatar ? (
                                                <Image src={target.avatar.startsWith('http') ? target.avatar : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${target.avatar}`} alt="Avatar" width={48} height={48} className="w-12 h-12 rounded-full object-cover border border-slate-200" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                                                    <User className="w-6 h-6" />
                                                </div>
                                            )}
                                            <div className="flex-1 overflow-hidden">
                                                <div className="flex justify-between items-start">
                                                    <h3 className={`font-semibold text-sm truncate ${isActive ? "text-teal-800" : "text-slate-800"}`}>
                                                        {targetName || "Người dùng"}
                                                    </h3>
                                                    {lastMsg && (
                                                        <span className="text-[10px] text-slate-400 shrink-0">
                                                            {new Date(lastMsg.createdAt).toLocaleDateString("vi-VN")}
                                                        </span>
                                                    )}
                                                </div>
                                                {!isDoctor && conv.doctor?.specialty && (
                                                    <p className="text-[11px] text-teal-600 mb-1">{conv.doctor.specialty.name}</p>
                                                )}
                                                <p className="text-xs text-slate-500 truncate mt-0.5">
                                                    {lastMsg ? (
                                                        <span className={!lastMsg.isRead && lastMsg.senderId !== user?.id ? "font-bold text-slate-800" : ""}>
                                                            {lastMsg.senderId === user?.id ? "Bạn: " : ""}
                                                            {lastMsg.content}
                                                        </span>
                                                    ) : "Chưa có tin nhắn"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Right Area - Chat Window */}
                <div className="flex-1 bg-white flex flex-col relative">
                    {activeConversation ? (
                        <>
                            {/* Chat Header */}
                            <div className="h-16 px-6 border-b border-slate-100 flex items-center gap-4 bg-white/80 backdrop-blur z-10 shrink-0">
                                {isDoctor ? (
                                    <>
                                        {activeConversation.user?.avatar ? (
                                            <Image src={activeConversation.user.avatar.startsWith('http') ? activeConversation.user.avatar : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${activeConversation.user.avatar}`} alt="Avatar" width={40} height={40} className="w-10 h-10 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                <User className="w-5 h-5" />
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="font-bold text-slate-800">{activeConversation.user?.fullName}</h3>
                                            <p className="text-xs text-slate-500">Bệnh nhân</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {activeConversation.doctor?.avatar ? (
                                            <Image src={activeConversation.doctor.avatar.startsWith('http') ? activeConversation.doctor.avatar : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${activeConversation.doctor.avatar}`} alt="Avatar" width={40} height={40} className="w-10 h-10 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                <User className="w-5 h-5" />
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="font-bold text-slate-800">{activeConversation.doctor?.name}</h3>
                                            <p className="text-xs text-teal-600 font-medium">{activeConversation.doctor?.specialty?.name}</p>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Chat Messages */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                                {messages.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
                                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                                            <MessageCircle className="w-8 h-8 text-slate-300" />
                                        </div>
                                        <p>Hãy gửi lời chào đầu tiên!</p>
                                    </div>
                                ) : (
                                    messages.map((msg, idx) => {
                                        const isMe = msg.senderId === user.id;
                                        // Simple time grouping logic could go here
                                        return (
                                            <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                                                <div className={`max-w-[70%] px-4 py-2.5 text-sm ${
                                                    isMe ? "bg-teal-600 text-white rounded-2xl rounded-tr-sm shadow-sm shadow-teal-500/10" 
                                                         : "bg-white border border-slate-200 text-slate-700 rounded-2xl rounded-tl-sm shadow-sm"
                                                }`}>
                                                    {msg.content}
                                                </div>
                                                <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 px-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(msg.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            {/* Chat Input */}
                            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 shrink-0">
                                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-full pr-1.5 pl-4 py-1.5 focus-within:border-teal-500 focus-within:bg-white transition-all shadow-sm">
                                    <input
                                        type="text"
                                        placeholder="Nhập tin nhắn..."
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 py-2"
                                    />
                                    <button 
                                        type="submit"
                                        disabled={!chatInput.trim()}
                                        className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shrink-0"
                                    >
                                        <Send className="w-4 h-4 ml-0.5" />
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 shadow-sm">
                                <MessageCircle className="w-10 h-10 text-slate-300" />
                            </div>
                            <div className="text-center">
                                <h3 className="font-semibold text-slate-600">Ứng dụng Nhắn tin</h3>
                                <p className="text-sm mt-1">Chọn một hội thoại để bắt đầu</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
