import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { getToken } from '../helpers/token-storage';
import { useAuth } from './useAuth';

const SocketContext = createContext<Socket | null>(null);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { profile } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Only connect once the user is logged in.
    if (!profile?._id) return;

    let s: Socket | null = null;
    let cancelled = false;

    // The chat socket namespace now requires the same JWT as the REST API, so
    // we must load the token (async) before opening the connection.
    (async () => {
      const token = await getToken();
      if (cancelled || !token) return;

      s = io('https://backend.coachiatry.com', {
        auth: { token },
        query: { userId: profile._id },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
      });

      setSocket(s);

      const onConnect = () => {
        s?.emit('user_online', { userId: profile._id });
      };
      const onReconnect = () => {
        s?.emit('user_online', { userId: profile._id });
      };

      s.on('connect', onConnect);
      s.io.on('reconnect', onReconnect);
    })();

    // One socket per user; clean up the actual instance on logout/unmount.
    return () => {
      cancelled = true;
      s?.disconnect();
      setSocket(null);
    };
  }, [profile?._id]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
