import React, { useState, useEffect } from 'react';
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
  Globe,
  Check,
  ChevronDown
} from 'lucide-react';

export const Navbar = () => {
  const { user, role, switchDemoRole, logout, language, setLanguage } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  // Determine if Demo Role selector should be displayed:
  // Visible in dev environment, or when ?demo=true in URL, or when toggled in localStorage
  const [showDemoRole, setShowDemoRole] = useState(
    import.meta.env.DEV ||
    localStorage.getItem('jansahayak_show_demo') === 'true' ||
    location.search.includes('demo=true')
  );

  useEffect(() => {
    if (location.search.includes('demo=true')) {
      localStorage.setItem('jansahayak_show_demo', 'true');
      setShowDemoRole(true);
    }
  }, [location.search]);

  const toggleDemoMode = () => {
    const nextState = !showDemoRole;
    setShowDemoRole(nextState);
    if (nextState) {
      localStorage.setItem('jansahayak_show_demo', 'true');
    } else {
      localStorage.removeItem('jansahayak_show_demo');
    }
  };

  const getDashboardPath = () => {
    if (role === 'officer') return '/officer/dashboard';
    if (role === 'department_admin' || role === 'super_admin') return '/admin/dashboard';
    return '/citizen/dashboard';
  };

  const languages = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
    { code: 'pa', label: 'Punjabi', native: 'ਪੰਜਾਬੀ' }
  ];

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'How It Works', path: '/how-it-works' },
    { name: 'Departments', path: '/departments' },
    { name: 'Track Grievance', path: '/track' }
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Official Government Portal Banner */}
      <div className="bg-gov-navy-900 text-slate-300 text-xs py-1.5 px-3 sm:px-8 border-b border-gov-navy-800">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          {/* Left: Official Identity */}
          <div className="flex items-center space-x-2 min-w-0">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse"></span>
            <span className="text-[11px] sm:text-xs text-slate-300 font-medium truncate">
              <span className="hidden sm:inline">Official Smart Grievance Redressal Portal • </span>
              <button
                type="button"
                onClick={toggleDemoMode}
                title="Click to toggle developer evaluation role bar"
                className="hover:text-gov-teal-400 transition-colors text-slate-400 font-mono text-[10px]"
              >
                JanSahayak AI v1.0
              </button>
            </span>
          </div>

          {/* Right: Language Selector + Conditional Demo Role Switcher */}
          <div className="flex items-center space-x-3 shrink-0">
            {/* Interactive Language Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="inline-flex items-center space-x-1.5 text-[11px] font-semibold text-slate-200 hover:text-white bg-gov-navy-800/80 px-2 py-0.5 rounded border border-slate-700/80 focus:outline-none focus:ring-1 focus:ring-gov-teal-400"
                aria-expanded={langMenuOpen}
                aria-label="Select Portal Language"
              >
                <Globe className="w-3.5 h-3.5 text-gov-teal-400" />
                <span>{languages.find(l => l.code === (language || 'en'))?.native}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {langMenuOpen && (
                <div
                  className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50 text-xs text-slate-800"
                  onMouseLeave={() => setLangMenuOpen(false)}
                >
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => {
                        setLanguage(l.code);
                        setLangMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-slate-100 ${
                        language === l.code ? 'font-bold text-gov-teal-700 bg-gov-teal-50/50' : 'text-slate-700'
                      }`}
                    >
                      <span>{l.native}</span>
                      {language === l.code && <Check className="w-3.5 h-3.5 text-gov-teal-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Evaluation Role Switcher (Hidden in ordinary production) */}
            {showDemoRole && (
              <div className="flex items-center space-x-1.5 bg-gov-navy-800 border border-gov-teal-500/40 rounded px-2 py-0.5 animate-fadeIn">
                <span className="text-gov-teal-400 text-[10px] uppercase font-bold tracking-wider hidden md:inline">
                  Eval Role:
                </span>
                <select
                  value={role}
                  onChange={(e) => switchDemoRole(e.target.value)}
                  className="bg-transparent text-[11px] text-white font-medium focus:outline-none cursor-pointer"
                  aria-label="Evaluation Role Switcher"
                >
                  <option value="citizen" className="bg-gov-navy-900 text-white">👤 Citizen</option>
                  <option value="officer" className="bg-gov-navy-900 text-white">👮 Field Officer</option>
                  <option value="department_admin" className="bg-gov-navy-900 text-white">🏛️ Dept Admin</option>
                  <option value="super_admin" className="bg-gov-navy-900 text-white">⚡ Super Admin</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center space-x-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-gov-teal-500 rounded-lg">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gov-navy-900 to-gov-navy-800 flex items-center justify-center text-gov-teal-400 shadow-md group-hover:scale-105 transition-all">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="text-lg font-black text-gov-navy-900 tracking-tight flex items-center gap-1.5">
              JanSahayak
              <span className="text-gov-teal-700 bg-gov-teal-50 text-[11px] px-2 py-0.5 rounded-full border border-gov-teal-200 font-extrabold">
                AI
              </span>
            </div>
            <div className="text-[10px] text-slate-500 font-semibold tracking-wide">
              Smart Public Service Management
            </div>
          </div>
        </Link>

        {/* Desktop Links */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2" aria-label="Main Navigation">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  isActive
                    ? 'text-gov-navy-900 bg-slate-100 font-bold'
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
            className="inline-flex items-center space-x-1.5 bg-gov-teal-600 hover:bg-gov-teal-700 active:bg-gov-teal-800 text-white text-sm font-bold px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>File Grievance</span>
          </Link>

          {user ? (
            <Link
              to={getDashboardPath()}
              className="inline-flex items-center space-x-1.5 bg-gov-navy-900 hover:bg-gov-navy-800 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all shadow-sm"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center space-x-1.5 border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-bold px-4 py-2 rounded-xl transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>Login</span>
            </Link>
          )}
        </div>

        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-gov-teal-500"
          aria-expanded={mobileMenuOpen}
          aria-label="Toggle Mobile Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg animate-fadeIn">
          {/* Mobile Language Selector */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
            <span className="text-slate-500 font-semibold flex items-center space-x-1.5">
              <Globe className="w-4 h-4 text-gov-teal-600" />
              <span>Language / भाषा:</span>
            </span>
            <div className="flex space-x-1">
              {languages.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLanguage(l.code)}
                  className={`px-2 py-1 rounded text-xs font-bold transition-all ${
                    language === l.code
                      ? 'bg-gov-teal-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {l.native}
                </button>
              ))}
            </div>
          </div>

          <nav className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-base font-semibold text-slate-800 hover:bg-slate-100"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
            <Link
              to="/citizen/file-complaint"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center bg-gov-teal-600 text-white font-bold py-2.5 rounded-xl shadow-sm text-sm"
            >
              File Grievance
            </Link>
            <Link
              to={getDashboardPath()}
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center bg-gov-navy-900 text-white font-bold py-2.5 rounded-xl shadow-sm text-sm"
            >
              {user ? 'Go to Dashboard' : 'Citizen Login'}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
