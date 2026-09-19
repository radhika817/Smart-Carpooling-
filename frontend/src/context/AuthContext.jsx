import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('smartride_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('smartride_token') || null);
  const [isLoading, setIsLoading] = useState(true);

  // Validate existing token with /api/auth/me on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('smartride_token');
      if (storedToken) {
        try {
          const res = await authService.getMe();
          if (res?.data?.user) {
            setUser(res.data.user);
            localStorage.setItem('smartride_user', JSON.stringify(res.data.user));
          }
        } catch {
          // Token invalid or expired
          localStorage.removeItem('smartride_token');
          localStorage.removeItem('smartride_user');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authService.login({ email, password });
    if (res?.data) {
      const { user: loggedInUser, token: authToken } = res.data;
      localStorage.setItem('smartride_token', authToken);
      localStorage.setItem('smartride_user', JSON.stringify(loggedInUser));
      setToken(authToken);
      setUser(loggedInUser);
      return res;
    }
    return res;
  }, []);

  const register = useCallback(async (userData) => {
    const res = await authService.register(userData);
    if (res?.data) {
      const { user: registeredUser, token: authToken } = res.data;
      localStorage.setItem('smartride_token', authToken);
      localStorage.setItem('smartride_user', JSON.stringify(registeredUser));
      setToken(authToken);
      setUser(registeredUser);
      return res;
    }
    return res;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await authService.getMe();
      if (res?.data?.user) {
        setUser(res.data.user);
        localStorage.setItem('smartride_user', JSON.stringify(res.data.user));
      }
    } catch (e) {
      console.error('Failed to refresh user profile:', e);
    }
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
