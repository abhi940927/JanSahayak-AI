import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge, PriorityBadge } from '../../components/common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  ClipboardList,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  Building,
  Mail,
  Phone,
  User,
  BadgeCheck,
  Edit3
} from 'lucide-react';

export const OfficerDashboard = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [analytics, setAnalytics] = useState({ total: 0, pending: 0, in_progress: 0, resolved: 0, critical: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  useEffect(() => {
    loadOfficerData();
  }, [filterPriority]);

  const loadOfficerData = async () => {
    try {
      setLoading(true);
      const [compRes, anaRes] = await Promise.all([
        api.get(`/complaints${filterPriority ? `?priority=${filterPriority}` : ''}`),
        api.get('/analytics/officer')
      ]);

      if (compRes.success) setComplaints(compRes.data || []);
      if (anaRes.success) setAnalytics(anaRes.data || { total: 0, pending: 0, in_progress: 0, resolved: 0, critical: 0 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = complaints.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.title.toLowerCase().includes(q) || c.tracking_number.toLowerCase().includes(q);
  });

  return (
    <DashboardLayout
      title="Government Officer Redressal Console"
      subtitle={`Department Field Operations & Active Case Queue (${user?.designation || 'Field Officer'})`}
    >
      <div className="space-y-6">
        {/* Dynamic Officer Profile Banner */}
        <div className="bg-gradient-to-r from-gov-navy-900 to-gov-navy-800 text-white rounded-2xl p-6 shadow-sm border border-gov-navy-700/60">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-gov-teal-400 shadow-md"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gov-teal-600 text-white flex items-center justify-center font-black text-2xl uppercase border-2 border-gov-teal-400/40 shadow-sm">
                  {user?.full_name ? user.full_name.charAt(0) : 'O'}
                </div>
              )}

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-black text-white tracking-tight">
                    {user?.full_name || 'Government Officer'}
                  </h2>
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gov-teal-500/20 text-gov-teal-300 border border-gov-teal-400/30">
                    <BadgeCheck className="w-3 h-3 text-gov-teal-400" />
                    <span>Government Field Clearance</span>
                  </span>
                </div>

                <p className="text-xs text-gov-teal-200 font-medium">
                  {user?.designation || 'Executive Engineer - Zone 3 (PWD)'}
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 pt-1">
                  <span className="flex items-center space-x-1">
                    <Mail className="w-3.5 h-3.5 text-gov-teal-400" />
                    <span className="font-mono">{user?.email || 'N/A'}</span>
                  </span>
                  {user?.phone_number && (
                    <span className="flex items-center space-x-1">
                      <Phone className="w-3.5 h-3.5 text-gov-teal-400" />
                      <span>{user.phone_number}</span>
                    </span>
                  )}
                  <span className="flex items-center space-x-1">
                    <Building className="w-3.5 h-3.5 text-gov-teal-400" />
                    <span>Jurisdiction: Delhi NCT / Assigned Ward</span>
                  </span>
                </div>
              </div>
            </div>

            <Link
              to="/profile"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all self-start md:self-auto"
            >
              <Edit3 className="w-3.5 h-3.5 text-gov-teal-300" />
              <span>Officer Profile</span>
            </Link>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Queue</span>
              <ClipboardList className="w-5 h-5 text-slate-400" />
            </div>
            <div className="text-2xl font-black text-slate-800 mt-2">{analytics.total}</div>
            <div className="text-[11px] text-slate-500 mt-1">In your jurisdiction</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Critical Hazards</span>
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div className="text-2xl font-black text-red-600 mt-2">{analytics.critical}</div>
            <div className="text-[11px] text-slate-500 mt-1">Urgent safety risk</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">In Progress</span>
              <Clock className="w-5 h-5 text-sky-500" />
            </div>
            <div className="text-2xl font-black text-sky-600 mt-2">{analytics.in_progress}</div>
            <div className="text-[11px] text-slate-500 mt-1">Field crew dispatched</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Resolved</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-600 mt-2">{analytics.resolved}</div>
            <div className="text-[11px] text-slate-500 mt-1">Verified completions</div>
          </div>
        </div>

        {/* Action / Search Toolbar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tracking ID, title or address..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-gov-teal-500"
            />
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
            <span className="text-xs font-medium text-slate-500">Filter Priority:</span>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg text-xs px-2.5 py-1.5 text-slate-700 focus:outline-none"
            >
              <option value="">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Complaints Data Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                  <th className="py-3 px-4">Tracking ID</th>
                  <th className="py-3 px-4">Grievance Title & Location</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Filed On</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Loading complaints queue...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="max-w-xs mx-auto space-y-2">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                          <ClipboardList className="w-5 h-5" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-700">No Complaints In Active Queue</h4>
                        <p className="text-xs text-slate-400">
                          {filterPriority || search ? 'No grievances match your current search or priority filter.' : 'All assigned civic tasks for your jurisdiction are up to date.'}
                        </p>
                        {(filterPriority || search) && (
                          <button
                            type="button"
                            onClick={() => { setSearch(''); setFilterPriority(''); }}
                            className="mt-2 text-xs font-semibold text-gov-teal-700 hover:underline"
                          >
                            Reset filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-gov-navy-900">
                        {c.tracking_number}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-slate-800 line-clamp-1">{c.title}</div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">{c.address || c.city}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <PriorityBadge priority={c.priority} />
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/complaints/${c.id}`}
                          className="inline-flex items-center space-x-1 font-semibold text-gov-teal-700 hover:text-gov-teal-800 bg-gov-teal-50 px-2.5 py-1 rounded border border-gov-teal-200"
                        >
                          <span>Process</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
