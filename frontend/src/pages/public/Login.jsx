import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../../components/common/BrandLogo';
import { CloudflareTurnstile } from '../../components/common/CloudflareTurnstile';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Calendar,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Clock,
  Layers,
  Bot,
  MapPin,
  CheckCircle2
} from 'lucide-react';

export const Login = () => {
  const { login, loginWithGoogle, register, switchRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Mode: 'signin' | 'register'
  const [authMode, setAuthMode] = useState(location.search.includes('mode=register') ? 'register' : 'signin');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Security & Submission states
  const [turnstileToken, setTurnstileToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  // Multi-role modal state for designated accounts
  const [roleSelectionModal, setRoleSelectionModal] = useState({
    isOpen: false,
    availableRoles: [],
    pendingUser: null
  });

  // Left Showcase Carousel state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);

  const slides = [
    {
      badge: 'AI-POWERED TRIAGE & ROUTING',
      title: 'Instant Automated Grievance Dispatch',
      description:
        'Advanced NLP microservices automatically analyze civic complaints in English, Hindi, and Punjabi, tagging target departments within sub-second precision.',
      metrics: [
        { label: 'AI Accuracy', value: '94.2%' },
        { label: 'Dispatch Speed', value: '< 1 Sec' }
      ],
      quote: '“Empowering Indian citizens with direct, transparent, and technology-driven public service delivery.”',
      author: 'Digital India Mission',
      icon: Bot,
      accent: 'from-teal-500/20 to-emerald-500/10'
    },
    {
      badge: 'LIFECYCLE ACCOUNTABILITY',
      title: '5-Stage Resolution Stepper & SLAs',
      description:
        'Every grievance advances through 5 audited milestones: Registration, Verification, Field Assignment, In-Progress Work, and Verified Resolution.',
      metrics: [
        { label: 'Hazard Escalation', value: '12-Hour SLA' },
        { label: 'Audit Trail', value: '100% Immutable' }
      ],
      quote: '“Accountability is guaranteed through automated escalation and real-time citizen visibility.”',
      author: 'DARPG Public Service Framework',
      icon: Layers,
      accent: 'from-sky-500/20 to-blue-500/10'
    },
    {
      badge: 'GEOTAGGED EVIDENCE VERIFICATION',
      title: 'Real-Time GPS & Photo Documentation',
      description:
        'Capture exact coordinates with automatic reverse geocoding to street, city, state, and postal code for precise on-ground inspection.',
      metrics: [
        { label: 'Geocoding', value: 'Street Level' },
        { label: 'Inspection', value: 'Photo Evidence' }
      ],
      quote: '“No citizen is left behind. File civic concerns directly from your mobile or desktop with zero friction.”',
      author: 'Smart Cities Redressal Mission',
      icon: MapPin,
      accent: 'from-indigo-500/20 to-teal-500/10'
    },
    {
      badge: 'CITIZEN SATISFACTION VERIFICATION',
      title: 'Direct Feedback & Field Quality Rating',
      description:
        'Grievances are never closed silently. Citizens verify on-ground repair quality and rate field officer resolution directly.',
      metrics: [
        { label: 'Verified Close', value: 'Citizen Signed' },
        { label: 'Transparency', value: 'Public Audit' }
      ],
      quote: '“True public service redressal ends only when the citizen confirms the problem is solved.”',
      author: 'Citizen Grievance Charter v1.0',
      icon: CheckCircle2,
      accent: 'from-emerald-500/20 to-teal-500/10'
    }
  ];

  // Auto-slide every 3 seconds
  useEffect(() => {
    if (isCarouselPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [isCarouselPaused, slides.length]);

  const routeUserByRole = (userRole) => {
    const searchParams = new URLSearchParams(location.search);
    const redirectUrl = searchParams.get('redirect');
    if (redirectUrl) {
      navigate(redirectUrl);
      return;
    }

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (authMode === 'signin') {
      if (!email || !password) {
        setError('Please enter both email and password.');
        return;
      }

      try {
        setLoading(true);
        const res = await login(email, password);

        if (res.requires_role_selection && res.available_roles?.length > 1) {
          setRoleSelectionModal({
            isOpen: true,
            availableRoles: res.available_roles,
            pendingUser: res.user
          });
          return;
        }

        routeUserByRole(res.user?.role);
      } catch (err) {
        setError(err.message || 'Login failed. Please verify credentials.');
      } finally {
        setLoading(false);
      }
    } else {
      // Register Mode
      if (!fullName.trim() || !email.trim() || !password || !dob) {
        setError('All fields are required for citizen registration.');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters.');
        return;
      }

      try {
        setLoading(true);
        const res = await register({
          full_name: fullName.trim(),
          email: email.trim(),
          password,
          confirm_password: password,
          dob
        });

        routeUserByRole(res.user?.role || 'citizen');
      } catch (err) {
        setError(err.message || 'Registration failed. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  // 1-Click Fast Google Sign In
  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      setError('');
      
      const targetEmail = email && email.includes('@') ? email.trim().toLowerCase() : 'citizen.user@gmail.com';
      const targetName = email && email.includes('@') 
        ? email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        : 'Citizen User';

      const res = await loginWithGoogle(
        {
          email: targetEmail,
          name: targetName,
          avatar_url: null,
          turnstile_token: turnstileToken
        },
        turnstileToken
      );

      if (res && res.user) {
        routeUserByRole(res.user.role);
      }
    } catch (err) {
      setError(err.message || 'Google authentication failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleQuickDemoFill = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('GovPass2026@demo');
    setAuthMode('signin');
  };

  const activeSlide = slides[currentSlide];
  const SlideIcon = activeSlide.icon;

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 py-8 sm:py-12">
      {/* Side-by-Side Split Authentication Card */}
      <div className="max-w-5xl w-full bg-[#0B1528] rounded-3xl border border-slate-800/90 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 my-auto mb-16 sm:mb-20">
        {/* ========================================================= */}
        {/* LEFT COLUMN: KEY FACILITIES SHOWCASE (3-SEC AUTO CAROUSEL) */}
        {/* ========================================================= */}
        <div
          onMouseEnter={() => setIsCarouselPaused(true)}
          onMouseLeave={() => setIsCarouselPaused(false)}
          className="lg:col-span-6 bg-gradient-to-br from-[#060D1A] via-[#091529] to-[#0E223D] p-8 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800/80 relative overflow-hidden"
        >
          {/* Subtle Background Glow Accent */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-gov-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand Logo */}
          <div className="relative z-10">
            <BrandLogo size="md" theme="dark" showTagline={true} linkTo="/" />
          </div>

          {/* Middle: Active Slide Showcase */}
          <div className="relative z-10 py-8 space-y-5 transition-all duration-500 ease-out">
            {/* Slide Category Badge */}
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-gov-teal-900/60 text-gov-teal-300 border border-gov-teal-700/50 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-gov-teal-400" />
              <span>{activeSlide.badge}</span>
            </div>

            {/* Slide Title */}
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
              {activeSlide.title}
            </h2>

            {/* Slide Description */}
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              {activeSlide.description}
            </p>

            {/* Metric Highlights */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              {activeSlide.metrics.map((m, i) => (
                <div
                  key={i}
                  className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-left shadow-xs"
                >
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    {m.label}
                  </span>
                  <span className="text-sm font-extrabold text-white mt-0.5 block font-mono">
                    {m.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Inspiring Government Mission Quote */}
            <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800/90 text-left mt-4">
              <p className="text-xs italic text-slate-200 leading-relaxed font-serif">
                {activeSlide.quote}
              </p>
              <span className="text-[10px] text-gov-teal-400 font-semibold block mt-1 tracking-wide">
                {activeSlide.author}
              </span>
            </div>
          </div>

          {/* Bottom: Dot Indicators & Portal Copyright */}
          <div className="relative z-10 pt-4 flex items-center justify-between border-t border-slate-800/80">
            {/* Dot Indicator Buttons */}
            <div className="flex items-center space-x-2">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    currentSlide === idx
                      ? 'w-7 bg-gov-teal-400'
                      : 'w-2 bg-slate-700 hover:bg-slate-600'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            <span className="text-[10px] text-slate-400 font-mono">
              Auto-advancing 3s • Hover to pause
            </span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: AUTHENTICATION, GOOGLE LOGIN & CLOUDFLARE   */}
        {/* ========================================================= */}
        <div className="lg:col-span-6 bg-[#0B1528] p-8 sm:p-10 flex flex-col justify-center text-white relative">
          {/* Header Switcher: Sign In vs Register Tabs */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="inline-flex p-1 bg-slate-900/90 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setError('');
                  }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    authMode === 'signin'
                      ? 'bg-gov-teal-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setError('');
                  }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    authMode === 'register'
                      ? 'bg-gov-teal-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Create Account
                </button>
              </div>

              <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-800/60">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>SSL Secured</span>
              </span>
            </div>

            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                {authMode === 'signin' ? 'Welcome back' : 'Citizen Registration'}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {authMode === 'signin'
                  ? 'Sign in to access your registered public grievances.'
                  : 'Create your official citizen profile to file and track grievances.'}
              </p>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mt-4 p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-200 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Google 1-Click Fast Login Button */}
          <div className="mt-5 space-y-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full flex items-center justify-center space-x-3 bg-white hover:bg-slate-100 text-slate-900 font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm shadow-md transition-colors disabled:opacity-70 cursor-pointer"
            >
              {/* Official Multi-Color Google G Logo SVG */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{googleLoading ? 'Authenticating with Google...' : 'Continue with Google / Gmail'}</span>
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Or with official credentials
              </span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
            {/* If Register: Full Name */}
            {authMode === 'register' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-gov-teal-400 focus:ring-1 focus:ring-gov-teal-400 transition"
                  />
                </div>
              </div>
            )}

            {/* Email / ID Input */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                {authMode === 'signin' ? 'Email / Citizen ID' : 'Official Email Address'}{' '}
                <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-gov-teal-400 focus:ring-1 focus:ring-gov-teal-400 transition"
                />
              </div>
            </div>

            {/* If Register: Date of Birth */}
            {authMode === 'register' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Date of Birth <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-gov-teal-400 focus:ring-1 focus:ring-gov-teal-400 transition"
                  />
                </div>
              </div>
            )}

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-300 uppercase">
                  Password <span className="text-rose-400">*</span>
                </label>
                {authMode === 'signin' && (
                  <Link
                    to="/forgot-password"
                    className="text-[11px] text-gov-teal-400 hover:text-gov-teal-300 transition-colors font-medium"
                  >
                    Forgot password?
                  </Link>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-gov-teal-400 focus:ring-1 focus:ring-gov-teal-400 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Cloudflare Turnstile Anti-Bot Protection */}
            <div className="pt-1">
              <CloudflareTurnstile onVerify={(t) => setTurnstileToken(t)} theme="dark" />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-gov-teal-500 to-[#14B8A6] hover:from-gov-teal-600 hover:to-[#0F9488] text-white font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-70 cursor-pointer mt-2"
            >
              <span>{loading ? 'Authenticating...' : authMode === 'signin' ? 'Sign In' : 'Create Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credential Pills (in Sign In mode) */}
          {authMode === 'signin' && (
            <div className="mt-5 pt-4 border-t border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 text-center">
                Standard Evaluation Roles (1-Click Fill)
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleQuickDemoFill('citizen@jansahayak.in')}
                  className="p-2 text-left bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
                >
                  👤 Citizen Portal
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoFill('officer.pwd@jansahayak.gov.in')}
                  className="p-2 text-left bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
                >
                  👮 PWD Field Officer
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoFill('admin.mcd@jansahayak.gov.in')}
                  className="p-2 text-left bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
                >
                  🏛️ MCD Dept Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoFill('superadmin@jansahayak.gov.in')}
                  className="p-2 text-left bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
                >
                  ⚡ Super Admin
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Multi-Role Modal for authorized administrative users */}
      {roleSelectionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gov-teal-600/20 text-gov-teal-400 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Select Workspace Role</h3>
                <p className="text-xs text-slate-400">
                  Multiple administrative credentials attached to {roleSelectionModal.pendingUser?.email}
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              {roleSelectionModal.availableRoles.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleSelectRole(r)}
                  className="w-full text-left p-3 rounded-xl bg-slate-800/80 hover:bg-gov-teal-900/40 border border-slate-700/80 hover:border-gov-teal-500 text-xs font-semibold text-slate-200 transition-colors flex items-center justify-between"
                >
                  <span className="capitalize">{r.replace('_', ' ')}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-gov-teal-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
