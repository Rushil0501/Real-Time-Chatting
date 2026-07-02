import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';
import { getAccessToken } from '../api/client.js';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { status } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated') {
      setSocket(null);
      setConnected(false);
      return undefined;
    }

    // `auth` as a function is re-invoked on every (re)connect attempt, so a token
    // refreshed by the axios interceptor is automatically picked up on reconnect.
    const s = io(import.meta.env.VITE_SOCKET_URL, {
      auth: (cb) => cb({ token: getAccessToken() }),
    });

    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));

    setSocket(s);

    return () => {
      s.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [status]);

  const value = useMemo(() => ({ socket, connected }), [socket, connected]);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocketContext() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocketContext must be used within SocketProvider');
  return ctx;
}
