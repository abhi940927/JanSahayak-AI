import React from 'react';
import { ShieldCheck, Cpu, Scale, Eye, Users2, FileCheck2 } from 'lucide-react';

export const About = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      {/* Header */}
      <div className="text-center space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-gov-teal-600">Smart Governance Architecture</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gov-navy-900 tracking-tight">
          About JanSahayak AI
        </h1>
        <p className="max-w-2xl mx-auto text-base text-slate-600 leading-relaxed">
          JanSahayak AI was conceived to transform conventional public grievance redressal into an intelligent, transparent, and SLA-accountable civic governance mechanism.
        </p>
      </div>

      {/* Vision & Principles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-lg bg-gov-navy-50 text-gov-navy-900 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-gov-teal-600" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Responsible AI Integration</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            AI is deployed strictly as an officer assistive tool for NLP classification and hazard prioritization. Human discretion is mandated by design for all resolution closures.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-lg bg-gov-navy-50 text-gov-navy-900 flex items-center justify-center">
            <Scale className="w-5 h-5 text-gov-teal-600" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Equitable Public Service</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Multilingual support spanning English, Hindi, and Punjabi ensures citizens can file complaints naturally without linguistic barriers or technical jargon.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-lg bg-gov-navy-50 text-gov-navy-900 flex items-center justify-center">
            <Eye className="w-5 h-5 text-gov-teal-600" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Complete Auditability</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Every status transition, assignment delegation, or SLA escalation writes an immutable record to the audit history trail, accessible to reviewing authorities.
          </p>
        </div>
      </div>

      {/* Institutional Framework */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
        <h2 className="text-xl font-bold text-gov-navy-900">Institutional Framework & Compliance</h2>
        <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
          <p>
            In modern urban administration, grievance portals frequently suffer from bureaucratic silos: complaints are forwarded between departments, lost in manual spreadsheets, or marked resolved prematurely without physical evidence.
          </p>
          <p>
            JanSahayak AI eliminates these friction points by:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Enforcing PostgreSQL Row Level Security (RLS) guaranteeing data privacy and departmental boundaries.</li>
            <li>Preventing redundant duplicate complaints using semantic embedding cosine similarity and geofence tracking.</li>
            <li>Requiring photographic evidence upon resolution, subject to direct citizen satisfaction ratings.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
