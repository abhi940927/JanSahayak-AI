import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, LogIn, Lock, Mail, AlertCircle } from 'lucide-react';

export const Login = () => {
  const { login, role } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await login(email, password);

      // Route based on role
      const userRole = res.user?.role || role;
      if (userRole === 'officer') {
        navigate('/officer/dashboard');
      } else if (userRole === 'department_admin' || userRole === 'super_admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/citizen/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoFill = (demoEmail, demoRole) => {
    setEmail(demoEmail);
    setPassword('GovPass2026@demo');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gov-navy-900 text-gov-teal-500 mx-auto flex items-center justify-center shadow-md">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-gov-navy-900 tracking-tight">
            Sign In to JanSahayak
          </h1>
          <p className="text-xs text-slate-500">
            Citizen & Government Officer Unified Access Portal
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="citizen@jansahayak.in"
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gov-teal-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gov-teal-500 focus:bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gov-navy-900 hover:bg-gov-navy-800 text-white font-bold py-2.5 rounded-lg text-sm shadow transition-colors flex items-center justify-center space-x-2"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
          </button>
        </form>

        {/* Quick Demo Credential Pills */}
        <div className="pt-4 border-t border-slate-100">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
            Quick 1-Click Evaluation Accounts
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => handleQuickDemoFill('citizen@jansahayak.in', 'citizen')}
              className="p-2 text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded font-medium text-slate-700"
            >
              👤 Citizen (Aarav)
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoFill('officer.pwd@jansahayak.gov.in', 'officer')}
              className="p-2 text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded font-medium text-slate-700"
            >
              👮 PWD Field Officer
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoFill('admin.mcd@jansahayak.gov.in', 'department_admin')}
              className="p-2 text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded font-medium text-slate-700"
            >
              🏛️ MCD Dept Admin
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoFill('superadmin@jansahayak.gov.in', 'super_admin')}
              className="p-2 text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded font-medium text-slate-700"
            >
              ⚡ Super Admin
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-slate-500">
          New citizen?{' '}
          <Link to="/register" className="font-semibold text-gov-teal-700 hover:underline">
            Register your account
          </Link>
        </div>
      </div>
    </div>
  );
};
