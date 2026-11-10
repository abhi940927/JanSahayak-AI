import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge, PriorityBadge } from '../../components/common/StatusBadge';
import { ComplaintTimeline } from '../../components/complaints/ComplaintTimeline';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  MapPin,
  Calendar,
  Clock,
  Building,
  User,
  ShieldCheck,
  Star,
  CheckCircle,
  AlertCircle,
  Cpu,
  FileCheck2
} from 'lucide-react';

export const ComplaintDetail = () => {
  const { id } = useParams();
  const { user, role } = useAuth();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Officer status update modal/form state
  const [newStatus, setNewStatus] = useState('');
  const [statusRemarks, setStatusRemarks] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Citizen feedback state
  const [rating, setRating] = useState(5);
  const [feedbackComments, setFeedbackComments] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  useEffect(() => {
    fetchComplaint();
  }, [id, role]);

  const fetchComplaint = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/complaints/${id}`);
      if (res.success && res.data) {
        setComplaint(res.data);
        setNewStatus(res.data.status);
      }
    } catch (err) {
      setError(err.message || 'Failed to load grievance details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!statusRemarks) {
      alert('Remarks are required when updating status');
      return;
    }

    try {
      setUpdatingStatus(true);
      const res = await api.patch(`/complaints/${complaint.id}/status`, {
        status: newStatus,
        remarks: statusRemarks
      });
      if (res.success) {
        setStatusRemarks('');
        await fetchComplaint();
      }
    } catch (err) {
      alert(err.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const isOfficerOrAdmin = ['officer', 'department_admin', 'super_admin'].includes(role);

  return (
    <DashboardLayout
      title="Grievance Redressal Record"
      subtitle={`Official Lifecycle Record: ${complaint?.tracking_number || id}`}
    >
      {loading ? (
        <div className="text-center py-20 text-slate-400">Loading complaint record...</div>
      ) : error || !complaint ? (
        <div className="p-8 bg-white rounded-xl border border-slate-200 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-800">Record Not Accessible</h2>
          <p className="text-xs text-slate-500">{error || 'Grievance not found or access restricted by RLS.'}</p>
          <Link to="/" className="inline-block text-xs font-semibold text-gov-teal-700 hover:underline">
            Return to Portal
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Summary Header Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-slate-100">
              <div className="space-y-1">
                <span className="font-mono text-sm font-extrabold text-gov-navy-900 bg-slate-100 px-3 py-1 rounded border border-slate-200">
                  {complaint.tracking_number}
                </span>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
                  {complaint.title}
                </h1>
              </div>
              <div className="flex items-center space-x-2">
                <PriorityBadge priority={complaint.priority} />
                <StatusBadge status={complaint.status} />
              </div>
            </div>

            {/* Meta Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-400 block mb-0.5">Assigned Department</span>
                <strong className="text-slate-800 font-semibold">
                  {complaint.department?.name || 'Municipal Authority'}
                </strong>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Location / City</span>
                <strong className="text-slate-800 font-semibold">
                  {complaint.address || complaint.city}
                </strong>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Submission Date</span>
                <strong className="text-slate-800 font-semibold">
                  {new Date(complaint.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </strong>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">SLA Deadline</span>
                <strong className="text-gov-teal-700 font-semibold">
                  {complaint.sla_due_at ? new Date(complaint.sla_due_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit' }) : '72 Hours'}
                </strong>
              </div>
            </div>

            {/* Full Description */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Grievance Statement
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                {complaint.description}
              </p>
            </div>
          </div>

          {/* Officer Workflow Action Panel (if Officer / Admin) */}
          {isOfficerOrAdmin && (
            <div className="bg-gov-navy-900 text-white rounded-2xl p-6 sm:p-8 shadow-md space-y-4">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-gov-teal-400" />
                <h3 className="text-base font-bold text-white">Officer Action & Status Management</h3>
              </div>
              <p className="text-xs text-slate-300">
                Authorized government officer status transition panel. Every change is immutably recorded in the grievance audit history.
              </p>

              <form onSubmit={handleUpdateStatus} className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Transition Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full bg-gov-navy-800 border border-slate-700 text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-gov-teal-400"
                  >
                    <option value="verified">Mark as Verified</option>
                    <option value="assigned">Assign Field Team</option>
                    <option value="in_progress">Mark as In Progress</option>
                    <option value="under_review">Mark Under Review</option>
                    <option value="resolved">Mark Resolved (Evidence)</option>
                    <option value="closed">Close Grievance</option>
                    <option value="rejected">Reject (Requires reason)</option>
                  </select>
                </div>

                <div className="sm:col-span-2 flex flex-col sm:flex-row gap-3 items-end">
                  <div className="w-full">
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                      Inspection Notes / Resolution Remarks
                    </label>
                    <input
                      type="text"
                      required
                      value={statusRemarks}
                      onChange={(e) => setStatusRemarks(e.target.value)}
                      placeholder="e.g. Field inspection completed, road patched with cold mix asphalt."
                      className="w-full bg-gov-navy-800 border border-slate-700 text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-gov-teal-400"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={updatingStatus}
                    className="bg-gov-teal-500 hover:bg-gov-teal-600 text-white font-bold text-xs px-5 py-2.5 rounded-lg whitespace-nowrap transition-colors"
                  >
                    {updatingStatus ? 'Updating...' : 'Commit Status'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Stepper Timeline & Audit History */}
          <ComplaintTimeline history={complaint.history} currentStatus={complaint.status} />
        </div>
      )}
    </DashboardLayout>
  );
};
