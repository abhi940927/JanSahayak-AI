import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Globe, Mail, Phone, ExternalLink, ShieldCheck } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-gov-navy-950 text-slate-300 border-t border-gov-navy-800" role="contentinfo">
      {/* Official Top Band */}
      <div className="border-b border-gov-navy-900 bg-gov-navy-900/60 py-3 px-4 sm:px-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-gov-teal-400"></span>
            <span className="font-medium text-slate-300">National Smart Public Grievance Redressal Architecture</span>
          </div>
          <div className="flex items-center space-x-4 text-[11px] text-slate-400">
            <span>RTI Act Aligned</span>
            <span>•</span>
            <span>256-bit SSL Encrypted</span>
            <span>•</span>
            <span>WCAG 2.1 AA Compliant</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand & Mission */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gov-navy-800 to-gov-navy-900 border border-slate-700 flex items-center justify-center text-gov-teal-400 shadow-sm">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-black text-white tracking-tight">JanSahayak</span>
                <span className="ml-1 text-xs font-extrabold text-gov-teal-400 bg-gov-teal-950 px-1.5 py-0.5 rounded border border-gov-teal-800">
                  AI
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Empowering citizens with intelligent, transparent public grievance management across government agencies with verified photographic resolution and SLA accountability.
            </p>
            <div className="pt-2 text-[11px] text-slate-400">
              Department of Administrative Reforms & Public Grievances (DARPG Aligned Framework)
            </div>
          </div>

          {/* Quick Platform Links */}
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-200 mb-4">
              Citizen Services
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/citizen/file-complaint" className="text-slate-400 hover:text-gov-teal-400 transition-colors">
                  File a New Public Grievance
                </Link>
              </li>
              <li>
                <Link to="/track" className="text-slate-400 hover:text-gov-teal-400 transition-colors">
                  Track Grievance Status
                </Link>
              </li>
              <li>
                <Link to="/departments" className="text-slate-400 hover:text-gov-teal-400 transition-colors">
                  Browse Integrated Departments
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-slate-400 hover:text-gov-teal-400 transition-colors">
                  How AI Redressal Works
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-slate-400 hover:text-gov-teal-400 transition-colors">
                  About Smart Governance Initiative
                </Link>
              </li>
            </ul>
          </div>

          {/* 8 Civic Utilities */}
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-200 mb-4">
              Civic Utilities Covered
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>• Water Supply & Sewerage (DJB)</li>
              <li>• Electricity & Power Grids (EPD)</li>
              <li>• Roads, Flyovers & PWD (PWD)</li>
              <li>• Municipal Sanitation & Sweeping (MCD)</li>
              <li>• Solid Waste Management (SWM)</li>
              <li>• Public Health & Clinics (HFW)</li>
              <li>• Drainage & Flood Control (DFC)</li>
              <li>• Street Lighting Corridors (SLC)</li>
            </ul>
          </div>

          {/* Official Helplines */}
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-200 mb-4">
              Emergency & Support
            </h3>
            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-center space-x-2.5">
                <Phone className="w-4 h-4 text-gov-teal-400 shrink-0" />
                <span>National Citizen Helpline: <strong className="text-white">1800-11-2026</strong> (Toll-Free)</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <Mail className="w-4 h-4 text-gov-teal-400 shrink-0" />
                <span>support@jansahayak.gov.in</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <Globe className="w-4 h-4 text-gov-teal-400 shrink-0" />
                <span>24x7 Multi-Lingual Redressal Desk</span>
              </div>
              <div className="p-3 bg-gov-navy-900 rounded-xl border border-slate-800 text-[11px] text-slate-400 mt-2">
                Emergency life safety hazards (snapped wires, gas leaks) trigger automatic 12-hour response dispatch.
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Legal Bar */}
        <div className="mt-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 gap-3">
          <p>© {new Date().getFullYear()} JanSahayak AI. Official Smart Public Service Management Platform.</p>
          <div className="flex items-center space-x-4 text-[11px]">
            <span className="text-slate-400">Terms of Redressal</span>
            <span>•</span>
            <span className="text-slate-400">Citizen Privacy Policy</span>
            <span>•</span>
            <span className="text-slate-400">RTI Disclosure</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
