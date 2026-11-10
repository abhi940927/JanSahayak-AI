import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldAlert,
  Search,
  PlusCircle,
  LogIn,
  LayoutDashboard,
  Menu,
  X,
  UserCheck
} from 'lucide-react';

export const Navbar = () => {
  const { user, role, switchDemoRole, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getDashboardPath = () => {
    if (role === 'officer') return '/officer/dashboard';
    if (role === 'department_admin' || role === 'super_admin') return '/admin/dashboard';
    return '/citizen/dashboard';
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'How It Works', path: '/how-it-works' },
    { name: 'Departments', path: '/departments' },
    { name: 'Track Grievance', path: '/track' }
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
      {/* Official Government Portal Banner */}
      <div className="bg-gov-navy-900 text-slate-300 text-xs py-1 px-4 sm:px-8 flex justify-between items-center border-b border-gov-navy-800">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Official Public Service Redressal Portal • JanSahayak AI v1.0</span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-slate-400">Demo Role:</span>
          <select
            value={role}
            onChange={(e) => switchDemoRole(e.target.value)}
            className="bg-gov-navy-800 text-xs text-white border border-slate-700 rounded px-2 py-0.5 focus:outline-none focus:border-gov-teal-500"
          >
            <option value="citizen">👤 Citizen (Aarav)</option>
            <option value="officer">👮 Field Officer (PWD)</option>
            <option value="department_admin">🏛️ Dept Admin (MCD)</option>
            <option value="super_admin">⚡ Super Admin</option>
          </select>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-lg bg-gov-navy-900 flex items-center justify-center text-gov-teal-500 shadow-md group-hover:scale-105 transition-transform">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="text-lg font-extrabold text-gov-navy-900 tracking-tight flex items-center gap-1.5">
              JanSahayak <span className="text-gov-teal-600 bg-gov-teal-50 text-xs px-2 py-0.5 rounded-full border border-gov-teal-200 font-bold">AI</span>
            </div>
            <div className="text-[10px] text-slate-500 font-medium tracking-wide">
              Smart Grievance Redressal Platform
            </div>
          </div>
        </Link>

        {/* Desktop Links */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-3">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-gov-navy-900 bg-slate-100 font-semibold'
                    : 'text-slate-600 hover:text-gov-navy-900 hover:bg-slate-50'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Action CTAs */}
        <div className="hidden md:flex items-center space-x-3">
          <Link
            to="/citizen/file-complaint"
            className="inline-flex items-center space-x-1.5 bg-gov-teal-600 hover:bg-gov-teal-700 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>File Grievance</span>
          </Link>

          {user ? (
            <Link
              to={getDashboardPath()}
              className="inline-flex items-center space-x-1.5 bg-gov-navy-900 hover:bg-gov-navy-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center space-x-1.5 border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>Login</span>
            </Link>
          )}
        </div>

        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-100"
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <Link
              to="/citizen/file-complaint"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center bg-gov-teal-600 text-white font-medium py-2 rounded-lg"
            >
              File Grievance
            </Link>
            <Link
              to={getDashboardPath()}
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center bg-gov-navy-900 text-white font-medium py-2 rounded-lg"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
