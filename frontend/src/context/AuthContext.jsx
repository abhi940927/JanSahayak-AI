import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { supabase, isSupabaseConfigured } from '../services/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(localStorage.getItem('jansahayak_demo_role') || 'citizen');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, [role]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      if (isSupabaseConfigured && supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          localStorage.setItem('jansahayak_token', session.access_token);
        }
      }

      const res = await api.get('/profile');
      if (res.success && res.data) {
        setUser(res.data);
        setRole(res.data.role);
      }
    } catch (err) {
      console.warn('[AuthContext] Profile load notice:', err.message);
      // Fallback default state for demo
      setUser({
        id: 'u0eebc99-9c0b-4ef8-bb6d-6bb9bd380u01',
        email: 'citizen@jansahayak.in',
        full_name: 'Aarav Sharma',
        role: role,
        designation: 'Citizen / Resident'
      });
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      localStorage.setItem('jansahayak_token', data.session.access_token);
      await loadUserProfile();
      return data;
    }

    // Demo authentication
    let assignedRole = 'citizen';
    if (email.includes('officer')) assignedRole = 'officer';
    if (email.includes('dept') || email.includes('mcd')) assignedRole = 'department_admin';
    if (email.includes('admin') || email.includes('super')) assignedRole = 'super_admin';

    setRole(assignedRole);
    localStorage.setItem('jansahayak_demo_role', assignedRole);
    await loadUserProfile();
    return { user: { email, role: assignedRole } };
  };

  const register = async (userData) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.full_name,
            phone_number: userData.phone_number
          }
        }
      });
      if (error) throw error;
      return data;
    }

    // Demo register
    setRole('citizen');
    localStorage.setItem('jansahayak_demo_role', 'citizen');
    await loadUserProfile();
    return { success: true };
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('jansahayak_token');
    localStorage.removeItem('jansahayak_demo_role');
    setUser(null);
    setRole('citizen');
  };

  const switchDemoRole = (newRole) => {
    setRole(newRole);
    localStorage.setItem('jansahayak_demo_role', newRole);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, login, register, logout, switchDemoRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
