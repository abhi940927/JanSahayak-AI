import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Building2, Phone, Mail, Clock, CheckCircle } from 'lucide-react';

export const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/departments');
      if (res.success && res.data) {
        setDepartments(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="text-center space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-gov-teal-600">Civic Service Authorities</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gov-navy-900 tracking-tight">
          Participating Government Departments & SLAs
        </h1>
        <p className="max-w-2xl mx-auto text-base text-slate-600 leading-relaxed">
          Each department operates under strict, legally committed Citizen Charter Service Level Agreements (SLAs).
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading civic departments...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => (
            <div key={dept.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-extrabold text-gov-teal-700 bg-gov-teal-50 px-2.5 py-1 rounded border border-gov-teal-200">
                    {dept.code}
                  </span>
                  <span className="flex items-center text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    SLA: {dept.sla_hours_default} Hours
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-800">{dept.name}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{dept.description}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-500">
                {dept.contact_phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{dept.contact_phone}</span>
                  </div>
                )}
                {dept.contact_email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{dept.contact_email}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
