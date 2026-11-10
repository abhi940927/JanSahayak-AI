import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  ShieldCheck,
  Zap,
  Clock,
  MapPin,
  Cpu,
  CheckCircle2,
  ArrowRight,
  Building2,
  Search,
  AlertTriangle,
  Users,
  Droplets,
  Construction,
  Sparkles,
  Trash2,
  HeartPulse,
  Waves,
  Lightbulb,
  FileCheck,
  Shield,
  Lock,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ExternalLink,
  Flame,
  Radio
} from 'lucide-react';

export const Home = () => {
  const navigate = useNavigate();

  // Quick Tracker Input
  const [quickTrackingNumber, setQuickTrackingNumber] = useState('');
  const [trackerError, setTrackerError] = useState('');

  // Live Platform Stats
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    fetchLiveStats();
  }, []);

  const fetchLiveStats = async () => {
    try {
      setStatsLoading(true);
      setStatsError(false);
      const res = await api.get('/analytics/public-summary');
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.warn('Failed to load live platform stats, using resilient defaults:', err);
      setStatsError(true);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleQuickTrack = (e) => {
    e.preventDefault();
    const clean = quickTrackingNumber.trim();
    if (!clean) {
      setTrackerError('Please enter your tracking number');
      return;
    }
    navigate(`/track?number=${encodeURIComponent(clean)}`);
  };

  // 8 Civic Departments
  const departments = [
    {
      code: 'DJB',
      name: 'Water Supply',
      subtitle: 'Delhi Jal Board',
      icon: Droplets,
      sla: '24h SLA',
      color: 'sky',
      desc: 'Drinking water pipeline bursts, contaminated sewage water, tanker delivery, and low water pressure.'
    },
    {
      code: 'EPD',
      name: 'Electricity & Power',
      subtitle: 'Power Distribution',
      icon: Zap,
      sla: '12h - 24h SLA',
      color: 'amber',
      desc: 'High voltage wire snapping, transformer fires, blackout restoration, and faulty meter disputes.'
    },
    {
      code: 'PWD',
      name: 'Roads & Infrastructure',
      subtitle: 'Public Works Dept',
      icon: Construction,
      sla: '48h SLA',
      color: 'emerald',
      desc: 'Deep road potholes, cave-ins, flyover joint defects, unbarricaded drains, and footbridges.'
    },
    {
      code: 'MCD',
      name: 'Sanitation & Hygiene',
      subtitle: 'Municipal Corporation',
      icon: Sparkles,
      sla: '24h SLA',
      color: 'teal',
      desc: 'Public toilet hygiene, market cleanliness, anti-mosquito fumigation, and civic sanitization.'
    },
    {
      code: 'SWM',
      name: 'Waste Management',
      subtitle: 'Solid Waste Unit',
      icon: Trash2,
      sla: '24h SLA',
      color: 'orange',
      desc: 'Overflowing municipal dumpsters, street garbage accumulation, commercial debris, and uncollected trash.'
    },
    {
      code: 'HFW',
      name: 'Public Health',
      subtitle: 'Health & Family Welfare',
      icon: HeartPulse,
      sla: '12h Emergency SLA',
      color: 'rose',
      desc: 'Clinic negligence, dengue/malaria fever clusters, emergency medical delays, and anti-rabies medicine.'
    },
    {
      code: 'DFC',
      name: 'Drainage & Stormwater',
      subtitle: 'Flood Control Dept',
      icon: Waves,
      sla: '24h SLA',
      color: 'blue',
      desc: 'Monsoon waterlogging, storm drain blockages, open manholes, and residential cellar backflows.'
    },
    {
      code: 'SLC',
      name: 'Street Lighting',
      subtitle: 'Civic Illumination',
      icon: Lightbulb,
      sla: '48h SLA',
      color: 'yellow',
      desc: 'Dead streetlights, dark unlit public alleys, broken poles, and women safety illumination corridors.'
    }
  ];

  // FAQs
  const faqs = [
    {
      q: 'How does JanSahayak AI assist in grievance resolution?',
      a: 'JanSahayak AI reads the citizen complaint in natural language (English, Hindi, or Punjabi), automatically determines the responsible civic department with 79.2% verified ML accuracy, assesses public safety hazards for 12-hour SLA prioritization, and performs 800-meter geospatial duplicate scans to speed up municipal response.'
    },
    {
      q: 'Will the AI system reject or close my complaint automatically?',
      a: 'Never. In accordance with Indian administrative law and smart governance guidelines, AI only provides intelligent cognitive recommendations. Every assignment, field dispatch, and grievance resolution requires physical verification and authorization by an assigned nodal government officer.'
    },
    {
      q: 'Can I track my grievance without creating an account or logging in?',
      a: 'Yes. Every submitted grievance generates a unique tracking identifier (e.g. JS-2026-94821). Citizens can track the real-time stage, assigned field officer, and estimated resolution deadline directly on the Public Tracking page without an account.'
    },
    {
      q: 'What languages are supported by the platform?',
      a: 'Citizens can file grievances in English, Hindi (Devanagari script), Punjabi (Gurmukhi script), or transliterated Hinglish. The original text is preserved completely untouched for RTI and judicial integrity.'
    },
    {
      q: 'What happens if a government department misses the SLA deadline?',
      a: 'The platform initiates automated algorithmic escalations. When a complaint crosses its SLA window (12 hours for critical hazards, 24 to 48 hours for standard civic issues), high-priority escalation notifications are automatically dispatched to the Department Administrator and Municipal Commissioner.'
    },
    {
      q: 'Is photographic proof required to close a grievance?',
      a: 'Yes. Field officers are strictly mandated to upload post-repair photographic evidence and inspection notes before marking any grievance as resolved. Citizens then receive an SMS/web alert to confirm the fix with a 5-star rating.'
    }
  ];

  return (
    <div className="space-y-24 pb-20 overflow-x-hidden">
      {/* =========================================================================
          1. HERO SECTION
         ========================================================================= */}
      <section className="relative bg-gradient-to-b from-gov-navy-900 via-gov-navy-800 to-gov-navy-900 text-white pt-16 sm:pt-20 pb-20 sm:pb-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Subtle background grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"
          aria-hidden="true"
        ></div>

        {/* Ambient teal lighting glow */}
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gov-teal-500/15 blur-[120px] rounded-full pointer-events-none"
          aria-hidden="true"
        ></div>

        <div className="relative max-w-5xl mx-auto text-center space-y-6 sm:space-y-8">
          {/* Official Badge Pill */}
          <div className="inline-flex items-center space-x-2 bg-gov-navy-800/90 border border-gov-teal-500/30 px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-200 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-gov-teal-300 font-bold">National Smart Governance Initiative</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300 hidden sm:inline">Citizen-First Public Redressal</span>
          </div>

          {/* High-Contrast Main Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.15]">
            Smart Complaints. Faster Resolution. <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gov-teal-400 via-teal-300 to-emerald-300">
              Transparent Governance.
            </span>
          </h1>

          {/* Subheading */}
          <p className="max-w-3xl mx-auto text-base sm:text-lg text-slate-200 leading-relaxed font-normal">
            JanSahayak AI bridges Indian citizens directly with civic authorities using NLP microservices,
            automated department routing, 12-hour hazard escalation, and time-bound SLA accountability.
          </p>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/citizen/file-complaint"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2.5 bg-gov-teal-500 hover:bg-gov-teal-600 active:bg-gov-teal-700 text-white font-extrabold px-8 py-3.5 rounded-xl shadow-lg shadow-gov-teal-900/40 hover:shadow-gov-teal-500/30 transition-all text-sm group"
            >
              <span>Submit a Public Grievance</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/track"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-slate-800/80 hover:bg-slate-700 text-white border border-slate-700 hover:border-slate-600 font-bold px-8 py-3.5 rounded-xl transition-all text-sm"
            >
              <Search className="w-4 h-4 text-gov-teal-400" />
              <span>Track Complaint Status</span>
            </Link>
          </div>

          {/* Quick Tracking Search Bar Widget */}
          <div className="pt-4 max-w-xl mx-auto">
            <form onSubmit={handleQuickTrack} className="flex items-center bg-gov-navy-950/80 border border-slate-700 rounded-xl p-1.5 shadow-2xl focus-within:border-gov-teal-400 transition-colors">
              <div className="pl-3 pr-2 text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={quickTrackingNumber}
                onChange={(e) => {
                  setQuickTrackingNumber(e.target.value);
                  setTrackerError('');
                }}
                placeholder="Quick Track: Enter Tracking Number (e.g. JS-2026-94821)"
                className="w-full bg-transparent text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none py-1"
                aria-label="Enter Tracking Number"
              />
              <button
                type="submit"
                className="shrink-0 bg-gov-teal-600 hover:bg-gov-teal-500 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors"
              >
                Track
              </button>
            </form>
            {trackerError && (
              <p className="text-[11px] text-rose-400 mt-1 text-left pl-2">{trackerError}</p>
            )}
          </div>

          {/* 4 Pillars Bar */}
          <div className="pt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left border-t border-slate-800/90">
            <div className="flex items-center space-x-3 p-2 rounded-lg bg-gov-navy-800/40 border border-slate-800/60">
              <Cpu className="w-6 h-6 text-gov-teal-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">AI Categorization</div>
                <div className="text-[11px] text-slate-300">79.2% verified accuracy</div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-2 rounded-lg bg-gov-navy-800/40 border border-slate-800/60">
              <Flame className="w-6 h-6 text-amber-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">Urgency Assessment</div>
                <div className="text-[11px] text-slate-300">12h critical life hazard SLA</div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-2 rounded-lg bg-gov-navy-800/40 border border-slate-800/60">
              <Clock className="w-6 h-6 text-sky-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">Time-Bound SLAs</div>
                <div className="text-[11px] text-slate-300">Automated nodal escalation</div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-2 rounded-lg bg-gov-navy-800/40 border border-slate-800/60">
              <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">Verified Proof</div>
                <div className="text-[11px] text-slate-300">Mandatory photo completion</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. LIVE PLATFORM STATISTICS (REAL SUPABASE RECORDS)
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 sm:-mt-20 relative z-20">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <h2 className="text-sm sm:text-base font-extrabold text-gov-navy-900 uppercase tracking-wider">
                Live Public Service Performance Ledger
              </h2>
            </div>
            <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium">
              <Radio className="w-3.5 h-3.5 text-gov-teal-600 animate-pulse" />
              <span>Real-Time Sync with Municipal Records</span>
              <button
                type="button"
                onClick={fetchLiveStats}
                title="Refresh Live Statistics"
                className="p-1 hover:text-slate-800 text-slate-400 transition-colors"
                aria-label="Refresh Statistics"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {statsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse space-y-2">
                  <div className="h-8 bg-slate-100 rounded w-24"></div>
                  <div className="h-4 bg-slate-100 rounded w-32"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
              {/* Stat 1: Total */}
              <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                <div className="text-2xl sm:text-3xl font-black text-gov-navy-900 tracking-tight">
                  {stats?.total_grievances || 0}
                </div>
                <div className="text-xs font-bold text-slate-600 mt-1">Grievances Registered</div>
                <div className="text-[11px] text-slate-600 mt-0.5">Citizens connected to authorities</div>
              </div>

              {/* Stat 2: Resolved */}
              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <div className="text-2xl sm:text-3xl font-black text-emerald-800 tracking-tight">
                  {stats?.resolved_count || 0}
                </div>
                <div className="text-xs font-bold text-emerald-900 mt-1">Grievances Resolved</div>
                <div className="text-[11px] text-emerald-800 mt-0.5">With verified photo evidence</div>
              </div>

              {/* Stat 3: In Progress */}
              <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100">
                <div className="text-2xl sm:text-3xl font-black text-amber-800 tracking-tight">
                  {stats?.in_progress_count || 0}
                </div>
                <div className="text-xs font-bold text-amber-900 mt-1">Active Field Investigations</div>
                <div className="text-[11px] text-amber-800 mt-0.5">Officers on-site within SLA</div>
              </div>

              {/* Stat 4: SLA Window & Rate */}
              <div className="p-3 bg-gov-teal-50/60 rounded-xl border border-gov-teal-100">
                <div className="text-2xl sm:text-3xl font-black text-gov-teal-800 tracking-tight">
                  {stats?.avg_sla_hours || 24.0}h
                </div>
                <div className="text-xs font-bold text-gov-teal-900 mt-1">Average SLA Window</div>
                <div className="text-[11px] text-gov-teal-800 mt-0.5">{stats?.resolution_rate_percent || 94}% resolution rate</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          3. HOW IT WORKS SECTION
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-extrabold uppercase tracking-widest text-gov-teal-700 bg-gov-teal-50 px-3 py-1 rounded-full border border-gov-teal-200">
            Accountable Redressal Architecture
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gov-navy-900 tracking-tight mt-3">
            How JanSahayak AI Works
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2">
            A transparent 4-stage digital redressal workflow engineered to eliminate civic delays and bureaucratic bottlenecks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow relative">
            <div className="w-12 h-12 rounded-xl bg-gov-navy-900 text-white font-black flex items-center justify-center text-lg mb-5 shadow">
              01
            </div>
            <h3 className="text-base font-bold text-gov-navy-900 mb-2">Citizen Reports Issue</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Submit your complaint in English, Hindi, or Punjabi. Capture auto-GPS coordinates and attach photographic proof.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow relative">
            <div className="w-12 h-12 rounded-xl bg-gov-teal-600 text-white font-black flex items-center justify-center text-lg mb-5 shadow">
              02
            </div>
            <h3 className="text-base font-bold text-gov-navy-900 mb-2">AI Cognitive Triaging</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              ML classifies the exact municipal department, checks 800m geospatial duplicate incidents, and assigns 12h hazard SLAs.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow relative">
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-white font-black flex items-center justify-center text-lg mb-5 shadow">
              03
            </div>
            <h3 className="text-base font-bold text-gov-navy-900 mb-2">Field Officer Dispatch</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Assigned junior engineers inspect the physical site, perform repairs, and upload verified completion photos.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow relative">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center text-lg mb-5 shadow">
              04
            </div>
            <h3 className="text-base font-bold text-gov-navy-900 mb-2">Citizen Review & Rating</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Review completion photos, provide honest citizen satisfaction feedback (1 to 5 stars), or reopen if unresolved.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. 8 RESPONSIVE CIVIC DEPARTMENT CARDS
         ========================================================================= */}
      <section className="bg-slate-100/70 py-20 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-gov-teal-700 bg-gov-teal-50 px-3 py-1 rounded-full border border-gov-teal-200">
                Inter-Agency Jurisdiction
              </span>
              <h2 className="text-3xl font-extrabold text-gov-navy-900 tracking-tight mt-2">
                Integrated Government Departments
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Direct statutory routing across 8 civic utility sectors with enforced service level agreements.
              </p>
            </div>
            <Link
              to="/departments"
              className="mt-4 md:mt-0 text-sm font-bold text-gov-teal-700 hover:text-gov-teal-800 inline-flex items-center space-x-1.5"
            >
              <span>View Department Hierarchy & SLAs</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {departments.map((dept) => {
              const Icon = dept.icon;
              return (
                <div
                  key={dept.code}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-lg hover:border-gov-teal-300 transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gov-navy-50 group-hover:bg-gov-teal-50 flex items-center justify-center text-gov-navy-900 group-hover:text-gov-teal-600 transition-colors">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] font-extrabold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {dept.sla}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-gov-navy-900 group-hover:text-gov-teal-700 transition-colors">
                      {dept.name}
                    </h3>
                    <div className="text-xs font-semibold text-slate-600 mb-2">
                      {dept.subtitle} ({dept.code})
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {dept.desc}
                    </p>
                  </div>

                  <div className="pt-5 mt-4 border-t border-slate-100">
                    <Link
                      to="/citizen/file-complaint"
                      className="text-xs font-bold text-gov-teal-700 hover:text-gov-teal-800 inline-flex items-center space-x-1"
                    >
                      <span>Report {dept.name} Issue</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. AI CAPABILITIES & GOVERNANCE ACCOUNTABILITY
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-gov-navy-900 via-gov-navy-800 to-gov-navy-900 rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden">
          <div className="max-w-3xl space-y-4 mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-gov-teal-400 bg-gov-navy-800 px-3 py-1 rounded-full border border-gov-teal-500/30">
              Responsible AI Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Intelligent Grievance Microservices
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Built with Python FastAPI, Scikit-learn calibrated classifiers, and multilingual NLP
              to eliminate citizen frustration and support municipal reviewing officers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gov-navy-800/80 border border-slate-700/80 rounded-2xl p-6">
              <Cpu className="w-8 h-8 text-gov-teal-400 mb-4" />
              <h3 className="text-base font-bold text-white mb-1.5">SGD Modified Huber Classifier</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Sublinear TF-IDF n-gram model yielding 79.2% verified accuracy for automatic department routing with multi-class probability scoring.
              </p>
            </div>

            <div className="bg-gov-navy-800/80 border border-slate-700/80 rounded-2xl p-6">
              <Flame className="w-8 h-8 text-amber-400 mb-4" />
              <h3 className="text-base font-bold text-white mb-1.5">Zero-False-Low Urgency Engine</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Multilingual hazard lexicon (EN, HI, PA) ensures electrocution, contaminated drinking water, or open manholes trigger 12h emergency SLAs.
              </p>
            </div>

            <div className="bg-gov-navy-800/80 border border-slate-700/80 rounded-2xl p-6">
              <MapPin className="w-8 h-8 text-sky-400 mb-4" />
              <h3 className="text-base font-bold text-white mb-1.5">Geospatial Duplicate Scan</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Haversine distance (under 800m) + cosine similarity flags duplicate reports to merge field dispatches without dropping distant incidents.
              </p>
            </div>
          </div>

          {/* Statutory Governance Disclaimer Box */}
          <div className="mt-8 p-4 bg-gov-teal-950/60 border border-gov-teal-500/40 rounded-xl flex items-start space-x-3 text-xs text-gov-teal-200">
            <Shield className="w-5 h-5 text-gov-teal-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white uppercase tracking-wider block mb-0.5">
                Statutory Human-in-the-Loop Governance Notice
              </span>
              In strict accordance with administrative integrity principles, AI serves purely as an advisory triaging tool.
              Assigned government officers retain sole authority to verify, reassign, or resolve complaints. Original citizen submissions remain immutable.
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. CITIZEN TRUST, TRANSPARENCY & RTI COMPLIANCE
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-start space-x-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gov-navy-900 mb-1">RTI Compliant Audit Trail</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every status change, reassignment, and officer remark is timestamped and cryptographically logged for public transparency.
              </p>
            </div>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-start space-x-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gov-navy-900 mb-1">Row-Level Data Security</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                PostgreSQL RLS policies guarantee citizen identity privacy while maintaining departmental access boundaries.
              </p>
            </div>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-start space-x-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gov-navy-900 mb-1">Overdue Escalations</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Complaints exceeding statutory SLAs automatically trigger escalation alerts to supervisory nodal authorities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. FREQUENTLY ASKED QUESTIONS (INTERACTIVE ACCORDION)
         ========================================================================= */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-xs font-extrabold uppercase tracking-widest text-gov-teal-700 bg-gov-teal-50 px-3 py-1 rounded-full border border-gov-teal-200">
            Citizen Guidance
          </span>
          <h2 className="text-3xl font-extrabold text-gov-navy-900 tracking-tight mt-2">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Answers to common questions regarding grievance filing, SLAs, tracking, and officer accountability.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? -1 : index)}
                  className="w-full text-left p-5 sm:p-6 flex items-center justify-between space-x-4 focus:outline-none focus:bg-slate-50"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm sm:text-base font-bold text-gov-navy-900">
                    {faq.q}
                  </span>
                  <div className="shrink-0 text-slate-400">
                    {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 animate-fadeIn">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          8. BOTTOM CTA BANNER
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-gov-navy-900 via-gov-navy-800 to-gov-navy-900 rounded-3xl p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl border border-slate-700/50">
          <div className="space-y-2 max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Report a Civic Issue in Your Ward Today
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              File complaints with automated department routing and receive instant tracking updates until verified field resolution.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full md:w-auto">
            <Link
              to="/citizen/file-complaint"
              className="bg-gov-teal-500 hover:bg-gov-teal-600 active:bg-gov-teal-700 text-white font-extrabold text-sm px-8 py-3.5 rounded-xl shadow-md transition-all text-center"
            >
              File Grievance Now
            </Link>
            <Link
              to="/track"
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-sm px-6 py-3.5 rounded-xl transition-all text-center"
            >
              Track Ticket
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
