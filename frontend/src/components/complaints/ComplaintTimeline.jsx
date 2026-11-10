import React from 'react';
import { CheckCircle2, Clock, AlertCircle, FileText, UserCheck, ShieldCheck } from 'lucide-react';

export const ComplaintTimeline = ({ history = [], currentStatus = 'submitted' }) => {
  const steps = [
    { key: 'submitted', label: 'Registered', icon: FileText },
    { key: 'verified', label: 'Categorized', icon: CheckCircle2 },
    { key: 'assigned', label: 'Assigned', icon: UserCheck },
    { key: 'in_progress', label: 'In Progress', icon: Clock },
    { key: 'resolved', label: 'Resolved', icon: ShieldCheck }
  ];

  const statusOrder = ['submitted', 'verified', 'assigned', 'in_progress', 'under_review', 'resolved', 'closed'];
  const currentIndex = statusOrder.indexOf((currentStatus || 'submitted').toLowerCase());

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xs font-black text-gov-navy-900 uppercase tracking-widest">
          Resolution Lifecycle Stepper
        </h3>
        <span className="text-[11px] font-bold text-gov-teal-700 bg-gov-teal-50 px-2.5 py-0.5 rounded-full border border-gov-teal-200">
          Stage {Math.max(1, currentIndex + 1)} of 5
        </span>
      </div>

      {/* Stepper bar with mobile scroll resilience */}
      <div className="overflow-x-auto pb-4 pt-2 -mx-2 px-2">
        <div className="relative flex items-center justify-between min-w-[380px] sm:min-w-0">
          <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 -z-0" aria-hidden="true"></div>
          {steps.map((step, idx) => {
            const stepIndex = statusOrder.indexOf(step.key);
            const isPassed = stepIndex <= currentIndex;
            const isCurrent = step.key === currentStatus || (step.key === 'resolved' && currentStatus === 'closed');
            const Icon = step.icon;

            return (
              <div
                key={step.key}
                className="relative z-10 flex flex-col items-center group"
                aria-current={isCurrent ? 'step' : undefined}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                    isCurrent
                      ? 'bg-gov-teal-600 text-white ring-4 ring-gov-teal-100 scale-110'
                      : isPassed
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white border-2 border-slate-300 text-slate-400'
                  }`}
                >
                  {isPassed ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span
                  className={`text-[11px] font-bold mt-2 text-center max-w-[75px] leading-tight ${
                    isCurrent ? 'text-gov-teal-800' : isPassed ? 'text-slate-800' : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Audit History Log */}
      <div className="border-t border-slate-100 pt-4 mt-2">
        <h4 className="text-xs font-extrabold text-slate-700 mb-3 uppercase tracking-wider">
          Action History Log
        </h4>
        <div className="space-y-3">
          {history.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Initial grievance record filed in system.</p>
          ) : (
            history.map((h, i) => (
              <div key={h.id || i} className="flex items-start space-x-3 text-xs p-2 rounded-lg hover:bg-slate-50 transition-colors">
                <span className="w-2 h-2 rounded-full bg-gov-teal-500 mt-1.5 shrink-0"></span>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap justify-between items-baseline gap-1 font-bold text-slate-800">
                    <span className="capitalize">{h.action ? h.action.replace('_', ' ') : 'Status Updated'}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {new Date(h.created_at).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  {h.remarks && <p className="text-slate-600 text-xs mt-0.5 leading-relaxed">{h.remarks}</p>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
