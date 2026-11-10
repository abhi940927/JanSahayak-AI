import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge, PriorityBadge } from '../../components/common/StatusBadge';
import { ComplaintTimeline } from '../../components/complaints/ComplaintTimeline';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import axios from 'axios';
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
  AlertTriangle,
  Cpu,
  FileCheck2,
  Sparkles,
  Send
} from 'lucide-react';

const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000/api/ai';

export const ComplaintDetail = () => {
  const { id } = useParams();
  const { user, role } = useAuth();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // AI Summary State
  const [aiSummary, setAiSummary] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Officer status update modal/form state
  const [newStatus, setNewStatus] = useState('');
  const [statusRemarks, setStatusRemarks] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Citizen feedback state
  const [rating, setRating] = useState(5);
  const [feedbackComments, setFeedbackComments] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

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
        if (res.data.feedback) {
          setFeedbackSubmitted(true);
          setRating(res.data.feedback.rating);
          setFeedbackComments(res.data.feedback.comments || '');
        }
        // Fetch AI Executive Summary
        fetchAiSummary(res.data.title, res.data.description);
      }
    } catch (err) {
      setError(err.message || 'Failed to load grievance details');
    } finally {
      setLoading(false);
    }
  };

  const fetchAiSummary = async (title, description) => {
    try {
      setLoadingAi(true);
      const res = await axios.post(`${AI_SERVICE_URL}/summarize`, { title, description });
      if (res.data) setAiSummary(res.data);
    } catch (err) {
      // Graceful fallback
    } finally {
      setLoadingAi(false);
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

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmittingFeedback(true);
      const res = await api.post(`/complaints/${complaint.id}/feedback`, {
        rating,
        comments: feedbackComments
      });
      if (res.success) {
        setFeedbackSubmitted(true);
        await fetchComplaint();
      }
    } catch (err) {
      alert(err.message || 'Failed to submit feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const isOfficerOrAdmin = ['officer', 'department_admin', 'super_admin'].includes(role);
  const isResolvedOrClosed = ['resolved', 'closed'].includes(complaint?.status);

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

          {/* AI Duplicate Advisory Banner (if duplicate candidates detected) */}
          {complaint.duplicate_matches && complaint.duplicate_matches.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-3">
              <div className="flex items-center space-x-2 text-amber-800 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>AI Duplicate Advisory: {complaint.duplicate_matches.length} Nearby Similar Grievance(s) Identified</span>
              </div>
              <p className="text-xs text-amber-700 leading-relaxed">
                JanSahayak AI's semantic and spatial analysis detected potential overlapping complaints filed in this vicinity. Under governance policy, complaints remain independent and are flagged for investigating officer reference.
              </p>
              <div className="space-y-2 pt-1">
                {complaint.duplicate_matches.map((dup, i) => (
                  <div key={i} className="bg-white/90 p-3 rounded-xl border border-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1 shadow-2xs">
                    <div>
                      <span className="font-mono font-bold text-gov-navy-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {dup.tracking_number}
                      </span>
                      <span className="font-semibold text-slate-800 ml-2">{dup.title}</span>
                    </div>
                    <div className="text-[11px] text-amber-800 font-bold whitespace-nowrap">
                      {dup.distance_meters ? `${dup.distance_meters}m away` : 'Overlapping zone'} • {(dup.similarity_score * 100).toFixed(0)}% similarity match
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Intelligence Briefing Panel */}
          {aiSummary && (
            <div className="bg-gradient-to-r from-gov-navy-900 to-slate-900 text-white rounded-2xl p-6 shadow-sm border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-gov-teal-400">
                  <Sparkles className="w-5 h-5" />
                  <span className="text-xs font-extrabold uppercase tracking-wider">AI Executive Briefing</span>
                </div>
                <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  Model: {aiSummary.generator || 'JanSahayak NLP'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
                <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
                  <span className="text-slate-400 block font-semibold mb-1">Impact & Threat Assessment:</span>
                  <p className="text-slate-200 leading-relaxed">{aiSummary.reported_impact}</p>
                </div>
                <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
                  <span className="text-gov-teal-400 block font-semibold mb-1">Suggested Field Action:</span>
                  <p className="text-slate-200 leading-relaxed">{aiSummary.suggested_next_action}</p>
                </div>
              </div>
            </div>
          )}

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

          {/* Citizen Satisfaction Feedback Card (When complaint is resolved) */}
          {isResolvedOrClosed && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 sm:p-8 space-y-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-emerald-900">Citizen Resolution Feedback</h3>
              </div>

              {feedbackSubmitted ? (
                <div className="bg-white p-4 rounded-xl border border-emerald-200 space-y-2">
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`}
                      />
                    ))}
                    <span className="text-xs font-bold text-slate-700 ml-2">Rating: {rating}/5 Stars</span>
                  </div>
                  {feedbackComments && (
                    <p className="text-xs text-slate-600 italic">"{feedbackComments}"</p>
                  )}
                  <div className="text-[11px] text-emerald-700 font-medium">✓ Feedback recorded and linked to officer performance scorecard.</div>
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="space-y-4 bg-white p-5 rounded-xl border border-emerald-200">
                  <p className="text-xs text-slate-600">
                    This grievance has been marked as resolved by the municipal department. Please rate your satisfaction with the quality and timeliness of the repair.
                  </p>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Satisfaction Rating</label>
                    <div className="flex items-center space-x-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setRating(star)}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`w-6 h-6 ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-semibold text-slate-600 ml-2">
                        {rating === 5 ? 'Excellent' : rating === 4 ? 'Good' : rating === 3 ? 'Average' : 'Unsatisfactory'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Review Comments (Optional)</label>
                    <input
                      type="text"
                      value={feedbackComments}
                      onChange={(e) => setFeedbackComments(e.target.value)}
                      placeholder="e.g. Prompt action taken, road is completely safe now."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingFeedback}
                    className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-sm transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submittingFeedback ? 'Submitting...' : 'Submit Official Feedback'}</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Stepper Timeline & Audit History */}
          <ComplaintTimeline history={complaint.history} currentStatus={complaint.status} />
        </div>
      )}
    </DashboardLayout>
  );
};
