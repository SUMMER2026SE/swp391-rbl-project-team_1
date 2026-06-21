'use client';

import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import useAuth from './useAuth';

const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

export function useSocket() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!user) {
      setSocket(null);
      setIsConnected(false);
      return;
    }

    const s = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling']
    });

    setSocket(s);

    s.on('connect', () => {
      console.log('Connected to WebSocket server:', s.id);
      setIsConnected(true);

      // Join appropriate room
      if (user.role === 'STUDENT' && user.studentId) {
        s.emit('join', { room: `student:${user.studentId}` });
      } else if (user.role === 'MENTOR' && user.mentorId) {
        s.emit('join', { room: `mentor:${user.mentorId}` });
      } else if (user.role === 'ADMIN') {
        s.emit('join', { room: 'admin' });
      }
    });

    s.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setIsConnected(false);
    });

    return () => {
      s.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [user]);

  const onEvent = useCallback((event: string, callback: (...args: any[]) => void) => {
    if (socket) {
      socket.on(event, callback);
    }
  }, [socket]);

  const offEvent = useCallback((event: string, callback?: (...args: any[]) => void) => {
    if (socket) {
      socket.off(event, callback);
    }
  }, [socket]);

  return {
    isConnected,
    socket,
    on: onEvent,
    off: offEvent
  };
}

export default useSocket;
