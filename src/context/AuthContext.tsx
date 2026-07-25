import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api, setAuthToken, getAuthToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  isMobileSimulated: boolean;
  toggleMobileSimulated: () => void;
  login: (email: string, senha: string) => Promise<void>;
  register: (nome: string, email: string, senha: string, cargo?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  canPerform: (action: 'manage_users' | 'delete_products' | 'edit_products' | 'config') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isMobileSimulated, setIsMobileSimulated] = useState<boolean>(false);

  const fetchCurrentUser = async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.getMe();
      setUser(res.user);
    } catch (err) {
      console.error('Session expired or invalid:', err);
      setAuthToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, senha: string) => {
    setLoading(true);
    try {
      const res = await api.login(email, senha);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const register = async (nome: string, email: string, senha: string, cargo?: string) => {
    setLoading(true);
    try {
      const res = await api.register({ nome, email, senha, cargo });
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  const toggleMobileSimulated = () => {
    setIsMobileSimulated(prev => !prev);
  };

  const canPerform = (action: 'manage_users' | 'delete_products' | 'edit_products' | 'config'): boolean => {
    if (!user) return false;
    const { cargo } = user;

    if (action === 'manage_users' || action === 'config') {
      return cargo === 'admin_supremo';
    }

    if (action === 'delete_products') {
      return cargo === 'admin_supremo' || cargo === 'gerente';
    }

    if (action === 'edit_products') {
      return cargo === 'admin_supremo' || cargo === 'gerente';
    }

    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        isMobileSimulated,
        toggleMobileSimulated,
        login,
        register,
        logout,
        refreshUser,
        canPerform
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
