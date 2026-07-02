import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi, userApi } from '../api/index.js';
import { setAccessToken, setOnAuthChange } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'authenticated' | 'anonymous'

  const applySession = useCallback((data) => {
    if (data?.accessToken) {
      setAccessToken(data.accessToken);
      setUser(data.user);
      setStatus('authenticated');
    } else {
      setAccessToken(null);
      setUser(null);
      setStatus('anonymous');
    }
  }, []);

  // Lets the axios interceptor push refreshed/expired sessions back into this context.
  useEffect(() => {
    setOnAuthChange((data) => {
      if (data?.accessToken) {
        setUser((prev) => data.user ?? prev);
        setStatus('authenticated');
      } else {
        applySession(null);
      }
    });
  }, [applySession]);

  // On first load, try to silently restore a session from the httpOnly refresh cookie.
  useEffect(() => {
    authApi
      .refresh()
      .then((data) => applySession(data))
      .catch(() => applySession(null));
  }, [applySession]);

  const register = useCallback(
    async (payload) => {
      const data = await authApi.register(payload);
      applySession(data);
      return data.user;
    },
    [applySession]
  );

  const login = useCallback(
    async (payload) => {
      const data = await authApi.login(payload);
      applySession(data);
      return data.user;
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      applySession(null);
    }
  }, [applySession]);

  const refreshMe = useCallback(async () => {
    const me = await userApi.me();
    setUser(me);
    return me;
  }, []);

  const value = { user, status, register, login, logout, refreshMe };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
