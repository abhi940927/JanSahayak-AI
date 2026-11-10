import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { ComplaintCard } from '../../components/complaints/ComplaintCard';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Search,
  Filter
} from 'lucide-react';

export const CitizenDashboard = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [analytics, setAnalytics] = useState({ total: 0, pending: 0, in_progress: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, [filterStatus]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [compRes, anaRes] = await Promise.all([
        api.get(`/complaints${filterStatus ? `?status=${filterStatus}` : ''}`),
        api.get('/analytics/citizen')
      ]);

      if (compRes.success) setComplaints(compRes.data || []);
      if (anaRes.success) setAnalytics(anaRes.data || { total: 0, pending: 0, in_progress: 0, resolved: 0 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredComplaints = complaints.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.title.toLowerCase().includes(q) || c.tracking_number.toLowerCase().includes(q);
  });

  return (
    <DashboardLayout
      title={`Welcome back, ${user?.full_name?.split(' ')[0] || 'Citizen'}`}
      subtitle="View, track and manage your registered public service grievances."
    >
      <div className="space-y-6">
        {/* Analytics Counter Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Filed</span>
              <FileText className="w-5 h-5 text-slate-400" />
            </div>
            <div className="text-2xl font-black text-slate-800 mt-2">{analytics.total}</div>
            <div className="text-[11px] text-slate-500 mt-1">Grievances registered</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Pending</span>
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-600 mt-2">{analytics.pending}</div>
            <div className="text-[11px] text-slate-500 mt-1">Awaiting field action</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">In Progress</span>
              <AlertCircle className="w-5 h-5 text-sky-500" />
            </div>
            <div className="text-2xl font-black text-sky-600 mt-2">{analytics.in_progress}</div>
            <div className="text-[11px] text-slate-500 mt-1">Under active inspection</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Resolved</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-600 mt-2">{analytics.resolved}</div>
            <div className="text-[11px] text-slate-500 mt-1">Successfully addressed</div>
          </div>
        </div>

        {/* Action Header & Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title or tracking ID..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-gov-teal-500"
            />
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg text-xs px-2.5 py-1.5 text-slate-700 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>

            <Link
              to="/citizen/file-complaint"
              className="inline-flex items-center space-x-1.5 bg-gov-teal-600 hover:bg-gov-teal-700 text-white font-semibold text-xs px-3.5 py-2 rounded-lg shadow-sm transition-colors whitespace-nowrap"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>File Grievance</span>
            </Link>
          </div>
        </div>

        {/* Complaints Listing */}
        {loading ? (
          <div className="text-center py-16 text-slate-400 text-sm">
            Retrieving grievance records from database...
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700">No grievances found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You haven't filed any complaints matching this filter. Encountering a civic problem in your area?
            </p>
            <Link
              to="/citizen/file-complaint"
              className="inline-block mt-2 bg-gov-navy-900 text-white text-xs font-semibold px-4 py-2 rounded-lg"
            >
              File Your First Complaint
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredComplaints.map(complaint => (
              <ComplaintCard key={complaint.id} complaint={complaint} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
