import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Cpu,
  UserCheck,
  CheckCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building
} from 'lucide-react';

export const HowItWorks = () => {
  const steps = [
    {
      num: '01',
      title: 'Citizen Filing & Auto-Enrichment',
      desc: 'Citizen submits the grievance description, uploads photos, and allows device geolocation tagging. The platform generates a unique tracking number (e.g. JS-2026-XXXXX).'
    },
    {
      num: '02',
      title: 'Cognitive AI Analysis Microservice',
      desc: 'Our FastAPI service evaluates the text using Scikit-learn NLP models to identify the department, assesses public hazard risks to assign SLA priorities (Critical 12h, High 24h, Medium 48h), and scans the radius for potential duplicate tickets.'
    },
    {
      num: '03',
      title: 'Jurisdiction Assignment & Dispatch',
      desc: 'The complaint enters the active queue of the designated department. Department administrators or auto-routing rules assign the ticket to the relevant field executive engineer.'
    },
    {
      num: '04',
      title: 'Field Investigation & Resolution Proof',
      desc: 'The assigned officer inspects the ground situation, updates work progress notes, and completes necessary repairs. To mark the ticket resolved, photographic resolution evidence is uploaded.'
    },
    {
      num: '05',
      title: 'Citizen Verification & Closure',
      desc: 'The citizen receives an immediate notification, reviews the resolution photo, and submits a 1-5 star satisfaction rating. If unsatisfied, the citizen can request a formal reopening.'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      <div className="text-center space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-gov-teal-600">Lifecycle Walkthrough</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gov-navy-900 tracking-tight">
          How JanSahayak AI Redresses Grievances
        </h1>
        <p className="max-w-2xl mx-auto text-base text-slate-600 leading-relaxed">
          From the moment a citizen encounters a broken road or water leak to verified on-ground repair, here is the complete end-to-end lifecycle.
        </p>
      </div>

      <div className="space-y-6">
        {steps.map((s, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start gap-6">
            <div className="w-12 h-12 rounded-xl bg-gov-navy-900 text-gov-teal-400 font-extrabold flex items-center justify-center text-lg shrink-0">
              {s.num}
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-800">{s.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gov-teal-50 border border-gov-teal-200 rounded-2xl p-8 text-center space-y-4">
        <h3 className="text-xl font-bold text-gov-teal-900">Experience the System in Action</h3>
        <p className="text-sm text-gov-teal-800 max-w-xl mx-auto">
          Try filing a demo complaint or inspect live officer queues with our frictionless role switcher.
        </p>
        <Link
          to="/citizen/file-complaint"
          className="inline-flex items-center space-x-2 bg-gov-teal-600 hover:bg-gov-teal-700 text-white font-bold px-6 py-3 rounded-lg text-sm shadow transition-colors"
        >
          <span>File a Demo Grievance</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
