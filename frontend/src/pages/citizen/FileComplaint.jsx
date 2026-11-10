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
  Loader2,
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

  // Geolocation & Address Auto-Detection State
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState(''); // 'locating' | 'success' | 'error' | ''
  const [gpsMessage, setGpsMessage] = useState('');

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
        // Automatically auto-select department and category if citizen has not manually picked one
        if (!selectedDept && res.data.predicted_department) {
          const matchedDept = departments.find(d => d.code === res.data.predicted_department);
          if (matchedDept) {
            setSelectedDept(matchedDept.id);
            let matchedCatId = '';
            if (res.data.predicted_category) {
              const normCat = res.data.predicted_category.toLowerCase();
              const matchedCat = categories.find(c => 
                c.department_id === matchedDept.id && (
                  c.name.toLowerCase().includes(normCat) ||
                  normCat.includes(c.name.toLowerCase()) ||
                  c.code.toLowerCase().includes(normCat)
                )
              );
              if (matchedCat) matchedCatId = matchedCat.id;
            }
            setFormData(prev => ({ 
              ...prev, 
              department_id: matchedDept.id,
              category_id: prev.category_id || matchedCatId
            }));
          }
        }
      }
    } catch (err) {
      // Fallback silently if AI microservice is sleeping
    } finally {
      setAiLoading(false);
    }
  };

  const handleFetchLocation = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setGpsLoading(true);
    setGpsStatus('locating');
    setGpsMessage('Connecting to GPS satellite and acquiring coordinates...');

    const resolveLocationDetails = async (lat, lon) => {
      let resolvedAddress = '';
      let resolvedCity = '';
      let resolvedState = '';
      let resolvedPincode = '';

      // 1. Try OpenStreetMap Nominatim reverse geocoding
      try {
        const osmRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
          { headers: { Accept: 'application/json' } }
        );
        if (osmRes.ok) {
          const osmData = await osmRes.json();
          if (osmData && osmData.address) {
            const a = osmData.address;
            const streetParts = [
              a.road || a.pedestrian || a.street || a.neighbourhood || osmData.name,
              a.suburb || a.residential || a.subdistrict
            ].filter(Boolean);

            resolvedAddress = streetParts.join(', ') || osmData.display_name?.split(',').slice(0, 2).join(',') || '';
            resolvedCity = a.city || a.town || a.village || a.county || a.state_district || '';
            resolvedState = a.state || '';
            resolvedPincode = a.postcode ? a.postcode.replace(/\D/g, '').slice(0, 6) : '';
          }
        }
      } catch (e) {
        console.warn('[GPS] Nominatim fetch warning:', e.message);
      }

      // 2. If city or address not fully resolved, try BigDataCloud client API
      if (!resolvedCity || !resolvedAddress) {
        try {
          const bdcRes = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
          );
          if (bdcRes.ok) {
            const bdcData = await bdcRes.json();
            if (bdcData) {
              if (!resolvedCity) resolvedCity = bdcData.city || bdcData.locality || '';
              if (!resolvedState) resolvedState = bdcData.principalSubdivision || '';
              if (!resolvedPincode && bdcData.postcode) {
                resolvedPincode = bdcData.postcode.replace(/\D/g, '').slice(0, 6);
              }
              if (!resolvedAddress) {
                const localityParts = [bdcData.locality, bdcData.city].filter(Boolean);
                resolvedAddress = localityParts.length > 0 ? `Near ${localityParts.join(', ')}` : '';
              }
            }
          }
        } catch (e) {
          console.warn('[GPS] BigDataCloud client warning:', e.message);
        }
      }

      // 3. Fallback to backend reverse proxy if needed
      if (!resolvedCity) {
        try {
          const apiRes = await api.get(`/complaints/geo/reverse?lat=${lat}&lon=${lon}`);
          if (apiRes.success && apiRes.data) {
            resolvedAddress = resolvedAddress || apiRes.data.address;
            resolvedCity = resolvedCity || apiRes.data.city;
            resolvedState = resolvedState || apiRes.data.state;
            resolvedPincode = resolvedPincode || apiRes.data.pincode;
          }
        } catch (e) {
          console.warn('[GPS] Backend reverse geocode warning:', e.message);
        }
      }

      const finalAddress = resolvedAddress || `Near Coordinates (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
      const finalCity = resolvedCity || 'Delhi';
      const finalState = resolvedState || 'Delhi';

      setFormData(prev => ({
        ...prev,
        latitude: lat,
        longitude: lon,
        address: finalAddress,
        city: finalCity,
        state: finalState,
        pincode: resolvedPincode || prev.pincode || ''
      }));

      setGpsStatus('success');
      setGpsMessage(`Location captured: ${finalAddress}, ${finalCity} (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
    };

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lon = parseFloat(pos.coords.longitude.toFixed(6));
        setGpsMessage('Coordinates locked! Resolving address and locality details...');
        await resolveLocationDetails(lat, lon);
        setGpsLoading(false);
      },
      async (err) => {
        console.warn('Browser GPS warning:', err.code, err.message);
        setGpsMessage('GPS satellite signal unavailable. Resolving approximate network location...');

        // Try IP-based location fallback so the citizen is never stranded
        try {
          const ipRes = await api.get('/complaints/geo/ip-lookup');
          if (ipRes.success && ipRes.data) {
            const d = ipRes.data;
            setFormData(prev => ({
              ...prev,
              latitude: d.latitude,
              longitude: d.longitude,
              address: prev.address || d.address,
              city: d.city,
              state: d.state,
              pincode: d.pincode || prev.pincode || ''
            }));
            setGpsStatus('success');
            setGpsMessage(`Network location applied: ${d.city}, ${d.state} (Please verify street landmark)`);
          } else {
            setGpsStatus('error');
            setGpsMessage('Could not acquire location. Please enter your address manually.');
          }
        } catch (ipErr) {
          setGpsStatus('error');
          setGpsMessage(
            err.code === 1
              ? 'Location permission denied. Please allow location access in your browser or enter your address.'
              : 'Unable to retrieve location. Please enter your address manually.'
          );
        } finally {
          setGpsLoading(false);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
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
      setError('Please fill in all mandatory fields (Title, Description, and Address)');
      return;
    }
    if (formData.title.trim().length < 5) {
      setError(`Complaint title must be at least 5 characters (currently ${formData.title.trim().length})`);
      return;
    }
    if (formData.description.trim().length < 10) {
      setError(`Detailed description must be at least 10 characters (currently ${formData.description.trim().length})`);
      return;
    }
    if (formData.address.trim().length < 5) {
      setError('Please provide a specific street address or landmark (at least 5 characters)');
      return;
    }
    if (formData.pincode && formData.pincode.trim() && !/^\d{6}$/.test(formData.pincode.trim())) {
      setError('Pincode must be exactly 6 digits (e.g. 110001, 144111)');
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
        title: formData.title.trim(),
        description: formData.description.trim(),
        department_id: formData.department_id || selectedDept || null,
        category_id: formData.category_id || null,
        address: formData.address.trim(),
        city: formData.city.trim() || 'New Delhi',
        state: formData.state.trim() || 'Delhi',
        pincode: formData.pincode ? formData.pincode.trim() : null,
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
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Complaint Title <span className="text-rose-500">*</span>
              </label>
              <span className={`text-[11px] ${formData.title.trim().length >= 5 ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                {formData.title.trim().length} / 5 chars min
              </span>
            </div>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Broken road and deep pothole causing traffic jam near Metro pillar"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gov-teal-500 focus:bg-white"
            />
          </div>

          {/* Language Selection & Description */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Detailed Description <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center space-x-2">
                <span className={`text-[11px] font-semibold ${formData.description.trim().length >= 10 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {formData.description.trim().length} / 10 chars min
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-[11px] text-slate-400 font-medium">Language:</span>
                {[
                  { code: 'en', label: 'English' },
                  { code: 'hi', label: 'हिन्दी' },
                  { code: 'pa', label: 'ਪੰਜਾਬੀ' }
                ].map(l => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => setFormData({ ...formData, preferred_language: l.code })}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-all ${
                      formData.preferred_language === l.code
                        ? 'bg-gov-teal-600 text-white border-gov-teal-600'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={
                formData.preferred_language === 'hi'
                  ? 'अपनी शिकायत, क्षेत्र, सड़क या समस्या का विस्तृत विवरण हिन्दी में लिखें...'
                  : formData.preferred_language === 'pa'
                  ? 'ਆਪਣੀ ਸ਼ਿਕਾਇਤ ਅਤੇ ਸਮੱਸਿਆ ਦਾ ਵੇਰਵਾ ਪੰਜਾਬੀ ਵਿੱਚ ਦਰਜ ਕਰੋ...'
                  : 'Describe the issue, landmarks, safety risks, and duration of the problem in English, Hindi, or Punjabi...'
              }
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
                disabled={gpsLoading}
                className="inline-flex items-center space-x-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-gov-teal-50 text-gov-teal-700 hover:bg-gov-teal-100 border border-gov-teal-200 transition-colors disabled:opacity-60 cursor-pointer"
              >
                {gpsLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-gov-teal-600" />
                ) : (
                  <Navigation className="w-3.5 h-3.5 text-gov-teal-600" />
                )}
                <span>{gpsLoading ? 'Locating...' : 'Auto-Detect My GPS'}</span>
              </button>
            </div>

            {gpsMessage && (
              <div
                className={`p-2.5 rounded-lg text-xs flex items-center space-x-2 border ${
                  gpsStatus === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : gpsStatus === 'locating'
                    ? 'bg-sky-50 text-sky-800 border-sky-200 animate-pulse'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {gpsStatus === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : gpsStatus === 'locating' ? (
                  <Loader2 className="w-4 h-4 text-sky-600 animate-spin shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <span className="leading-snug">{gpsMessage}</span>
              </div>
            )}

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
              <div className="text-[11px] text-gov-teal-700 font-mono flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-gov-teal-600 shrink-0" />
                <span>Geotag Coordinates: {formData.latitude}, {formData.longitude}</span>
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
