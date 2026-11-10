import React from 'react';

export const StatusBadge = ({ status }) => {
  const normalized = (status || 'submitted').toLowerCase();

  const configs = {
    submitted: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Submitted' },
    verified: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', label: 'Verified' },
    assigned: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: 'Assigned' },
    in_progress: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'In Progress' },
    under_review: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', label: 'Under Review' },
    resolved: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Resolved' },
    closed: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', label: 'Closed' },
    rejected: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Rejected' },
    reopened: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', label: 'Reopened' }
  };

  const config = configs[normalized] || configs.submitted;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-75"></span>
      {config.label}
    </span>
  );
};

export const PriorityBadge = ({ priority }) => {
  const normalized = (priority || 'medium').toLowerCase();

  const configs = {
    critical: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500', label: 'Critical Priority' },
    high: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500', label: 'High Priority' },
    medium: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500', label: 'Medium Priority' },
    low: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400', label: 'Low Priority' }
  };

  const config = configs[normalized] || configs.medium;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} mr-1.5`}></span>
      {config.label}
    </span>
  );
};
