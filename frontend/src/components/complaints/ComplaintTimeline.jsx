import React from 'react';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export const ComplaintTimeline = ({ history = [], currentStatus = 'submitted' }) => {
  const steps = [
    { key: 'submitted', label: 'Registered' },
    { key: 'verified', label: 'Verified & Categorized' },
    { key: 'assigned', label: 'Officer Assigned' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'resolved', label: 'Resolved' }
  ];

  const statusOrder = ['submitted', 'verified', 'assigned', 'in_progress', 'under_review', 'resolved', 'closed'];
  const currentIndex = statusOrder.indexOf(currentStatus.toLowerCase());

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">
        Resolution Lifecycle Stepper
      </h3>

      {/* Stepper bar */}
      <div className="relative flex items-center justify-between mb-8">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 w-full -z-0"></div>
        {steps.map((step, idx) => {
          const stepIndex = statusOrder.indexOf(step.key);
          const isPassed = stepIndex <= currentIndex;
          const isCurrent = step.key === currentStatus || (step.key === 'resolved' && currentStatus === 'closed');

          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isCurrent
                    ? 'bg-gov-teal-600 text-white ring-4 ring-gov-teal-100'
                    : isPassed
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white border-2 border-slate-300 text-slate-400'
                }`}
              >
                {isPassed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
              </div>
              <span className={`text-[11px] font-medium mt-2 text-center max-w-[80px] ${
                isCurrent ? 'text-gov-teal-800 font-bold' : isPassed ? 'text-slate-800' : 'text-slate-400'
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Audit History Log */}
      <div className="border-t border-slate-100 pt-4">
        <h4 className="text-xs font-bold text-slate-600 mb-3">Action History Trail</h4>
        <div className="space-y-3">
          {history.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Initial grievance record filed.</p>
          ) : (
            history.map((h, i) => (
              <div key={h.id || i} className="flex items-start space-x-3 text-xs">
                <span className="w-2 h-2 rounded-full bg-gov-teal-500 mt-1.5 shrink-0"></span>
                <div className="flex-1">
                  <div className="flex justify-between font-semibold text-slate-800">
                    <span>{h.action}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {new Date(h.created_at).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  {h.remarks && <p className="text-slate-600 mt-0.5">{h.remarks}</p>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
