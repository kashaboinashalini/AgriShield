import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';

const Ctx = createContext<any>(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: any) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const persist = (token: string, u: any) => {
    if (token) localStorage.setItem('token', token);
    setUser(u);
  };

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (!t) { setLoading(false); return; }
    api.get('/auth/me')
      .then(r => setUser(r.data.data.user))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));

    const onLogout = () => { localStorage.removeItem('token'); setUser(null); };
    window.addEventListener('auth:logout', onLogout);
    return () => window.removeEventListener('auth:logout', onLogout);
  }, []);

  const login = async (emailOrMobile: string, password: string) => {
    const r = await api.post('/auth/login', { emailOrMobile, password });
    persist(r.data.data.token, r.data.data.user);
  };

  const demoLogin = async () => {
    const r = await api.post('/auth/demo', { password: 'Demo@123' });
    persist(r.data.data.token, r.data.data.user);
  };

  const register = async (data: any) => {
    const r = await api.post('/auth/register', data);
    persist(r.data.data.token, r.data.data.user);
  };

  const updateProfile = async (data: any) => {
    const r = await api.put('/auth/profile', data);
    setUser(r.data.data.user);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await api.put('/auth/password', { currentPassword, newPassword });
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.removeItem('token');
    setUser(null);
  };

  return <Ctx.Provider value={{ user, loading, login, demoLogin, register, updateProfile, changePassword, logout }}>{children}</Ctx.Provider>;
}
