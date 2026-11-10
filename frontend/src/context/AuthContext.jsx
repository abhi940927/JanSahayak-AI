import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { supabase, isSupabaseConfigured } from '../services/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem('jansahayak_user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [role, setRole] = useState(() => {
    const cachedRole = localStorage.getItem('jansahayak_role');
    const demoRole = localStorage.getItem('jansahayak_demo_role');
    return cachedRole || demoRole || 'citizen';
  });

  const [availableRoles, setAvailableRoles] = useState(() => {
    try {
      const cached = localStorage.getItem('jansahayak_available_roles');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [language, setLanguageState] = useState(localStorage.getItem('jansahayak_language') || 'en');
  const [loading, setLoading] = useState(() => {
    // If cached user and token exist, don't block the initial render
    try {
      const cached = localStorage.getItem('jansahayak_user');
      const token = localStorage.getItem('jansahayak_token');
      return !(cached && token);
    } catch {
      return false;
    }
  });

  const setLanguage = (lang) => {
    setLanguageState(lang);
    localStorage.setItem('jansahayak_language', lang);
  };

  useEffect(() => {
    initAuthSession();
  }, []);

  const initAuthSession = async () => {
    try {
      // Only set loading if no cached user exists
      const cached = localStorage.getItem('jansahayak_user');
      if (!cached) {
        setLoading(true);
      }

      // If Supabase is configured, check for active session
      if (isSupabaseConfigured && supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          localStorage.setItem('jansahayak_token', session.access_token);
        }
      }

      const token = localStorage.getItem('jansahayak_token');
      if (token) {
        const res = await api.get('/profile');
        if (res.success && res.data) {
          setUser(res.data);
          setRole(res.data.role);
          setAvailableRoles(res.data.roles || [res.data.role]);
          localStorage.setItem('jansahayak_user', JSON.stringify(res.data));
          localStorage.setItem('jansahayak_role', res.data.role);
        }
      } else {
        // If in evaluation demo mode without explicit user token
        const demoRole = localStorage.getItem('jansahayak_demo_role');
        if (demoRole) {
          const res = await api.get('/profile');
          if (res.success && res.data) {
            setUser(res.data);
            setRole(res.data.role);
            setAvailableRoles(res.data.roles || [res.data.role]);
          }
        }
      }
    } catch (err) {
      console.warn('[AuthContext] Session init warning:', err.message);
      // Clean invalid token if expired
      if (err.message.includes('401') || err.message.includes('expired')) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, portalContext) => {
    try {
      setLoading(true);

      // 1. If Supabase configured, authenticate with Supabase Auth
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.session) {
          localStorage.setItem('jansahayak_token', data.session.access_token);
        }
      }

      // 2. Authenticate through backend API endpoint
      const res = await api.post('/auth/login', {
        email,
        password,
        portal_context: portalContext
      });

      if (!res.success) {
        throw new Error(res.message || 'Login failed');
      }

      const authData = res.data;
      if (authData.token) {
        localStorage.setItem('jansahayak_token', authData.token);
      }
      if (authData.user) {
        setUser(authData.user);
        setRole(authData.user.role);
        setAvailableRoles(authData.available_roles || [authData.user.role]);
        localStorage.setItem('jansahayak_user', JSON.stringify(authData.user));
        localStorage.setItem('jansahayak_role', authData.user.role);
        localStorage.setItem('jansahayak_available_roles', JSON.stringify(authData.available_roles || [authData.user.role]));
      }

      return authData;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const res = await api.post('/auth/register', userData);
      if (!res.success) {
        throw new Error(res.message || 'Registration failed');
      }

      const regData = res.data;
      if (regData.token) {
        localStorage.setItem('jansahayak_token', regData.token);
      }
      if (regData.user) {
        setUser(regData.user);
        setRole(regData.user.role || 'citizen');
        setAvailableRoles(regData.user.roles || ['citizen']);
        localStorage.setItem('jansahayak_user', JSON.stringify(regData.user));
        localStorage.setItem('jansahayak_role', regData.user.role || 'citizen');
      }

      return regData;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData) => {
    const res = await api.patch('/profile', profileData);
    if (!res.success) {
      throw new Error(res.message || 'Profile update failed');
    }

    const updated = res.data;
    setUser(updated);
    localStorage.setItem('jansahayak_user', JSON.stringify(updated));
    return updated;
  };

  const changePassword = async ({ current_password, new_password, confirm_password }) => {
    const res = await api.post('/profile/change-password', {
      current_password,
      new_password,
      confirm_password
    });
    if (!res.success) {
      throw new Error(res.message || 'Password update failed');
    }
    return res;
  };

  const switchRole = async (targetRole) => {
    const res = await api.post('/auth/switch-role', { target_role: targetRole });
    if (!res.success) {
      throw new Error(res.message || 'Role switch failed');
    }

    const updatedUser = res.data.user;
    setUser(updatedUser);
    setRole(targetRole);
    localStorage.setItem('jansahayak_user', JSON.stringify(updatedUser));
    localStorage.setItem('jansahayak_role', targetRole);
    return updatedUser;
  };

  const loginWithGoogle = async (googleData = null, turnstileToken = null) => {
    try {
      setLoading(true);

      // If Supabase configured, attempt Supabase OAuth
      if (isSupabaseConfigured && supabase && !googleData) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin + '/citizen/dashboard'
          }
        });
        if (error) throw error;
        return;
      }

      // Fast Google Auth via backend endpoint
      const payload = googleData || {
        email: 'abhisingh940927@gmail.com',
        name: 'Abhinav Singh',
        avatar_url: null,
        turnstile_token: turnstileToken
      };

      const res = await api.post('/auth/google', payload);
      if (!res.success) {
        throw new Error(res.message || 'Google authentication failed');
      }

      const authData = res.data;
      if (authData.token) {
        localStorage.setItem('jansahayak_token', authData.token);
      }
      if (authData.user) {
        setUser(authData.user);
        setRole(authData.user.role);
        setAvailableRoles(authData.available_roles || [authData.user.role]);
        localStorage.setItem('jansahayak_user', JSON.stringify(authData.user));
        localStorage.setItem('jansahayak_role', authData.user.role);
        localStorage.setItem('jansahayak_available_roles', JSON.stringify(authData.available_roles || [authData.user.role]));
      }

      return authData;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Signout notice:', e);
      }
    }
    localStorage.removeItem('jansahayak_token');
    localStorage.removeItem('jansahayak_user');
    localStorage.removeItem('jansahayak_role');
    localStorage.removeItem('jansahayak_demo_role');
    localStorage.removeItem('jansahayak_available_roles');
    setUser(null);
    setRole('citizen');
    setAvailableRoles([]);
  };

  const switchDemoRole = async (newRole) => {
    setRole(newRole);
    localStorage.setItem('jansahayak_demo_role', newRole);
    localStorage.setItem('jansahayak_role', newRole);
    try {
      const res = await api.get('/profile');
      if (res.success && res.data) {
        setUser(res.data);
        localStorage.setItem('jansahayak_user', JSON.stringify(res.data));
      }
    } catch {
      // Ignore in demo switch
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        availableRoles,
        loading,
        login,
        loginWithGoogle,
        register,
        updateProfile,
        changePassword,
        switchRole,
        logout,
        switchDemoRole,
        language,
        setLanguage
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
