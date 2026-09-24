'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('elena_token');
      const savedUser = localStorage.getItem('elena_user');

      if (token && savedUser) {
        setUser(JSON.parse(savedUser));
        // Verificar se o token ainda é válido
        const response = await authAPI.getMe();
        const freshUser = response.data.user;
        setUser(freshUser);
        localStorage.setItem('elena_user', JSON.stringify(freshUser));
      }
    } catch (err) {
      // Token inválido
      localStorage.removeItem('elena_token');
      localStorage.removeItem('elena_user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email, senha) => {
    const response = await authAPI.login({ email, senha });
    const { user: userData, token } = response.data;
    localStorage.setItem('elena_token', token);
    localStorage.setItem('elena_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('elena_token');
    localStorage.removeItem('elena_user');
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('elena_user', JSON.stringify(updatedUser));
  };

  const userRole = user?.role || user?.tipo_usuario;
  const isAdmin = userRole === 'admin';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      updateUser,
      isAdmin,
      isAuthenticated,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
