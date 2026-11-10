import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Globe,
  Mail,
  Phone,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-[#0B1730] text-slate-200 border-t border-[#1E293B] mt-auto" role="contentinfo">
      {/* Top National Trust Banner */}
      <div className="border-b border-[#1E293B] bg-[#071022] py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#0F9488] shrink-0 animate-pulse"></span>
            <span className="font-semibold text-slate-200 tracking-wide">
              Official Public Grievance Redressal Architecture • Smart Governance Initiative
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-300">
            <span className="flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3 text-[#0F9488]" />
              <span>RTI Aligned</span>
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-3 h-3 text-[#0F9488]" />
              <span>256-bit Secure</span>
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center space-x-1">
              <Globe className="w-3 h-3 text-[#0F9488]" />
              <span>WCAG 2.1 AA Compliant</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main 4-Column Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-12">
          {/* COLUMN 1 – BRAND & MISSION */}
          <div className="space-y-4">
            <Link to="/" className="inline-flex items-center space-x-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F9488] rounded-lg">
              <div className="w-10 h-10 rounded-xl bg-[#0F9488]/15 border border-[#0F9488]/40 flex items-center justify-center text-[#2DD4BF] shadow-sm group-hover:scale-105 transition-transform">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xl font-extrabold text-white tracking-tight">JanSahayak</span>
                <span className="text-xs font-bold text-[#2DD4BF] bg-[#0F9488]/20 px-2 py-0.5 rounded-full border border-[#0F9488]/50">
                  AI
                </span>
              </div>
            </Link>

            <p className="text-sm text-slate-300 leading-relaxed font-normal">
              Making public grievance redressal simpler, smarter, and more transparent through technology.
            </p>

            <p className="text-xs text-slate-400 leading-relaxed pt-1 border-t border-[#1E293B]">
              Built to empower citizens with time-bound public service delivery, automated department accountability, and verified photographic resolution.
            </p>

            <div className="text-[11px] font-medium text-slate-400">
              Department of Administrative Reforms & Public Grievances (DARPG Aligned Framework)
            </div>
          </div>

          {/* COLUMN 2 – QUICK LINKS */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white mb-4 pb-1 border-b border-[#1E293B]/70 inline-block">
              Quick Links
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  to="/"
                  className="text-slate-300 hover:text-[#2DD4BF] hover:translate-x-0.5 transition-all inline-block focus:outline-none focus-visible:underline"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-slate-300 hover:text-[#2DD4BF] hover:translate-x-0.5 transition-all inline-block focus:outline-none focus-visible:underline"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/how-it-works"
                  className="text-slate-300 hover:text-[#2DD4BF] hover:translate-x-0.5 transition-all inline-block focus:outline-none focus-visible:underline"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  to="/departments"
                  className="text-slate-300 hover:text-[#2DD4BF] hover:translate-x-0.5 transition-all inline-block focus:outline-none focus-visible:underline"
                >
                  Departments
                </Link>
              </li>
              <li>
                <Link
                  to="/track"
                  className="text-slate-300 hover:text-[#2DD4BF] hover:translate-x-0.5 transition-all inline-block focus:outline-none focus-visible:underline"
                >
                  Track Grievance
                </Link>
              </li>
            </ul>
          </div>

          {/* COLUMN 3 – CITIZEN SERVICES */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white mb-4 pb-1 border-b border-[#1E293B]/70 inline-block">
              Citizen Services
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  to="/citizen/file-complaint"
                  className="text-slate-300 hover:text-[#2DD4BF] hover:translate-x-0.5 transition-all inline-block focus:outline-none focus-visible:underline"
                >
                  File a Grievance
                </Link>
              </li>
              <li>
                <Link
                  to="/track"
                  className="text-slate-300 hover:text-[#2DD4BF] hover:translate-x-0.5 transition-all inline-block focus:outline-none focus-visible:underline"
                >
                  Track Complaint
                </Link>
              </li>
              <li>
                <Link
                  to="/how-it-works"
                  className="text-slate-300 hover:text-[#2DD4BF] hover:translate-x-0.5 transition-all inline-block focus:outline-none focus-visible:underline"
                >
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-slate-300 hover:text-[#2DD4BF] hover:translate-x-0.5 transition-all inline-block focus:outline-none focus-visible:underline"
                >
                  Help and Support
                </Link>
              </li>
              <li>
                <Link
                  to="/how-it-works"
                  className="text-slate-300 hover:text-[#2DD4BF] hover:translate-x-0.5 transition-all inline-block focus:outline-none focus-visible:underline"
                >
                  Citizen Guidelines
                </Link>
              </li>
            </ul>
          </div>

          {/* COLUMN 4 – CONTACT AND INFORMATION */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white mb-4 pb-1 border-b border-[#1E293B]/70 inline-block">
              Contact and Information
            </h3>
            <ul className="space-y-2.5 text-sm mb-5">
              <li>
                <Link
                  to="/about"
                  className="text-slate-300 hover:text-[#2DD4BF] hover:translate-x-0.5 transition-all inline-block focus:outline-none focus-visible:underline"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-slate-300 hover:text-[#2DD4BF] hover:translate-x-0.5 transition-all inline-block focus:outline-none focus-visible:underline"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-slate-300 hover:text-[#2DD4BF] hover:translate-x-0.5 transition-all inline-block focus:outline-none focus-visible:underline"
                >
                  Terms and Conditions
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-slate-300 hover:text-[#2DD4BF] hover:translate-x-0.5 transition-all inline-block focus:outline-none focus-visible:underline"
                >
                  Accessibility Statement
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-slate-300 hover:text-[#2DD4BF] hover:translate-x-0.5 transition-all inline-block focus:outline-none focus-visible:underline"
                >
                  Support Information
                </Link>
              </li>
            </ul>

            {/* Official Support Channels (Verified Info) */}
            <div className="p-3.5 bg-[#071022] rounded-xl border border-[#1E293B] space-y-2 text-xs">
              <div className="flex items-center space-x-2 text-slate-300">
                <Phone className="w-3.5 h-3.5 text-[#0F9488] shrink-0" />
                <span>Helpline: <strong className="text-white font-semibold">1800-11-2026</strong></span>
              </div>
              <div className="flex items-center space-x-2 text-slate-300">
                <Mail className="w-3.5 h-3.5 text-[#0F9488] shrink-0" />
                <span className="truncate">support@jansahayak.gov.in</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-300">
                <Clock className="w-3.5 h-3.5 text-[#0F9488] shrink-0" />
                <span>24x7 Digital Resolution SLA</span>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION WITH SUBTLE DIVIDER */}
        <div className="mt-12 pt-6 border-t border-[#1E293B] flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 gap-4">
          <p className="text-center sm:text-left text-slate-300 font-medium">
            © 2026 JanSahayak AI. All rights reserved.
          </p>

          <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1 text-slate-400">
            <Link
              to="/about"
              className="hover:text-[#2DD4BF] transition-colors focus:outline-none focus-visible:underline"
            >
              Privacy Policy
            </Link>
            <span className="text-slate-600">•</span>
            <Link
              to="/about"
              className="hover:text-[#2DD4BF] transition-colors focus:outline-none focus-visible:underline"
            >
              Terms of Service
            </Link>
            <span className="text-slate-600">•</span>
            <Link
              to="/about"
              className="hover:text-[#2DD4BF] transition-colors focus:outline-none focus-visible:underline"
            >
              Accessibility
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
