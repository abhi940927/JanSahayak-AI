import React from 'react';
import {
  Check,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  UserCheck,
  ShieldCheck,
  Layers,
  Sparkles
} from 'lucide-react';

export const ComplaintTimeline = ({ history = [], currentStatus = 'submitted' }) => {
  const steps = [
    { key: 'submitted', stage: 1, label: 'Registered', description: 'Grievance lodged', icon: FileText },
    { key: 'verified', stage: 2, label: 'Verified', description: 'Desk verified', icon: CheckCircle2 },
    { key: 'assigned', stage: 3, label: 'Assigned', description: 'Field team deployed', icon: UserCheck },
    { key: 'in_progress', stage: 4, label: 'In Progress', description: 'Redressal ongoing', icon: Clock },
    { key: 'resolved', stage: 5, label: 'Resolved', description: 'Field work completed', icon: ShieldCheck }
  ];

  const getStageNumber = (status) => {
    const s = (status || 'submitted').toLowerCase();
    switch (s) {
      case 'submitted':
        return 1;
      case 'verified':
        return 2;
      case 'assigned':
        return 3;
      case 'in_progress':
      case 'under_review':
      case 'reopened':
        return 4;
      case 'resolved':
      case 'closed':
        return 5;
      default:
        return 1;
    }
  };

  const currentStage = getStageNumber(currentStatus);
  const isAllResolved = currentStage === 5;

  // Calculate percentage for active progress bar connecting nodes (4 intervals between 5 nodes)
  // Stage 1 = 0%, Stage 2 = 25%, Stage 3 = 50%, Stage 4 = 75%, Stage 5 = 100%
  const progressPercentage = Math.min(100, Math.max(0, ((currentStage - 1) / 4) * 100));

  const getStageTitle = (stage) => {
    switch (stage) {
      case 1:
        return 'Stage 1 of 5 • Grievance Registered';
      case 2:
        return 'Stage 2 of 5 • Verified & Categorized';
      case 3:
        return 'Stage 3 of 5 • Officer / Field Team Assigned';
      case 4:
        return 'Stage 4 of 5 • On-Ground Redressal In Progress';
      case 5:
        return 'Stage 5 of 5 • Grievance Successfully Resolved';
      default:
        return `Stage ${stage} of 5`;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-xs space-y-6">
      {/* Header with Title and Current Stage Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-gov-teal-600" />
            <h3 className="text-xs font-black text-gov-navy-900 uppercase tracking-widest">
              Resolution Lifecycle Stepper
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Real-time public grievance tracking milestones and immutable audit progression.
          </p>
        </div>

        <span
          className={`self-start sm:self-auto text-xs font-bold px-3 py-1 rounded-full border transition-all ${
            isAllResolved
              ? 'text-emerald-800 bg-emerald-50 border-emerald-300 ring-2 ring-emerald-100'
              : 'text-gov-teal-800 bg-gov-teal-50 border-gov-teal-200'
          }`}
        >
          {getStageTitle(currentStage)}
        </span>
      </div>

      {/* Stepper Visualization */}
      <div className="overflow-x-auto pb-4 pt-4 -mx-2 px-2">
        <div className="relative min-w-[520px] sm:min-w-0 px-6">
          {/* Background Track Line */}
          <div
            className="absolute left-10 right-10 top-5 h-1 bg-slate-200 -z-0 rounded-full"
            aria-hidden="true"
          />

          {/* Dynamic Active Progress Fill Line (Turns Green as stages increase) */}
          <div
            className="absolute left-10 top-5 h-1 bg-gradient-to-r from-emerald-500 via-gov-teal-500 to-emerald-600 -z-0 rounded-full transition-all duration-700 ease-out"
            style={{ width: `calc(${progressPercentage}% * 0.85)` }}
            aria-hidden="true"
          />

          {/* Stepper Nodes */}
          <div className="relative z-10 flex items-start justify-between">
            {steps.map((step) => {
              const isCompleted = step.stage < currentStage || (step.stage === 5 && isAllResolved);
              const isCurrent = step.stage === currentStage && !isAllResolved;
              const isUpcoming = step.stage > currentStage;
              const Icon = step.icon;

              return (
                <div
                  key={step.key}
                  className="flex flex-col items-center group relative text-center"
                  style={{ width: '80px' }}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {/* Circular Node */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 shadow-xs ${
                      isCompleted
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-emerald-200'
                        : isCurrent
                        ? 'bg-gov-teal-600 text-white ring-4 ring-gov-teal-100 scale-110 shadow-gov-teal-200 animate-pulse'
                        : 'bg-white border-2 border-slate-300 text-slate-400 group-hover:border-slate-400'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5 text-white stroke-[3]" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>

                  {/* Step Label */}
                  <div className="mt-2.5 space-y-0.5">
                    <span
                      className={`text-xs block font-bold transition-colors ${
                        isCompleted
                          ? 'text-emerald-800'
                          : isCurrent
                          ? 'text-gov-teal-800 font-black'
                          : 'text-slate-400'
                      }`}
                    >
                      {step.label}
                    </span>
                    <span className="text-[10px] text-slate-400 block leading-tight">
                      {isCompleted ? (
                        <span className="text-emerald-600 font-semibold flex items-center justify-center gap-0.5">
                          ✓ Done
                        </span>
                      ) : isCurrent ? (
                        <span className="text-gov-teal-600 font-bold">In Action</span>
                      ) : (
                        `Stage ${step.stage}`
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Audit History Log */}
      <div className="border-t border-slate-100 pt-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
            Official Audit & Action History Log
          </h4>
          <span className="text-[11px] text-slate-400">
            {history.length} Event{history.length === 1 ? '' : 's'} Logged
          </span>
        </div>

        <div className="space-y-2.5">
          {history.length === 0 ? (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 italic text-center">
              Initial grievance record filed and authenticated. Awaiting officer dispatch.
            </div>
          ) : (
            [...history].reverse().map((h, i) => (
              <div
                key={h.id || i}
                className="flex items-start space-x-3 text-xs p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap justify-between items-baseline gap-1 font-bold text-slate-800">
                    <span className="capitalize text-slate-900">
                      {h.action ? h.action.replace(/_/g, ' ') : 'Status Updated'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono font-normal">
                      {new Date(h.created_at).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  {h.remarks && (
                    <p className="text-slate-600 text-xs mt-1 leading-relaxed bg-white p-2 rounded-lg border border-slate-200/80">
                      {h.remarks}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
