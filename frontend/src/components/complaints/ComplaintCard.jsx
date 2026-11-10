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
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between group">
      <div>
        {/* Top Badges & Tracking ID */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-bold text-gov-navy-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {complaint.tracking_number}
            </span>
            <PriorityBadge priority={complaint.priority} />
          </div>
          <StatusBadge status={complaint.status} />
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-slate-800 line-clamp-1 group-hover:text-gov-teal-700 transition-colors mb-2">
          {complaint.title}
        </h3>

        {/* Description preview */}
        <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
          {complaint.description}
        </p>
      </div>

      {/* Meta details footer */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
        <div className="flex items-center space-x-3">
          {complaint.department && (
            <span className="flex items-center space-x-1 font-medium text-slate-700">
              <Building className="w-3.5 h-3.5 text-gov-teal-600" />
              <span>{complaint.department.code || complaint.department.name}</span>
            </span>
          )}
          {complaint.address && (
            <span className="flex items-center space-x-1 max-w-[150px] truncate" title={complaint.address}>
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate">{complaint.city || complaint.address}</span>
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <span className="flex items-center space-x-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{formattedDate}</span>
          </span>

          {showActions && (
            <Link
              to={`/complaints/${complaint.id || complaint.tracking_number}`}
              className="inline-flex items-center space-x-1 font-semibold text-gov-teal-700 hover:text-gov-teal-800 ml-2"
            >
              <span>{actionLabel}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
