'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import useAuth from './useAuth';

const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

export function useSocket() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // Connect to Socket.IO server
    const socket = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to WebSocket server:', socket.id);
      setIsConnected(true);

      // Join appropriate room
      if (user.role === 'STUDENT' && user.studentId) {
        socket.emit('join', { room: `student:${user.studentId}` });
      } else if (user.role === 'MENTOR' && user.mentorId) {
        socket.emit('join', { room: `mentor:${user.mentorId}` });
      } else if (user.role === 'ADMIN') {
        socket.emit('join', { room: 'admin' });
      }
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [user]);

  // Expose register event handler
  const onEvent = (event: string, callback: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  };

  // Expose unregister event handler
  const offEvent = (event: string, callback?: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  };

  return {
    isConnected,
    socket: socketRef.current,
    on: onEvent,
    off: offEvent
  };
}

export default useSocket;
