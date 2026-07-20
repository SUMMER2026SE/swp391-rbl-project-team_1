"use client";

import React, { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import Link from "next/link";
import api from "@/services/api";
import { useAuth } from "@/hooks/useAuth";

export function ConsultBell() {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!user || user.role === "ADMIN") return;

        const fetchUnreadCount = async () => {
            try {
                const res = await api.get("/messages/conversations");
                const convs = res.data.conversations || [];
                const count = convs.filter((c: any) => 
                    c.messages?.some((m: any) => !m.isRead && m.senderId !== user.id)
                ).length;
                setUnreadCount(count);
            } catch (error) {
                // Use console.warn instead of console.error to prevent Next.js dev overlay from showing a red screen
                console.warn("Failed to fetch conversations for ConsultBell");
            }
        };

        fetchUnreadCount();
        
        // Optional: refresh every minute if socket is not connected here
        const interval = setInterval(fetchUnreadCount, 60000);
        return () => clearInterval(interval);
    }, [user]);

    if (!user || user.role === "ADMIN") return null;

    return (
        <Link href={user.role === "DOCTOR" ? "/doctor/chat" : "/messages"} className="relative inline-block group" title="Tư vấn trực tuyến">
            <button className="p-2 rounded-full text-teal-600 hover:bg-teal-50 transition-colors focus:outline-none">
                <MessageCircle className="w-6 h-6" />
            </button>
            {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-white px-1 shadow-sm">
                    {unreadCount > 99 ? "99+" : unreadCount}
                </span>
            )}
            
            {/* Tooltip */}
            <div className="absolute top-full right-0 mt-2 whitespace-nowrap bg-slate-800 text-white text-xs font-semibold py-1.5 px-3 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none z-50">
                Tư vấn trực tuyến
                <div className="absolute -top-1 right-3 w-2 h-2 bg-slate-800 rotate-45" />
            </div>
        </Link>
    );
}
