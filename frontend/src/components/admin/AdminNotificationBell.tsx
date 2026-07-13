"use client";

import React, { useEffect, useState, useRef } from "react";
import { Bell, Check, Info, ShieldAlert, FileText, UserPlus, CreditCard, Activity, X } from "lucide-react";
import { adminService } from "@/services/admin.service";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface Notification {
  id: string;
  type: "NEW_DOCTOR_PENDING" | "NEW_COMPLAINT" | "NEW_PAYMENT_PENDING" | "ACCOUNT_REPORTED" | "BULK_CANCELLATION" | "SYSTEM";
  title: string;
  message: string;
  isRead: boolean;
  targetId?: string;
  targetUrl?: string;
  createdAt: string;
}

export default function AdminNotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await adminService.getNotifications(false);
      if (res && res.data) {
        setNotifications(res.data.slice(0, 10)); // keep last 10 in dropdown
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await adminService.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await adminService.markNotificationRead("all");
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case "NEW_DOCTOR_PENDING": return <UserPlus className="h-4 w-4 text-indigo-400" />;
      case "NEW_COMPLAINT": return <FileText className="h-4 w-4 text-orange-400" />;
      case "NEW_PAYMENT_PENDING": return <CreditCard className="h-4 w-4 text-emerald-400" />;
      case "ACCOUNT_REPORTED": return <ShieldAlert className="h-4 w-4 text-red-400" />;
      case "BULK_CANCELLATION": return <Activity className="h-4 w-4 text-red-500" />;
      default: return <Info className="h-4 w-4 text-blue-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm shadow-red-500/40">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-[200] flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-800 shrink-0 bg-slate-950/50">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Thông báo {unreadCount > 0 && <span className="px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-400 text-xs">{unreadCount} mới</span>}
            </h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="text-[10px] text-teal-400 hover:text-teal-300 font-semibold tracking-wide uppercase transition-colors">
                  Đã đọc tất cả
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1 divide-y divide-slate-800">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                <Bell className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm font-medium">Không có thông báo nào</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div key={notif.id} className={`p-4 transition-colors ${notif.isRead ? "bg-slate-900" : "bg-slate-800/40"}`}>
                  <div className="flex gap-3">
                    <div className="shrink-0 mt-0.5">
                      <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 shadow-inner">
                        {getIconForType(notif.type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={notif.targetUrl || "#"}
                          onClick={() => {
                            if (!notif.isRead) handleMarkAsRead(notif.id);
                            setIsOpen(false);
                          }}
                          className="text-sm font-semibold text-slate-200 hover:text-teal-400 transition-colors block truncate"
                        >
                          {notif.title}
                        </Link>
                        {!notif.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notif.id)}
                            className="p-1 rounded-md text-slate-500 hover:text-teal-400 hover:bg-slate-800 shrink-0"
                            title="Đánh dấu đã đọc"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{notif.message}</p>
                      <p className="text-[10px] font-medium text-slate-500 mt-2">
                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: vi })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-slate-800 text-center shrink-0 bg-slate-950/50">
            <span className="text-[10px] text-slate-500">Hiển thị 10 thông báo gần nhất</span>
          </div>
        </div>
      )}
    </div>
  );
}
