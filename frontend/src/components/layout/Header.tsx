'use client';

import React, { useState, useEffect } from 'react';
import useAuth from '../../hooks/useAuth';
import useSocket from '../../hooks/useSocket';
import { Bell, Wifi, WifiOff, X, Calendar, Flame } from 'lucide-react';
import api from '../../services/api';
import { Alert } from '../../types';

export function Header() {
  const { user } = useAuth();
  const { isConnected, on, off } = useSocket();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [streakDays, setStreakDays] = useState<number>(0);

  // Fetch initial notifications and streak
  useEffect(() => {
    if (user && user.role === 'STUDENT') {
      fetchNotifications();
      fetchStreak();
    }
  }, [user]);

  // Subscribe to real-time notification socket events
  useEffect(() => {
    const handleRealtimeNotification = (data: any) => {
      const newNotif = {
        id: data.id || Math.random().toString(),
        type: data.type || 'INFO',
        title: data.title || 'Thông báo mới',
        message: data.message,
        isRead: false,
        createdAt: data.createdAt || new Date().toISOString()
      };
      setNotifications(prev => [newNotif, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    on('notification', handleRealtimeNotification);

    return () => {
      off('notification', handleRealtimeNotification);
    };
  }, [on, off, user]);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      if (response.data.success) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unreadCount);
      }
    } catch (_) {}
  };

  const fetchStreak = async () => {
    try {
      const response = await api.get('/leaderboard');
      if (response.data.success && response.data.myRank?.details) {
        setStreakDays(response.data.myRank.details.streak || 0);
      }
    } catch (_) {}
  };

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      if (id === 'all') {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      } else {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (_) {}
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  const getFormattedDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return new Date().toLocaleDateString('vi-VN', options);
  };

  return (
    <header className="sticky top-0 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 h-16 px-6 flex items-center justify-between z-30">
      {/* Page Info / Greeting */}
      <div>
        <h2 className="text-slate-100 font-bold text-base md:text-lg flex items-center gap-2">
          {user ? `${getGreeting()}, ${user.fullName}!` : 'Hệ thống EduPath'}
        </h2>
        <p className="text-slate-500 text-xs flex items-center gap-1.5 mt-0.5 font-medium">
          <Calendar className="w-3.5 h-3.5" />
          <span>{getFormattedDate()}</span>
        </p>
      </div>

      {/* Action Row */}
      <div className="flex items-center gap-4">
        {/* Connection status */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold select-none border transition-all duration-300 ${
            isConnected
              ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/50'
              : 'bg-rose-950/20 text-rose-400 border-rose-900/50 animate-pulse'
          }`}
          title={isConnected ? 'Kết nối thời gian thực ổn định' : 'Mất kết nối với Socket server'}
        >
          {isConnected ? (
            <>
              <Wifi className="w-3.5 h-3.5" />
              <span>Realtime</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline</span>
            </>
          )}
        </div>

        {/* Streak (Student only) */}
        {user?.role === 'STUDENT' && streakDays > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-950/20 text-amber-400 border border-amber-900/50">
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500 animate-bounce" />
            <span>{streakDays} Ngày streak</span>
          </div>
        )}

        {/* Notifications Icon with Dropdown */}
        {user?.role === 'STUDENT' && (
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-2 rounded-xl text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition-all duration-300 relative border border-slate-900"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white font-bold text-[10px] flex items-center justify-center border-2 border-slate-950 animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown Card */}
            {showDropdown && (
              <div className="absolute right-0 mt-3 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl shadow-slate-950/50 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
                  <span className="text-slate-200 font-bold text-sm">Thông báo</span>
                  {unreadCount > 0 && (
                    <button onClick={() => markAsRead('all')} className="text-[10px] text-blue-400 hover:text-blue-300 font-bold">
                      Đánh dấu đã đọc
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/50">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-slate-500 text-sm">
                      Không có thông báo nào.
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div key={notif.id} className={`p-4 transition-colors flex gap-3 relative group ${notif.isRead ? 'bg-slate-900/50' : 'bg-slate-800/30 hover:bg-slate-800/50'}`}>
                        <div className="flex-1">
                          <p className={`text-xs font-semibold mb-1 ${notif.type === 'ACHIEVEMENT' ? 'text-amber-400' : notif.type === 'RED_FLAG' ? 'text-rose-400' : 'text-blue-400'}`}>
                            {notif.title}
                          </p>
                          <p className="text-slate-300 text-xs leading-relaxed">
                            {notif.message}
                          </p>
                          <span className="text-[10px] text-slate-500 block mt-2">
                            {new Date(notif.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {!notif.isRead && (
                          <button
                            onClick={() => markAsRead(notif.id)}
                            className="text-blue-500 hover:text-blue-300 transition-colors p-1 self-start rounded"
                            title="Đánh dấu đã đọc"
                          >
                            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
