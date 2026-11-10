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
  ChevronDown,
  User
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
        <Link
          to="/"
          className="flex items-center space-x-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F9488] rounded-lg py-1"
          aria-label="JanSahayak AI Home"
        >
          {/* Modern Government-Grade Vector Emblem */}
          <div className="relative shrink-0 group-hover:scale-105 transition-transform duration-200">
            <svg
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-10 h-10 drop-shadow-sm"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="navLogoShieldGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#0B1730" />
                  <stop offset="100%" stopColor="#122440" />
                </linearGradient>
                <linearGradient id="navLogoTealGrad" x1="10" y1="6" x2="30" y2="34" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#2DD4BF" />
                  <stop offset="100%" stopColor="#0F9488" />
                </linearGradient>
                <linearGradient id="navLogoGlow" x1="20" y1="8" x2="20" y2="32" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#0F9488" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Protective Shield Base */}
              <path
                d="M20 2.5C28 5.5 35.5 5 35.5 12C35.5 24 27 34.5 20 38.5C13 34.5 4.5 24 4.5 12C4.5 5 12 5.5 20 2.5Z"
                fill="url(#navLogoShieldGrad)"
                stroke="#1E3A5F"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />

              {/* Inner Subtle Contour */}
              <path
                d="M20 5C26.5 7.5 32.5 7 32.5 13C32.5 22.5 25.5 31 20 35C14.5 31 7.5 22.5 7.5 13C7.5 7 13.5 7.5 20 5Z"
                fill="url(#navLogoGlow)"
                stroke="url(#navLogoTealGrad)"
                strokeWidth="0.8"
                strokeOpacity="0.4"
              />

              {/* Citizen Care Supportive Arch (Public Service & Support) */}
              <path
                d="M13.5 25C13.5 19 16.5 15.5 20 15.5C23.5 15.5 26.5 19 26.5 25"
                stroke="white"
                strokeWidth="2.2"
                strokeLinecap="round"
              />

              {/* Central Civic Pillar */}
              <path
                d="M20 17.5V28"
                stroke="url(#navLogoTealGrad)"
                strokeWidth="2.2"
                strokeLinecap="round"
              />

              {/* Neural AI Innovation Star (Intelligent Assistance) */}
              <path
                d="M20 8.5L21.3 11.7L24.5 13L21.3 14.3L20 17.5L18.7 14.3L15.5 13L18.7 11.7L20 8.5Z"
                fill="url(#navLogoTealGrad)"
              />

              {/* Interconnected Civic Data Nodes */}
              <circle cx="13.5" cy="25" r="1.8" fill="#2DD4BF" />
              <circle cx="26.5" cy="25" r="1.8" fill="#2DD4BF" />
              <circle cx="20" cy="28" r="1.8" fill="white" />
            </svg>
          </div>

          {/* Typography & Brand Hierarchy */}
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-[19px] font-black text-[#0B1730] tracking-tight group-hover:text-[#0F9488] transition-colors">
                JanSahayak
              </span>
              <span className="inline-flex items-center justify-center bg-gradient-to-r from-[#0F9488] to-[#14B8A6] text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-xs tracking-wider uppercase">
                AI
              </span>
            </div>
            <div className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase mt-1">
              Smart Grievance Redressal Platform
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
            <div className="flex items-center space-x-2">
              <Link
                to={getDashboardPath()}
                className="inline-flex items-center space-x-2 bg-gov-navy-900 hover:bg-gov-navy-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm"
              >
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover border border-gov-teal-400" />
                ) : (
                  <span className="w-5 h-5 rounded-full bg-gov-teal-600 text-white text-[10px] flex items-center justify-center font-bold">
                    {user.full_name ? user.full_name.charAt(0) : 'U'}
                  </span>
                )}
                <span>{user.full_name?.split(' ')[0] || 'Dashboard'}</span>
              </Link>
              <Link
                to="/profile"
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
                title="Account Profile"
              >
                <User className="w-4 h-4 text-gov-teal-700" />
              </Link>
            </div>
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
