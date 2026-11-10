import React, { useState } from 'react';
import api from '../../services/api';
import { Search, ShieldAlert, ArrowRight, Clock, AlertCircle } from 'lucide-react';
import { StatusBadge, PriorityBadge } from '../../components/common/StatusBadge';
import { ComplaintTimeline } from '../../components/complaints/ComplaintTimeline';

export const TrackComplaint = () => {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!trackingNumber.trim()) return;

    try {
      setLoading(true);
      setError('');
      setComplaint(null);
      const res = await api.get(`/complaints/${trackingNumber.trim()}`);
      if (res.success && res.data) {
        setComplaint(res.data);
      }
    } catch (err) {
      setError('No grievance record found with this tracking number. Please verify and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="text-center space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-gov-teal-600">Public Grievance Tracking</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gov-navy-900 tracking-tight">
          Track Your Grievance Status
        </h1>
        <p className="max-w-xl mx-auto text-sm text-slate-600">
          Enter your unique tracking reference number (e.g. <span className="font-mono font-semibold text-slate-800">JS-2026-94821</span>) to view real-time status transitions and field inspection notes.
        </p>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSearch} className="max-w-xl mx-auto flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="e.g. JS-2026-94821"
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gov-teal-500 focus:border-gov-teal-500 shadow-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-gov-navy-900 hover:bg-gov-navy-800 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors shadow flex items-center space-x-1"
        >
          {loading ? <span>Searching...</span> : <span>Track</span>}
        </button>
      </form>

      {/* Error state */}
      {error && (
        <div className="max-w-xl mx-auto p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Result Card & Timeline */}
      {complaint && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-slate-100">
            <div>
              <span className="font-mono text-sm font-bold text-gov-navy-900 bg-slate-100 px-3 py-1 rounded border border-slate-200">
                {complaint.tracking_number}
              </span>
              <h2 className="text-xl font-bold text-slate-800 mt-2">{complaint.title}</h2>
            </div>
            <div className="flex items-center space-x-2">
              <PriorityBadge priority={complaint.priority} />
              <StatusBadge status={complaint.status} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl">
            <div>
              <span className="font-semibold text-slate-700">Department:</span>{' '}
              {complaint.department?.name || 'Assigned Nodal Dept'}
            </div>
            <div>
              <span className="font-semibold text-slate-700">Location:</span>{' '}
              {complaint.address || complaint.city}
            </div>
            <div>
              <span className="font-semibold text-slate-700">Registered On:</span>{' '}
              {new Date(complaint.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
            <div>
              <span className="font-semibold text-slate-700">SLA Due Deadline:</span>{' '}
              {complaint.sla_due_at ? new Date(complaint.sla_due_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '72 Hours'}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-700 mb-1">Issue Description</h4>
            <p className="text-xs text-slate-600 leading-relaxed bg-white border border-slate-100 p-3 rounded-lg">
              {complaint.description}
            </p>
          </div>

          {/* Stepper Timeline */}
          <ComplaintTimeline history={complaint.history} currentStatus={complaint.status} />
        </div>
      )}
    </div>
  );
};
