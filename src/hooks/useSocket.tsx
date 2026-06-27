import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';

const SocketContext = createContext<Socket | null>(null);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { profile } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Only connect once the user is logged in.
    if (!profile?._id) return;

    const s = io('https://backend.coachiatry.com', {
      query: { userId: profile._id },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    setSocket(s);

    const onConnect = () => {
      s.emit('user_online', { userId: profile._id });
    };
    const onReconnect = () => {
      s.emit('user_online', { userId: profile._id });
    };

    s.on('connect', onConnect);
    s.io.on('reconnect', onReconnect);

    // One socket per user; clean up the actual instance + its listeners on
    // logout/unmount. (Previously `socket` was in the deps, causing the effect
    // to re-run on its own setSocket and churn the connection.)
    return () => {
      s.off('connect', onConnect);
      s.io.off('reconnect', onReconnect);
      s.disconnect();
      setSocket(null);
    };
  }, [profile?._id]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
