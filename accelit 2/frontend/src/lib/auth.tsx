// src/lib/auth.tsx
// AuthContext — stores the current user + token, exposes login/logout.
// Wrap the app in <AuthProvider> and consume with useAuth().

import React, { createContext, useContext, useState, useCallback } from 'react';
import { api } from './api';
import type { AuthUser, LoginResponse } from '@/types';

interface AuthContextValue {
  user:    AuthUser | null;
  token:   string | null;
  login:   (email: string, password: string) => Promise<void>;
  logout:  () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem('accelit_user');
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,  setUser]  = useState<AuthUser | null>(loadStoredUser);
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('accelit_token')
  );

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<LoginResponse>('/auth/login', { email, password });

    const authUser: AuthUser = {
      userId: data.user.id,
      name:   data.user.name,
      role:   data.user.role,
    };

    localStorage.setItem('accelit_token', data.token);
    localStorage.setItem('accelit_user',  JSON.stringify(authUser));

    setToken(data.token);
    setUser(authUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('accelit_token');
    localStorage.removeItem('accelit_user');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
