import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { AuthUser, PerfilUsuario } from '../types';
import { authService, usuariosService } from '../services/api';

interface AuthContextType {
  user: AuthUser | null;
  login: (identificacao: string, senha: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  /** true enquanto a sessão salva localmente ainda está sendo revalidada contra o backend. */
  checking: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const readStoredAuth = (): AuthUser | null => {
  const stored = localStorage.getItem('auth');
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored);
    if (parsed && typeof parsed === 'object' && parsed.token && parsed.perfil && parsed.nome) {
      return parsed as AuthUser;
    }
  } catch {
    /* ignora JSON inválido */
  }
  localStorage.removeItem('auth');
  return null;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(readStoredAuth);
  const [checking, setChecking] = useState(() => !!readStoredAuth());

  // Um token salvo no localStorage não é suficiente por si só: ele pode estar expirado,
  // revogado, ou o backend pode estar fora do ar. Toda carga do app revalida a sessão
  // contra o servidor antes de considerar o usuário autenticado.
  useEffect(() => {
    const stored = readStoredAuth();
    if (!stored) {
      setChecking(false);
      return;
    }

    let cancelled = false;
    usuariosService.getMe()
      .then(({ data }) => {
        if (cancelled) return;
        const refreshed: AuthUser = {
          ...stored,
          nome: data.nome,
          perfil: data.perfil as PerfilUsuario,
          setor: data.setor,
          userId: data.id,
        };
        localStorage.setItem('auth', JSON.stringify(refreshed));
        setUser(refreshed);
      })
      .catch(() => {
        if (cancelled) return;
        localStorage.removeItem('auth');
        setUser(null);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (identificacao: string, senha: string) => {
    const { data } = await authService.login(identificacao, senha);
    if (!data || typeof data !== 'object' || !data.token || !data.perfil) {
      throw new Error('Resposta inválida do servidor.');
    }
    localStorage.setItem('auth', JSON.stringify(data));
    setUser(data);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, checking }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
