"use client";

import React, { useState, useRef, useEffect } from "react";
import { useNotifications, NotificationData } from "@/hooks/useNotifications";
import { Bell, Check, Trash2, Calendar, FileText, CheckCircle, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

export function NotificationBell() {
    const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const getIconForType = (type: string) => {
        switch (type) {
            case "APPOINTMENT_CONFIRMED":
            case "NEW_APPOINTMENT":
            case "APPOINTMENT_REMINDER_24H":
                return <Calendar className="w-5 h-5 text-blue-500" />;
            case "PAYMENT_RECEIVED":
            case "REFUND_PROCESSED":
                return <FileText className="w-5 h-5 text-green-500" />;
            case "CERTIFICATE_VERIFIED":
            case "ACCOUNT_APPROVED":
                return <CheckCircle className="w-5 h-5 text-teal-500" />;
            default:
                return <Info className="w-5 h-5 text-gray-500" />;
        }
    };

    const handleNotificationClick = (notification: NotificationData) => {
        if (!notification.isRead) {
            markAsRead(notification.id);
        }
        setIsOpen(false);

        // Navigate based on type and data
        if (notification.data?.appointmentId) {
            router.push(`/patient/appointments/${notification.data.appointmentId}`);
        } else if (notification.type === "PAYMENT_RECEIVED") {
            router.push(`/admin/payments`);
        } else if (notification.type === "CERTIFICATE_VERIFIED") {
            router.push(`/doctor/certificates`);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:text-teal-600 focus:outline-none transition-colors rounded-full hover:bg-teal-50"
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 z-50 overflow-hidden flex flex-col max-h-[80vh]">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="text-lg font-semibold text-gray-800">Thông báo</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-sm text-teal-600 hover:text-teal-800 font-medium flex items-center gap-1 transition-colors"
                            >
                                <Check className="w-4 h-4" />
                                Đánh dấu đã đọc
                            </button>
                        )}
                    </div>

                    <div className="overflow-y-auto flex-1">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center">
                                <Bell className="w-12 h-12 text-gray-200 mb-3" />
                                <p>Bạn không có thông báo nào</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-50">
                                {notifications.map((notification) => (
                                    <li
                                        key={notification.id}
                                        className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer group ${!notification.isRead ? 'bg-teal-50/30' : ''}`}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        <div className="flex gap-3">
                                            <div className="flex-shrink-0 mt-1">
                                                {getIconForType(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                                                    {notification.title}
                                                </p>
                                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                                                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: vi })}
                                                </p>
                                            </div>
                                            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2">
                                                {!notification.isRead && (
                                                    <div className="w-2.5 h-2.5 bg-teal-500 rounded-full self-end mt-1" />
                                                )}
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors mt-auto"
                                                    title="Xóa"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
