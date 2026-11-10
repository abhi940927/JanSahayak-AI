import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import api from '../../services/api';
import axios from 'axios';
import {
  FilePlus,
  MapPin,
  UploadCloud,
  Cpu,
  AlertCircle,
  CheckCircle2,
  Navigation,
  Sparkles,
  Info
} from 'lucide-react';

const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000/api/ai';

export const FileComplaint = () => {
  const navigate = useNavigate();

  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    department_id: '',
    address: '',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110001',
    latitude: null,
    longitude: null,
    preferred_language: 'en',
    consent: false
  });

  // AI Assistant Prediction State
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const [attachments, setAttachments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchMetadata();
  }, []);

  const fetchMetadata = async () => {
    try {
      const [deptRes, catRes] = await Promise.all([
        api.get('/departments'),
        api.get('/categories')
      ]);
      if (deptRes.success) setDepartments(deptRes.data);
      if (catRes.success) setCategories(catRes.data);
    } catch (err) {
      console.error('Failed to load categories/departments:', err);
    }
  };

  // Trigger live AI classification preview on debounce
  useEffect(() => {
    if (formData.title.length > 5 || formData.description.length > 15) {
      const timer = setTimeout(() => {
        triggerAiPrediction();
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [formData.title, formData.description]);

  const triggerAiPrediction = async () => {
    try {
      setAiLoading(true);
      const res = await axios.post(`${AI_SERVICE_URL}/classify`, {
        title: formData.title,
        description: formData.description || formData.title
      });

      if (res.data) {
        setAiSuggestion(res.data);
        // Automatically auto-select department if citizen has not manually picked one
        if (!selectedDept && res.data.predicted_department) {
          const matched = departments.find(d => d.code === res.data.predicted_department);
          if (matched) {
            setSelectedDept(matched.id);
            setFormData(prev => ({ ...prev, department_id: matched.id }));
          }
        }
      }
    } catch (err) {
      // Fallback silently if AI microservice is sleeping
    } finally {
      setAiLoading(false);
    }
  };

  const handleFetchLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData(prev => ({
          ...prev,
          latitude: parseFloat(pos.coords.latitude.toFixed(6)),
          longitude: parseFloat(pos.coords.longitude.toFixed(6)),
          address: prev.address || 'Near Geolocation Pin (Auto-captured)'
        }));
      },
      (err) => {
        alert('Could not fetch location: ' + err.message);
      }
    );
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Each file must be under 5MB');
        return;
      }
      // Demo simulated file object
      setAttachments(prev => [
        ...prev,
        {
          file_name: file.name,
          file_url: URL.createObjectURL(file),
          file_type: file.type || 'image/jpeg',
          file_size_bytes: file.size
        }
      ]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.address) {
      setError('Please fill in all mandatory fields');
      return;
    }
    if (!formData.consent) {
      setError('You must confirm the privacy and honesty declaration');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const payload = {
        title: formData.title,
        description: formData.description,
        department_id: formData.department_id || selectedDept || null,
        category_id: formData.category_id || null,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        latitude: formData.latitude,
        longitude: formData.longitude,
        preferred_language: formData.preferred_language,
        attachments: attachments
      };

      const res = await api.post('/complaints', payload);
      if (res.success) {
        setSuccess(res.data);
        setTimeout(() => {
          navigate(`/complaints/${res.data.id || res.data.tracking_number}`);
        }, 1800);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit grievance');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout
      title="File a Public Grievance"
      subtitle="Submit civic complaints with AI-assisted category prediction and location tagging."
    >
      <div className="max-w-3xl bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            <div>
              <span className="font-bold">Grievance Registered Successfully!</span>
              <p className="mt-0.5">Tracking Number: <span className="font-mono font-bold">{success.tracking_number}</span>. Redirecting to status timeline...</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Complaint Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Broken road and deep pothole causing traffic jam near Metro pillar"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gov-teal-500 focus:bg-white"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Detailed Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the issue, landmarks, safety risks, and duration of the problem in English, Hindi, or Punjabi..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gov-teal-500 focus:bg-white"
            />
          </div>

          {/* Live AI Assistant Suggestion Pill */}
          {aiSuggestion && (
            <div className="bg-gov-teal-50/70 border border-gov-teal-200 rounded-xl p-3.5 flex items-start space-x-3 text-xs">
              <Sparkles className="w-5 h-5 text-gov-teal-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold text-gov-teal-900">JanSahayak AI Recommendation:</span>
                <div className="mt-1 flex flex-wrap gap-2 items-center text-slate-700">
                  <span>Routing to: <strong className="text-gov-navy-900">{aiSuggestion.predicted_department}</strong></span>
                  <span>•</span>
                  <span>Category: <strong className="text-gov-navy-900">{aiSuggestion.predicted_category}</strong></span>
                  <span>•</span>
                  <span>Confidence: <strong className="text-gov-teal-700">{(aiSuggestion.confidence_score * 100).toFixed(0)}%</strong></span>
                </div>
              </div>
            </div>
          )}

          {/* Department & Category Select */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Department
              </label>
              <select
                value={selectedDept}
                onChange={(e) => {
                  setSelectedDept(e.target.value);
                  setFormData({ ...formData, department_id: e.target.value, category_id: '' });
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gov-teal-500"
              >
                <option value="">-- Let AI Auto-Assign or Choose --</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Issue Category
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gov-teal-500"
              >
                <option value="">-- Select Category --</option>
                {categories
                  .filter(c => !selectedDept || c.department_id === selectedDept)
                  .map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
              </select>
            </div>
          </div>

          {/* Location & Geolocation */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Location Details <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleFetchLocation}
                className="inline-flex items-center space-x-1 text-xs font-semibold text-gov-teal-700 hover:text-gov-teal-800"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Auto-Detect My GPS</span>
              </button>
            </div>

            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="House/Street/Landmark, e.g. Outer Ring Road, Near Metro Pillar 114"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gov-teal-500"
            />

            <div className="grid grid-cols-3 gap-3">
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="City"
                className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="State"
                className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
              <input
                type="text"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                placeholder="Pincode (6 digits)"
                className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            {formData.latitude && (
              <div className="text-[11px] text-gov-teal-700 font-mono">
                📍 Coordinates Captured: {formData.latitude}, {formData.longitude}
              </div>
            )}
          </div>

          {/* Photo / Document Upload */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Supporting Photo / Evidence (Optional, max 5MB)
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors">
              <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-gov-teal-50 file:text-gov-teal-700 hover:file:bg-gov-teal-100"
              />
              <div className="text-[11px] text-slate-400 mt-1">Accepted: JPG, PNG, PDF</div>
            </div>

            {attachments.length > 0 && (
              <div className="mt-2 space-y-1">
                {attachments.map((a, i) => (
                  <div key={i} className="text-xs font-medium text-slate-600 flex items-center space-x-1">
                    <span>✓</span>
                    <span>{a.file_name} ({(a.file_size_bytes / 1024).toFixed(1)} KB)</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Declaration and Consent */}
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-start space-x-2 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={formData.consent}
                onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                className="mt-0.5 rounded border-slate-300 text-gov-teal-600 focus:ring-gov-teal-500"
              />
              <span className="text-xs text-slate-600 leading-snug">
                I hereby declare that the particulars provided in this grievance are genuine and accurate to the best of my knowledge.
              </span>
            </label>
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gov-teal-600 hover:bg-gov-teal-700 text-white font-bold py-3 rounded-xl text-sm shadow-md transition-all flex items-center justify-center space-x-2"
          >
            <FilePlus className="w-4 h-4" />
            <span>{submitting ? 'Registering Grievance with AI Engine...' : 'Submit Grievance for Redressal'}</span>
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
};
