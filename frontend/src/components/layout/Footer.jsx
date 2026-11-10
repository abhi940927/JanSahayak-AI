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
  ExternalLink,
  Code
} from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-[#0B1730] text-slate-200 border-t border-[#1E293B] mt-auto" role="contentinfo">
      {/* Top National Trust Band (Compact) */}
      <div className="border-b border-[#1E293B] bg-[#071022] py-2 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#0F9488] shrink-0 animate-pulse"></span>
            <span className="font-semibold text-slate-200 tracking-wide text-[11px] sm:text-xs">
              Official Public Grievance Redressal Architecture • Smart Governance Initiative
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-300">
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

      {/* Main 4-Column Footer Content (Compact Height & Spacing) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* COLUMN 1 – BRAND & MISSION */}
          <div className="space-y-2.5">
            <Link to="/" className="inline-flex items-center space-x-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F9488] rounded-lg">
              <div className="w-8 h-8 rounded-lg bg-[#0F9488]/15 border border-[#0F9488]/40 flex items-center justify-center text-[#2DD4BF] shadow-xs group-hover:scale-105 transition-transform">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="text-lg font-extrabold text-white tracking-tight">JanSahayak</span>
                <span className="text-[10px] font-bold text-[#2DD4BF] bg-[#0F9488]/20 px-1.5 py-0.5 rounded-full border border-[#0F9488]/50">
                  AI
                </span>
              </div>
            </Link>

            <p className="text-xs text-slate-300 leading-relaxed font-normal">
              Making public grievance redressal simpler, smarter, and more transparent through technology.
            </p>

            <p className="text-[11px] text-slate-400 leading-relaxed pt-1 border-t border-[#1E293B]">
              Empowering citizens with time-bound public service delivery and automated department accountability.
            </p>

            <div className="text-[10px] font-medium text-slate-400">
              Department of Administrative Reforms & Public Grievances (DARPG Aligned Framework)
            </div>
          </div>

          {/* COLUMN 2 – QUICK LINKS */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-2.5 pb-1 border-b border-[#1E293B]/70 inline-block">
              Quick Links
            </h3>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link to="/" className="text-slate-300 hover:text-[#2DD4BF] transition-colors inline-block py-0.5 focus:outline-none focus-visible:underline">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-slate-300 hover:text-[#2DD4BF] transition-colors inline-block py-0.5 focus:outline-none focus-visible:underline">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-slate-300 hover:text-[#2DD4BF] transition-colors inline-block py-0.5 focus:outline-none focus-visible:underline">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/departments" className="text-slate-300 hover:text-[#2DD4BF] transition-colors inline-block py-0.5 focus:outline-none focus-visible:underline">
                  Departments
                </Link>
              </li>
              <li>
                <Link to="/track" className="text-slate-300 hover:text-[#2DD4BF] transition-colors inline-block py-0.5 focus:outline-none focus-visible:underline">
                  Track Grievance
                </Link>
              </li>
            </ul>
          </div>

          {/* COLUMN 3 – CITIZEN SERVICES */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-2.5 pb-1 border-b border-[#1E293B]/70 inline-block">
              Citizen Services
            </h3>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link to="/citizen/file-complaint" className="text-slate-300 hover:text-[#2DD4BF] transition-colors inline-block py-0.5 focus:outline-none focus-visible:underline">
                  File a Grievance
                </Link>
              </li>
              <li>
                <Link to="/track" className="text-slate-300 hover:text-[#2DD4BF] transition-colors inline-block py-0.5 focus:outline-none focus-visible:underline">
                  Track Complaint
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-slate-300 hover:text-[#2DD4BF] transition-colors inline-block py-0.5 focus:outline-none focus-visible:underline">
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-slate-300 hover:text-[#2DD4BF] transition-colors inline-block py-0.5 focus:outline-none focus-visible:underline">
                  Help and Support
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-slate-300 hover:text-[#2DD4BF] transition-colors inline-block py-0.5 focus:outline-none focus-visible:underline">
                  Citizen Guidelines
                </Link>
              </li>
            </ul>
          </div>

          {/* COLUMN 4 – CONTACT AND INFORMATION */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-2.5 pb-1 border-b border-[#1E293B]/70 inline-block">
              Contact & Support
            </h3>
            <ul className="space-y-1.5 text-xs mb-3">
              <li>
                <Link to="/about" className="text-slate-300 hover:text-[#2DD4BF] transition-colors inline-block py-0.5 focus:outline-none focus-visible:underline">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-slate-300 hover:text-[#2DD4BF] transition-colors inline-block py-0.5 focus:outline-none focus-visible:underline">
                  Privacy Policy & Terms
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-slate-300 hover:text-[#2DD4BF] transition-colors inline-block py-0.5 focus:outline-none focus-visible:underline">
                  Accessibility Statement
                </Link>
              </li>
            </ul>

            {/* Official Support Channels */}
            <div className="p-2.5 bg-[#071022] rounded-lg border border-[#1E293B] space-y-1.5 text-[11px]">
              <div className="flex items-center space-x-2 text-slate-300">
                <Phone className="w-3 h-3 text-[#0F9488] shrink-0" />
                <span>Helpline: <strong className="text-white font-semibold">1800-11-2026</strong></span>
              </div>
              <div className="flex items-center space-x-2 text-slate-300">
                <Mail className="w-3 h-3 text-[#0F9488] shrink-0" />
                <span className="truncate">support@jansahayak.gov.in</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-300">
                <Clock className="w-3 h-3 text-[#0F9488] shrink-0" />
                <span>24x7 Digital Resolution SLA</span>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION WITH SUBTLE DIVIDER & PORTFOLIO REDIRECTION */}
        <div className="mt-8 pt-4 border-t border-[#1E293B] flex flex-col md:flex-row justify-between items-center text-xs text-slate-400 gap-3">
          {/* Copyright */}
          <div className="text-center md:text-left text-slate-300 font-medium text-[11px] sm:text-xs">
            © 2026 JanSahayak AI. All rights reserved.
          </div>

          {/* DEVELOPED BY ABHINAV SINGH (CLICKABLE PORTFOLIO LINK) */}
          <div className="flex items-center space-x-1.5 text-[11px] sm:text-xs text-slate-300 bg-[#071022]/80 px-3 py-1 rounded-full border border-[#1E293B]">
            <span className="text-slate-400">Developed by</span>
            <a
              href="https://portfolio-8p6q.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              title="Visit Abhinav Singh's Portfolio"
              className="font-bold text-[#2DD4BF] hover:text-white inline-flex items-center space-x-1 underline decoration-[#0F9488] decoration-2 underline-offset-4 hover:decoration-white transition-all group"
            >
              <span>Abhinav Singh</span>
              <ExternalLink className="w-3 h-3 text-[#0F9488] group-hover:text-white transition-colors" />
            </a>
          </div>

          {/* Quick Legal Links */}
          <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
            <Link to="/about" className="hover:text-[#2DD4BF] transition-colors focus:outline-none focus-visible:underline">
              Privacy Policy
            </Link>
            <span className="text-slate-600">•</span>
            <Link to="/about" className="hover:text-[#2DD4BF] transition-colors focus:outline-none focus-visible:underline">
              Terms of Service
            </Link>
            <span className="text-slate-600">•</span>
            <Link to="/about" className="hover:text-[#2DD4BF] transition-colors focus:outline-none focus-visible:underline">
              Accessibility
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
