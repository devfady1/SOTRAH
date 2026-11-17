import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('sotrah_owner_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('sotrah_owner_access');
    localStorage.removeItem('sotrah_owner_refresh');
    localStorage.removeItem('sotrah_owner_user');
    setUser(null);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('sotrah_owner_access');
    if (token) {
      authApi
        .getMe()
        .then((res) => {
          if (res.user?.role === 'SUPER_ADMIN') {
            setUser(res.user);
            localStorage.setItem('sotrah_owner_user', JSON.stringify(res.user));
          } else {
            logout();
          }
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [logout]);

  const login = async (email, password) => {
    const data = await authApi.login(email, password);

    // CRITICAL: Strict SUPER_ADMIN check
    if (data.user?.role !== 'SUPER_ADMIN') {
      throw new Error('هذه اللوحة مخصصة لمالك النظام العام (Super Admin) فقط. تم رفض تصريح الدخول.');
    }

    localStorage.setItem('sotrah_owner_access', data.tokens.access);
    if (data.tokens.refresh) {
      localStorage.setItem('sotrah_owner_refresh', data.tokens.refresh);
    }
    localStorage.setItem('sotrah_owner_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isSuperAdmin,
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
