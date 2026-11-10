import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  Building2,
  Phone,
  Mail,
  Clock,
  Search,
  ArrowRight,
  Droplets,
  Zap,
  Construction,
  Sparkles,
  Trash2,
  HeartPulse,
  Waves,
  Lightbulb,
  ShieldCheck
} from 'lucide-react';

export const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/departments');
      if (res.success && res.data) {
        setDepartments(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getDeptIcon = (code) => {
    switch (code) {
      case 'DJB': return Droplets;
      case 'EPD': return Zap;
      case 'PWD': return Construction;
      case 'MCD': return Sparkles;
      case 'SWM': return Trash2;
      case 'HFW': return HeartPulse;
      case 'DFC': return Waves;
      case 'SLC': return Lightbulb;
      default: return Building2;
    }
  };

  const filtered = departments.filter((d) => {
    const q = searchQuery.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.code.toLowerCase().includes(q) ||
      (d.description && d.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs font-extrabold uppercase tracking-widest text-gov-teal-700 bg-gov-teal-50 px-3 py-1 rounded-full border border-gov-teal-200">
          Civic Service Authorities
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-gov-navy-900 tracking-tight">
          Participating Government Departments & SLAs
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Every municipal agency operates under committed Citizen Charter Service Level Agreements (SLAs)
          with algorithmic escalations if resolution is delayed.
        </p>

        {/* Search bar */}
        <div className="pt-2 max-w-md mx-auto">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by department name, code, or civic utility..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-gov-teal-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs animate-pulse space-y-4">
              <div className="h-6 bg-slate-100 rounded w-20"></div>
              <div className="h-6 bg-slate-100 rounded w-48"></div>
              <div className="h-16 bg-slate-100 rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No departments match "{searchQuery}"</h3>
          <p className="text-xs text-slate-500 mt-1">Try searching for keywords like water, power, road, sanitation.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((dept) => {
            const Icon = getDeptIcon(dept.code);
            return (
              <div
                key={dept.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-lg hover:border-gov-teal-400 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-10 h-10 rounded-xl bg-gov-teal-50 text-gov-teal-700 flex items-center justify-center font-bold">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-black text-gov-teal-700 bg-gov-teal-50/80 px-2.5 py-1 rounded border border-gov-teal-200 font-mono">
                        {dept.code}
                      </span>
                    </div>

                    <span className="inline-flex items-center text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
                      <Clock className="w-3.5 h-3.5 mr-1 text-slate-500" />
                      SLA: {dept.sla_hours_default || 24} Hours
                    </span>
                  </div>

                  <div>
                    <h2 className="text-lg font-black text-gov-navy-900 group-hover:text-gov-teal-700 transition-colors">
                      {dept.name}
                    </h2>
                    <p className="text-xs text-slate-600 leading-relaxed mt-1.5">
                      {dept.description || 'Public utility agency handling infrastructure redressal and maintenance.'}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
                  <div className="space-y-1.5 text-xs text-slate-500">
                    {dept.contact_phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Helpline: {dept.contact_phone}</span>
                      </div>
                    )}
                    {dept.contact_email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{dept.contact_email}</span>
                      </div>
                    )}
                  </div>

                  <Link
                    to="/citizen/file-complaint"
                    className="w-full inline-flex items-center justify-center space-x-1.5 text-xs font-bold text-gov-teal-700 hover:text-white bg-gov-teal-50 hover:bg-gov-teal-600 border border-gov-teal-200 hover:border-gov-teal-600 py-2 rounded-xl transition-all"
                  >
                    <span>File Grievance for {dept.code}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
