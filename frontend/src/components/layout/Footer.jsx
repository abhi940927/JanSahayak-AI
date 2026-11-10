import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ExternalLink, Heart, Globe, Mail, Phone } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-gov-navy-900 text-slate-300 border-t border-gov-navy-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Mission */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded bg-gov-teal-600 flex items-center justify-center text-white">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">JanSahayak AI</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Empowering citizens with transparent, AI-supervised public grievance reporting and time-bound civic resolution across government departments.
            </p>
            <div className="text-xs text-slate-400">
              Department of Administrative Reforms & Public Grievances
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200 mb-4">
              Platform Links
            </h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="hover:text-gov-teal-400 transition-colors">About JanSahayak</Link></li>
              <li><Link to="/how-it-works" className="hover:text-gov-teal-400 transition-colors">How It Works</Link></li>
              <li><Link to="/departments" className="hover:text-gov-teal-400 transition-colors">Civic Departments</Link></li>
              <li><Link to="/track" className="hover:text-gov-teal-400 transition-colors">Track Complaint Status</Link></li>
              <li><Link to="/citizen/file-complaint" className="hover:text-gov-teal-400 transition-colors">Submit Grievance</Link></li>
            </ul>
          </div>

          {/* Civic Departments */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200 mb-4">
              Covered Sectors
            </h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>• Municipal & Waste Sanitation (MCD)</li>
              <li>• Roads, Bridges & Flyovers (PWD)</li>
              <li>• Electricity & Power Grids (EPD)</li>
              <li>• Drinking Water & Sewerage (DJB)</li>
              <li>• Traffic & Urban Mobility (TPD)</li>
              <li>• Public Health & Family Clinics (HFW)</li>
            </ul>
          </div>

          {/* Official Helplines */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200 mb-4">
              Citizen Emergency & Support
            </h3>
            <div className="space-y-3 text-sm text-slate-300">
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-gov-teal-400" />
                <span>Toll-Free National Helpline: 1800-11-2026</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-gov-teal-400" />
                <span>support@jansahayak.gov.in</span>
              </div>
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-gov-teal-400" />
                <span>24x7 SLA Resolution Desk</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400">
          <p>© {new Date().getFullYear()} JanSahayak AI Public Grievance Portal. All rights reserved.</p>
          <p className="mt-2 sm:mt-0 flex items-center space-x-1">
            <span>Built with High Integrity Smart Governance Architecture</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
