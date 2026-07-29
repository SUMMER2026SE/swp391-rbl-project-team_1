import { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import socket from "../services/socket";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface NotificationData {
    id: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    data: any;
    isRead: boolean;
    createdAt: string;
}

export function useNotifications() {
    const { user, token } = useAuth();
    const [notifications, setNotifications] = useState<NotificationData[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = useCallback(async () => {
        if (!token) return;
        try {
            const response = await api.get("/notifications");
            setNotifications(response.data.notifications);
            setUnreadCount(response.data.unreadCount);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    useEffect(() => {
        if (!user || !token) return;

        socket.emit("join_user_room", { userId: user.id });
        if (user.role === "ADMIN") {
            socket.emit("join_admin_room");
        }
        if (user.role === "DOCTOR") {
            socket.emit("join_doctor_room", { doctorId: user.id });
        }

        const handleNewNotification = (notification: NotificationData) => {
            setNotifications(prev => [notification, ...prev].slice(0, 50));
            setUnreadCount(prev => prev + 1);
            toast.info(notification.title, {
                description: notification.message
            });
        };

        const handlePaymentConfirmed = (data: any) => {
            fetchNotifications(); // Refresh notifications when payment confirmed
        };

        const handleNewAppointment = (data: any) => {
            fetchNotifications();
        };
        
        const handlePaymentUpdated = (data: any) => {
            fetchNotifications();
        }

        socket.on("new_notification", handleNewNotification);
        socket.on("payment_confirmed", handlePaymentConfirmed);
        socket.on("new_appointment", handleNewAppointment);
        socket.on("payment_updated", handlePaymentUpdated);

        return () => {
            socket.off("new_notification", handleNewNotification);
            socket.off("payment_confirmed", handlePaymentConfirmed);
            socket.off("new_appointment", handleNewAppointment);
            socket.off("payment_updated", handlePaymentUpdated);
        };
    }, [user, token, fetchNotifications]);

    const markAsRead = async (id: string) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark as read:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put("/notifications/read-all");
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to mark all as read:", error);
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            await api.delete(`/notifications/${id}`);
            const deleted = notifications.find(n => n.id === id);
            if (deleted && !deleted.isRead) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (error) {
            console.error("Failed to delete notification:", error);
        }
    };

    return {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification
    };
}
