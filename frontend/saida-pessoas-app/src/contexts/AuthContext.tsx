import React, { createContext, useContext, useState, useCallback } from 'react';
import type { AuthUser } from '../types';
import { authService } from '../services/api';

interface AuthContextType {
  user: AuthUser | null;
  login: (identificacao: string, senha: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('auth');
    return stored ? (JSON.parse(stored) as AuthUser) : null;
  });

  const login = useCallback(async (identificacao: string, senha: string) => {
    const { data } = await authService.login(identificacao, senha);
    localStorage.setItem('auth', JSON.stringify(data));
    setUser(data);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
