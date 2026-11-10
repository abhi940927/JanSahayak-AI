import React from 'react';
import {
  FileText,
  CheckCircle,
  UserCheck,
  Clock,
  Search,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  RotateCcw,
  AlertTriangle,
  AlertOctagon,
  MinusCircle,
  ArrowDownCircle
} from 'lucide-react';

export const StatusBadge = ({ status, size = 'normal' }) => {
  const normalized = (status || 'submitted').toLowerCase();

  const configs = {
    submitted: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      label: 'Submitted',
      icon: FileText
    },
    verified: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      border: 'border-indigo-200',
      label: 'Verified',
      icon: CheckCircle
    },
    assigned: {
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-200',
      label: 'Assigned',
      icon: UserCheck
    },
    in_progress: {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      label: 'In Progress',
      icon: Clock
    },
    under_review: {
      bg: 'bg-teal-50',
      text: 'text-teal-800',
      border: 'border-teal-200',
      label: 'Under Review',
      icon: Search
    },
    resolved: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
      label: 'Resolved',
      icon: CheckCircle2
    },
    closed: {
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-300',
      label: 'Closed',
      icon: ShieldCheck
    },
    rejected: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      label: 'Rejected',
      icon: AlertCircle
    },
    reopened: {
      bg: 'bg-orange-50',
      text: 'text-orange-800',
      border: 'border-orange-200',
      label: 'Reopened',
      icon: RotateCcw
    }
  };

  const config = configs[normalized] || configs.submitted;
  const Icon = config.icon;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${sizeClasses} ${config.bg} ${config.text} ${config.border}`}
      role="status"
      aria-label={`Status: ${config.label}`}
    >
      <Icon className={`${iconSize} shrink-0 opacity-80`} aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
};

export const PriorityBadge = ({ priority, size = 'normal' }) => {
  const normalized = (priority || 'medium').toLowerCase();

  const configs = {
    critical: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-300',
      label: 'Critical',
      icon: AlertTriangle
    },
    high: {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-300',
      label: 'High',
      icon: AlertOctagon
    },
    medium: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      label: 'Medium',
      icon: MinusCircle
    },
    low: {
      bg: 'bg-slate-50',
      text: 'text-slate-600',
      border: 'border-slate-200',
      label: 'Low',
      icon: ArrowDownCircle
    }
  };

  const config = configs[normalized] || configs.medium;
  const Icon = config.icon;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs';
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md font-semibold border ${sizeClasses} ${config.bg} ${config.text} ${config.border}`}
      aria-label={`Priority: ${config.label}`}
    >
      <Icon className={`${iconSize} shrink-0`} aria-hidden="true" />
      <span>{config.label} Priority</span>
    </span>
  );
};
