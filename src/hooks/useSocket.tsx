import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';

const SocketContext = createContext<Socket | null>(null);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { profile } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // ⚠️ Only connect if user is logged in
    if (!profile?._id) return;

    // Prevent duplicate sockets
    if (!socket) {
      const s = io('http://192.168.1.10:3001', {
        query: { userId: profile._id },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      setSocket(s);

      s.on('connect', () => {
        console.log('✅ Connected:', s.id);
        s.emit('user_online', { userId: profile?._id });
      });

      s.on('disconnect', () => {
        console.log('❌ Disconnected');
      });

      // optional: re-emit online after reconnection
      s.io.on('reconnect', () => {
        console.log('🔁 Reconnected');
        s.emit('user_online', { userId: profile?._id });
      });
    }

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    };
  }, [profile?._id, socket]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
