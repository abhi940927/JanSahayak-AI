import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Zap,
  Clock,
  MapPin,
  Cpu,
  CheckCircle2,
  ArrowRight,
  Building,
  Layers,
  Search,
  FileText,
  AlertTriangle,
  Users
} from 'lucide-react';

export const Home = () => {
  const departments = [
    { code: 'PWD', name: 'Public Works Dept', desc: 'Roads, bridges, drainage, and civil infrastructure' },
    { code: 'MCD', name: 'Municipal Corporation', desc: 'Garbage disposal, sanitation, street sweeping' },
    { code: 'EPD', name: 'Electricity Board', desc: 'Power failures, dangling wires, streetlights' },
    { code: 'DJB', name: 'Water & Sewerage', desc: 'Drinking water supply, leaks, sewage overflows' },
    { code: 'TPD', name: 'Traffic & Transport', desc: 'Signals, illegal parking, mobility bottlenecks' },
    { code: 'HFW', name: 'Health & Welfare', desc: 'Clinic negligence, vector-borne disease control' }
  ];

  const faqs = [
    {
      q: 'How does AI assist in grievance resolution?',
      a: 'JanSahayak AI reads the complaint description in natural language (English, Hindi, or Punjabi), automatically detects the responsible municipal department, assesses urgent safety hazards to prioritize critical risks, and checks for duplicate complaints to speed up dispatch.'
    },
    {
      q: 'Will the AI system reject or close my complaint automatically?',
      a: 'Never. In accordance with strict judicial and governance guidelines, AI only provides intelligent recommendations. Every action, assignment, and resolution requires human review and authorization by an assigned officer.'
    },
    {
      q: 'How can I track my submitted complaint?',
      a: 'You can use your unique tracking number (e.g. JS-2026-94821) on our Track Grievance page without needing to log in, or view live status transitions directly in your Citizen Dashboard.'
    },
    {
      q: 'What happens if a complaint is not resolved within the SLA window?',
      a: 'The platform triggers automated SLA escalations to higher municipal nodal authorities and department administrators, flagging overdue complaints for priority intervention.'
    }
  ];

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-gov-navy-900 via-gov-navy-800 to-gov-navy-900 text-white pt-20 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]"></div>

        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center space-x-2 bg-gov-navy-700/80 border border-slate-700 px-3 py-1 rounded-full text-xs font-semibold text-gov-teal-400">
            <span className="w-2 h-2 rounded-full bg-gov-teal-400 animate-ping"></span>
            <span>National Smart Governance Grievance Redressal Engine</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Smart Complaints. Faster Resolution. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gov-teal-400 to-emerald-300">
              Transparent Governance.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            JanSahayak AI bridges Indian citizens directly with responsible civic authorities using NLP intelligence, automated department routing, and real-time SLA accountability.
          </p>

          {/* Action CTAs */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/citizen/file-complaint"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-gov-teal-500 hover:bg-gov-teal-600 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg hover:shadow-gov-teal-500/25 transition-all text-sm"
            >
              <span>Submit a Public Grievance</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/track"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-8 py-3.5 rounded-xl transition-all text-sm"
            >
              <Search className="w-4 h-4" />
              <span>Track Complaint Status</span>
            </Link>
          </div>

          {/* Quick Pillars */}
          <div className="pt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left border-t border-slate-800">
            <div className="flex items-center space-x-3 p-2">
              <Cpu className="w-6 h-6 text-gov-teal-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">AI Categorization</div>
                <div className="text-[11px] text-slate-400">Auto-routes to right dept</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-2">
              <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">Urgency Assessment</div>
                <div className="text-[11px] text-slate-400">Prioritizes critical hazards</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-2">
              <Clock className="w-6 h-6 text-sky-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">Time-Bound SLAs</div>
                <div className="text-[11px] text-slate-400">Automated escalations</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-2">
              <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">Verified Resolution</div>
                <div className="text-[11px] text-slate-400">Photo proof & feedback</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Redressal Workflow */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-gov-teal-600">Simple & Accountable</span>
          <h2 className="text-3xl font-extrabold text-gov-navy-900 tracking-tight mt-1">
            How JanSahayak AI Works
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            A seamless three-stage digital workflow engineered for citizens and municipal administrators.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-shadow relative">
            <div className="w-12 h-12 rounded-xl bg-gov-navy-50 text-gov-navy-900 font-extrabold flex items-center justify-center text-xl mb-6">
              01
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Citizen Submits Grievance</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Describe the problem in your natural language (English, Hindi, Punjabi) with photo evidence and location GPS.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-shadow relative">
            <div className="w-12 h-12 rounded-xl bg-gov-teal-50 text-gov-teal-600 font-extrabold flex items-center justify-center text-xl mb-6">
              02
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">AI Microservice Processing</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              NLP algorithms classify the civic department, evaluate safety risks for SLA prioritization, and scan for duplicate reports.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-shadow relative">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 font-extrabold flex items-center justify-center text-xl mb-6">
              03
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Field Officer Action & Proof</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Assigned field engineers inspect the site, resolve the grievance, upload photographic proof, and request citizen feedback.
            </p>
          </div>
        </div>
      </section>

      {/* Covered Civic Departments */}
      <section className="bg-slate-100/70 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-gov-teal-600">Inter-Agency Integration</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gov-navy-900 tracking-tight mt-1">
                Integrated Government Departments
              </h2>
            </div>
            <Link
              to="/departments"
              className="mt-4 md:mt-0 text-sm font-semibold text-gov-teal-700 hover:text-gov-teal-800 inline-flex items-center space-x-1"
            >
              <span>Explore all department SLAs</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map((dept) => (
              <div key={dept.code} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:border-slate-300 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-extrabold text-gov-teal-700 bg-gov-teal-50 px-2.5 py-1 rounded border border-gov-teal-200">
                    {dept.code}
                  </span>
                  <Building className="w-5 h-5 text-slate-400" />
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-1">{dept.name}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{dept.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-gov-teal-600">Transparency & Guidelines</span>
          <h2 className="text-3xl font-extrabold text-gov-navy-900 tracking-tight mt-1">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-800 mb-2">{faq.q}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gov-navy-900 rounded-2xl p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ready to report a civic issue in your neighborhood?
            </h2>
            <p className="text-sm text-slate-300 max-w-xl">
              File your grievance in under 2 minutes. Receive automatic tracking updates until verified field resolution.
            </p>
          </div>
          <Link
            to="/citizen/file-complaint"
            className="shrink-0 bg-gov-teal-500 hover:bg-gov-teal-600 text-white font-bold text-sm px-8 py-3.5 rounded-xl shadow transition-colors"
          >
            File Grievance Now
          </Link>
        </div>
      </section>
    </div>
  );
};
