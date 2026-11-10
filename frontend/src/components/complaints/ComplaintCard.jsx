import React from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge, PriorityBadge } from '../common/StatusBadge';
import { MapPin, Calendar, Clock, ChevronRight, Building } from 'lucide-react';

export const ComplaintCard = ({ complaint, showActions = true, actionLabel = 'View Details' }) => {
  const formattedDate = new Date(complaint.created_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-gov-teal-300 transition-all flex flex-col justify-between group">
      <div>
        {/* Top Badges & Tracking ID */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-black text-gov-navy-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
              {complaint.tracking_number}
            </span>
            <PriorityBadge priority={complaint.priority} size="sm" />
          </div>
          <StatusBadge status={complaint.status} size="sm" />
        </div>

        {/* Title */}
        <h3 className="text-base font-extrabold text-gov-navy-900 line-clamp-1 group-hover:text-gov-teal-700 transition-colors mb-2">
          {complaint.title}
        </h3>

        {/* Description preview */}
        <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
          {complaint.description}
        </p>
      </div>

      {/* Meta details footer */}
      <div className="pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
        <div className="flex items-center space-x-3">
          {complaint.department && (
            <span className="flex items-center space-x-1 font-bold text-gov-navy-900">
              <Building className="w-3.5 h-3.5 text-gov-teal-600" />
              <span>{complaint.department.code || complaint.department.name}</span>
            </span>
          )}
          {complaint.address && (
            <span className="flex items-center space-x-1 max-w-[160px] truncate" title={complaint.address}>
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{complaint.city || complaint.address}</span>
            </span>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1 text-slate-400">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formattedDate}</span>
          </span>

          {showActions && (
            <Link
              to={`/complaints/${complaint.id || complaint.tracking_number}`}
              className="inline-flex items-center space-x-1 font-bold text-gov-teal-700 hover:text-gov-teal-800 focus:outline-none focus-visible:underline"
            >
              <span>{actionLabel}</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
