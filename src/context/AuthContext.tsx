import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { parseApiError } from '../utils/apiError';

export interface User {
  User_ID:      number;
  full_name:    string;
  Email:        string;
  Role:         string;
  Account_type: string;
  created_at:   string;
}

export interface UsageState {
  used:      number;
  limit:     number;
  remaining: number;
  unlimited: boolean;
}

interface AuthContextType {
  user:                User | null;
  token:               string | null;
  forcePasswordChange: boolean;
  usage:               UsageState;
  login:               (email: string, password: string) => Promise<void>;
  register:            (name: string, email: string, password: string) => Promise<any>;
  logout:              () => void;
  isAdmin:             () => boolean;
  refreshUsage:        () => Promise<void>;
  clearForceChange:    () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);
export const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function handleResponse(res: Response): Promise<any> {
  const data = await res.json();
  if (!res.ok) throw new Error(parseApiError(data.detail));
  return data;
}

const DEFAULT_USAGE: UsageState = {
  used: 0, limit: 5, remaining: 5, unlimited: false,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,                setUser]                = useState<User | null>(null);
  const [token,               setToken]               = useState<string | null>(null);
  const [forcePasswordChange, setForcePasswordChange] = useState(false);
  const [usage,               setUsage]               = useState<UsageState>(DEFAULT_USAGE);

  useEffect(() => {
    const restore = () => {
      const t = localStorage.getItem('truesite_token');
      const u = localStorage.getItem('truesite_user');
      const f = localStorage.getItem('truesite_force_change');
      if (t && u) {
        setToken(t);
        setUser(JSON.parse(u));
        if (f === 'true') setForcePasswordChange(true);
      } else {
        setToken(null);
        setUser(null);
      }
    };

    restore();

    const handlePopState = () => {
      const t = localStorage.getItem('truesite_token');
      if (!t) window.location.replace('/signin');
      else restore();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const refreshUsage = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/analysis/usage`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsage({
          used:      data.used      ?? 0,
          limit:     data.limit     ?? 5,
          remaining: data.remaining ?? 5,
          unlimited: data.unlimited ?? false,
        });
      }
    } catch { /* ignore */ }
  };

  useEffect(() => { if (token) refreshUsage(); }, [token]);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await handleResponse(res);

    setToken(data.access_token);
    setUser(data.user);

    const force = !!data.force_password_change;
    setForcePasswordChange(force);

    localStorage.setItem('truesite_token', data.access_token);
    localStorage.setItem('truesite_user',  JSON.stringify(data.user));
    localStorage.setItem('truesite_force_change', force ? 'true' : 'false');
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await fetch(`${API}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: name, email, password }),
    });
    return await handleResponse(res);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setForcePasswordChange(false);
    setUsage(DEFAULT_USAGE);
    localStorage.removeItem('truesite_token');
    localStorage.removeItem('truesite_user');
    localStorage.removeItem('truesite_force_change');
    window.location.replace('/signin');
  };

  const clearForceChange = () => {
    setForcePasswordChange(false);
    localStorage.setItem('truesite_force_change', 'false');
  };

  const isAdmin = () => user?.Role === 'Admin';

  return (
    <AuthContext.Provider value={{
      user, token, forcePasswordChange, usage,
      login, register, logout, isAdmin, refreshUsage, clearForceChange,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}