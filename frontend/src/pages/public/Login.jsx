import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../../components/common/BrandLogo';
import {
  ShieldAlert,
  LogIn,
  Lock,
  Mail,
  AlertCircle,
  ShieldCheck,
  Building,
  User,
  ArrowRight
} from 'lucide-react';

export const Login = () => {
  const { login, switchRole } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Multi-role selection dialog state for designated multi-role accounts (e.g. abhisingh940927@gmail.com)
  const [roleSelectionModal, setRoleSelectionModal] = useState({
    isOpen: false,
    availableRoles: [],
    pendingUser: null
  });

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

      if (res.requires_role_selection && res.available_roles?.length > 1) {
        setRoleSelectionModal({
          isOpen: true,
          availableRoles: res.available_roles,
          pendingUser: res.user
        });
        return;
      }

      // Route based on authenticated role
      routeUserByRole(res.user?.role);
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const routeUserByRole = (userRole) => {
    if (userRole === 'officer') {
      navigate('/officer/dashboard');
    } else if (userRole === 'department_admin' || userRole === 'super_admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/citizen/dashboard');
    }
  };

  const handleSelectRole = async (selectedRole) => {
    try {
      setLoading(true);
      await switchRole(selectedRole);
      setRoleSelectionModal({ isOpen: false, availableRoles: [], pendingUser: null });
      routeUserByRole(selectedRole);
    } catch (err) {
      setError(err.message || 'Failed to initialize role session');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoFill = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('GovPass2026@demo');
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-1">
            <BrandLogo size="md" showTagline={false} linkTo="/" />
          </div>
          <h1 className="text-2xl font-black text-gov-navy-900 tracking-tight">
            Sign In to JanSahayak
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Citizen & Government Officer Unified Digital Service Portal
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="citizen.name@example.com"
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gov-teal-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
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
            className="w-full bg-gov-navy-900 hover:bg-gov-navy-800 text-white font-bold py-2.5 rounded-xl text-sm shadow transition-colors flex items-center justify-center space-x-2"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
          </button>
        </form>

        {/* Quick Demo Credential Pills */}
        <div className="pt-4 border-t border-slate-100">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
            Standard Evaluation Roles
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => handleQuickDemoFill('citizen@jansahayak.in')}
              className="p-2 text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded font-medium text-slate-700"
            >
              👤 Citizen Portal
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoFill('officer.pwd@jansahayak.gov.in')}
              className="p-2 text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded font-medium text-slate-700"
            >
              👮 PWD Field Officer
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoFill('admin.mcd@jansahayak.gov.in')}
              className="p-2 text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded font-medium text-slate-700"
            >
              🏛️ MCD Dept Admin
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoFill('superadmin@jansahayak.gov.in')}
              className="p-2 text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded font-medium text-slate-700"
            >
              ⚡ Super Admin
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-slate-500">
          New citizen?{' '}
          <Link to="/register" className="font-semibold text-gov-teal-700 hover:underline">
            Register your official account
          </Link>
        </div>
      </div>

      {/* Multi-Role Portal Selection Modal */}
      {roleSelectionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="max-w-md w-full bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-xl bg-gov-navy-900 text-gov-teal-400 mx-auto flex items-center justify-center shadow">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-gov-navy-900">
                Select Active Administration Portal
              </h3>
              <p className="text-xs text-slate-500">
                Logged in as <strong>{roleSelectionModal.pendingUser?.full_name}</strong>. Your account holds multiple authorized administrative credentials.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              {roleSelectionModal.availableRoles.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleSelectRole(r)}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-gov-teal-500 hover:bg-gov-teal-50/50 transition-all text-left group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-lg bg-gov-navy-800 text-white flex items-center justify-center font-bold text-sm">
                      {r === 'super_admin' ? '⚡' : '🏛️'}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gov-navy-900 capitalize">
                        {r.replace('_', ' ')} Console
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {r === 'super_admin' ? 'Full platform governance & telemetry' : 'Department-level dispatch & monitoring'}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-gov-teal-600 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
