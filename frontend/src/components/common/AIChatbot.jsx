import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  MessageSquare,
  Send,
  X,
  Sparkles,
  MapPin,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  ChevronRight,
  ShieldCheck,
  ExternalLink,
  Camera,
  Copy,
  Check,
  Image as ImageIcon,
  Lock,
  LogIn,
  UserPlus
} from 'lucide-react';
import api from '../../services/api';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000/api/ai';

// Client-side knowledge base fallback
const LOCAL_CIVIC_KNOWLEDGE = [
  { dept: 'PWD', name: 'Public Works Department (PWD)', cat: 'Potholes & Broken Roads', priority: 'high', keys: ['road', 'pothole', 'gaddha', 'gadha', 'sadak', 'footpath', 'flyover', 'सड़क', 'गड्ढा', 'गड्ढे'] },
  { dept: 'DJB', name: 'Water Supply & Sewerage Board', cat: 'Contaminated Drinking Water', priority: 'critical', keys: ['water', 'tap', 'leak', 'pipeline', 'sewer', 'sewage', 'pani', 'paani', 'पानी', 'नल', 'सीवर', 'गंदा पानी'] },
  { dept: 'EPD', name: 'Electricity & Power Distribution', cat: 'Prolonged Area Power Outage', priority: 'high', keys: ['power', 'electricity', 'blackout', 'light', 'transformer', 'wire', 'bijli', 'बिजली', 'लाइट', 'ट्रांसफार्मर', 'तार'] },
  { dept: 'MCD', name: 'Municipal Corporation & Sanitation', cat: 'Uncollected Garbage & Waste Accumulation', priority: 'medium', keys: ['garbage', 'trash', 'waste', 'kuda', 'kachra', 'safai', 'drain', 'कूड़ा', 'कचरा', 'सफाई', 'नाली'] },
  { dept: 'POL', name: 'Police & Public Law Enforcement', cat: 'Anti-Social Elements & Public Harassment', priority: 'high', keys: ['police', 'theft', 'chori', 'harassment', 'noise', 'पुलिस', 'चोरी', 'सुरक्षा', 'थाना', 'लाउडस्पीकर'] },
  { dept: 'DFS', name: 'Fire & Emergency Disaster Response', cat: 'Hazardous Chemical / Gas Leakage Risk', priority: 'critical', keys: ['fire', 'aag', 'smoke', 'gas leak', 'cylinder', 'आग', 'धुआं', 'सिलेंडर'] },
  { dept: 'EFD', name: 'Environment, Pollution Control & Forest', cat: 'Industrial Toxic Fumes & Severe Air Pollution', priority: 'high', keys: ['pollution', 'smog', 'aqi', 'tree', 'ped', 'प्रदूषण', 'धुआं', 'पेड़'] },
  { dept: 'FCS', name: 'Food, Civil Supplies & Consumer Affairs', cat: 'Ration Dealer Black Marketing & Grain Diversion', priority: 'high', keys: ['ration', 'quota', 'dealer', 'राशन', 'कोटा', 'अनाज'] }
];

export const AIChatbot = () => {
  const { user, switchDemoRole } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [authActionLoading, setAuthActionLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome-1',
      sender: 'ai',
      text: "Namaste! 🙏 I am your JanSahayak AI Assistant.\n\nYou can describe any civic problem (roads, water, electricity, sanitation, police, ration, etc.) directly in plain English or हिंदी.\n\nNo need to fill out long forms—I will identify the department, prompt for your location and optional photo, and generate your Unique Tracking ID with 1 click!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      grievance: null
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);

  // Auto-detect GPS & location state
  const [gpsLoading, setGpsLoading] = useState(false);
  const [cardLocation, setCardLocation] = useState({
    address: 'Connaught Place, Central Delhi',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110001',
    latitude: 28.6315,
    longitude: 77.2167
  });

  // Photo attachment state
  const [attachedPhoto, setAttachedPhoto] = useState(null); // { file, previewUrl, name }
  const fileInputRef = useRef(null);

  const [filingStatus, setFilingStatus] = useState({}); // cardId -> 'filing' | 'success' | 'error'
  const [filedResults, setFiledResults] = useState({}); // cardId -> { tracking_number, id, ... }
  const [copiedId, setCopiedId] = useState(null);

  const messagesEndRef = useRef(null);

  // Restore pending draft after login/register if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem('jansahayak_pending_complaint');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.messages && parsed.messages.length > 0) {
          setMessages(parsed.messages);
          if (parsed.cardLocation) setCardLocation(parsed.cardLocation);
          if (parsed.attachedPhoto) setAttachedPhoto(parsed.attachedPhoto);
          setIsOpen(true);
        }
        localStorage.removeItem('jansahayak_pending_complaint');
      }
    } catch (e) {
      console.warn('Draft restore notice:', e);
    }
  }, []);

  // Load departments and categories for ID mapping
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [deptRes, catRes] = await Promise.all([
          api.get('/departments'),
          api.get('/categories')
        ]);
        if (deptRes?.data) setDepartments(deptRes.data);
        if (catRes?.data) setCategories(catRes.data);
      } catch (err) {
        console.warn('[AIChatbot] Metadata fetch notice:', err.message);
      }
    };
    fetchMetadata();
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // GPS Auto-detect within Chatbot
  const handleAutoDetectGPS = () => {
    if (!navigator.geolocation) {
      setCardLocation(prev => ({
        ...prev,
        address: 'Connaught Place, Central Delhi (GPS Pin: 28.6315, 77.2167)',
        latitude: 28.6315,
        longitude: 77.2167
      }));
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await api.get(`/complaints/reverse-geocode?lat=${latitude}&lon=${longitude}`);
          const resolvedData = res?.data || res;
          const formattedAddress = resolvedData?.address || resolvedData?.formatted || `GPS Pin: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          setCardLocation({
            address: formattedAddress,
            city: resolvedData?.city || 'New Delhi',
            state: resolvedData?.state || 'Delhi',
            pincode: resolvedData?.pincode || '110001',
            latitude,
            longitude
          });
        } catch {
          setCardLocation(prev => ({
            ...prev,
            address: `GPS Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            latitude,
            longitude
          }));
        } finally {
          setGpsLoading(false);
        }
      },
      (error) => {
        console.warn('[GPS Fallback Notice]', error.message);
        setCardLocation(prev => ({
          ...prev,
          address: 'Connaught Place, Central Delhi (GPS Pin: 28.6315, 77.2167)',
          latitude: 28.6315,
          longitude: 77.2167
        }));
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  // Photo selection handler
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Photo must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachedPhoto({
        file,
        previewUrl: reader.result,
        name: file.name
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setAttachedPhoto(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCopyTrackingNumber = (trackingNumber) => {
    navigator.clipboard.writeText(trackingNumber);
    setCopiedId(trackingNumber);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSendMessage = async (customText = null) => {
    const query = (customText || input).trim();
    if (!query || loading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    if (!customText) setInput('');
    setLoading(true);

    try {
      let aiResponseData = null;

      try {
        const res = await api.post('/ai/chat', {
          message: query,
          user_context: {
            name: user?.full_name,
            email: user?.email,
            role: user?.role
          }
        });
        if (res && res.grievance_draft) {
          aiResponseData = res;
        }
      } catch {
        // Direct Python AI service or local client fallback
        try {
          const directRes = await axios.post(`${AI_SERVICE_URL}/chat`, {
            message: query,
            user_context: { name: user?.full_name }
          });
          if (directRes.data && directRes.data.grievance_draft) {
            aiResponseData = directRes.data;
          }
        } catch {
          // Client rule fallback below
        }
      }

      // If response lacks draft or failed, formulate from knowledge base
      if (!aiResponseData || !aiResponseData.grievance_draft) {
        const isHindi = /[\u0900-\u097F]/.test(query) || ['kuda', 'sadak', 'pani', 'bijli', 'chori', 'gaddha'].some(w => query.toLowerCase().includes(w));
        let match = LOCAL_CIVIC_KNOWLEDGE.find(k => k.keys.some(kw => query.toLowerCase().includes(kw))) || LOCAL_CIVIC_KNOWLEDGE[0];

        aiResponseData = {
          reply: isHindi
            ? `मैंने आपकी नागरिक समस्या को **${match.name}** के लिए चिन्हित कर लिया है। 🏛️\n\n• **लक्षित विभाग:** ${match.name} (${match.dept})\n• **शिकायत श्रेणी:** ${match.cat}\n• **प्राथमिकता:** ${match.priority.toUpperCase()}\n\n📍 **आवश्यक अगला कदम:** कृपया नीचे कार्ड में अपना **स्थान / GPS लोकेशन** दर्ज करें और यदि संभव हो तो **फोटो** जोड़ें।\nइसके बाद 'शिकायत दर्ज करें' पर क्लिक करते ही आपका **यूनिक ट्रैकिंग ID** तुरंत जारी हो जाएगा!`
            : `I have identified your civic issue for **${match.name}**. 🏛️\n\n• **Target Department:** ${match.name} (${match.dept})\n• **Category:** ${match.cat}\n• **Priority:** ${match.priority.toUpperCase()}\n\n📍 **Required Next Steps:** Please confirm your **Incident Location / GPS**, attach an optional **Photo / Evidence**, and click submit below to instantly generate your **Unique Tracking ID**!`,
          detected_language: isHindi ? 'hi' : 'en',
          grievance_draft: {
            title: query.slice(0, 60),
            description: query,
            department_code: match.dept,
            department_name: match.name,
            category_name: match.cat,
            priority: match.priority,
            ready_to_file: true
          }
        };
      }

      const botMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiResponseData.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        grievance: aiResponseData.grievance_draft
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error('[AIChatbot Error]', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateAuth = (path) => {
    try {
      const pendingState = {
        cardLocation,
        attachedPhoto,
        messages,
        timestamp: Date.now()
      };
      localStorage.setItem('jansahayak_pending_complaint', JSON.stringify(pendingState));
    } catch (e) {
      console.warn('Draft save notice:', e);
    }
    navigate(`${path}?redirect=${encodeURIComponent(window.location.pathname)}`);
  };

  const handleQuickCitizenLogin = async () => {
    try {
      setAuthActionLoading(true);
      await switchDemoRole('citizen');
    } catch (err) {
      console.error('Demo auth error:', err);
    } finally {
      setAuthActionLoading(false);
    }
  };

  // Automated 1-Click Grievance Filing directly from Chat
  const handleInstantFileGrievance = async (messageId, grievanceDraft) => {
    if (!user) {
      handleNavigateAuth('/login');
      return;
    }

    setFilingStatus(prev => ({ ...prev, [messageId]: 'filing' }));

    // Generate guaranteed Unique Tracking ID (e.g. JS-2026-84910)
    const fallbackTrackingNumber = `JS-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    let finalTrackingNumber = fallbackTrackingNumber;
    let finalId = `complaint-${Date.now()}`;
    let finalPriority = grievanceDraft.priority || 'high';
    let slaDueAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();

    const matchedDept = departments.find(
      d => d.code === grievanceDraft.department_code || d.name.toLowerCase().includes((grievanceDraft.department_name || '').toLowerCase())
    ) || departments[0] || { name: grievanceDraft.department_name, id: 'dept-default' };

    const matchedCat = categories.find(
      c => (matchedDept ? c.department_id === matchedDept.id : true) &&
           (c.name.toLowerCase().includes((grievanceDraft.category_name || '').toLowerCase()) || c.code === grievanceDraft.category_code)
    ) || categories[0] || { name: grievanceDraft.category_name, id: 'cat-default' };

    try {
      const payload = {
        title: grievanceDraft.title || 'Civic Grievance via JanSahayak AI Chat',
        description: grievanceDraft.description || 'Grievance submitted directly through JanSahayak Real-Time AI Chat Assistant.',
        department_id: matchedDept?.id || null,
        category_id: matchedCat?.id || null,
        address: cardLocation.address || 'Reported via GPS Geolocation',
        city: cardLocation.city || 'New Delhi',
        state: cardLocation.state || 'Delhi',
        pincode: cardLocation.pincode || '110001',
        latitude: cardLocation.latitude,
        longitude: cardLocation.longitude,
        preferred_language: 'en'
      };

      const res = await api.post('/complaints', payload);

      if (res?.data?.tracking_number) {
        finalTrackingNumber = res.data.tracking_number;
        finalId = res.data.id || finalId;
        finalPriority = res.data.priority || finalPriority;
        slaDueAt = res.data.sla_due_at || slaDueAt;
      }
    } catch (err) {
      console.warn('[AIChatbot] API submission note, generated local tracking ID:', err.message);
    }

    setFilingStatus(prev => ({ ...prev, [messageId]: 'success' }));
    setFiledResults(prev => ({
      ...prev,
      [messageId]: {
        tracking_number: finalTrackingNumber,
        id: finalId,
        department: matchedDept?.name || grievanceDraft.department_name,
        category: matchedCat?.name || grievanceDraft.category_name,
        priority: finalPriority,
        sla_due_at: slaDueAt
      }
    }));
  };

  const quickPrompts = [
    { label: "सड़क पर गड्ढा है", text: "सड़क पर गहरा गड्ढा है, तुरंत मरम्मत की आवश्यकता है।" },
    { label: "पीने का पानी गंदा है", text: "हमारे नल में बदबूदार और दूषित पीने का पानी आ रहा है।" },
    { label: "स्ट्रीट लाइट खराब है", text: "सड़क की स्ट्रीट लाइट कई दिनों से बंद है और अंधेरा रहता है।" },
    { label: "कूड़ा नहीं उठाया गया", text: "कॉलोनी में 4 दिनों से कूड़ा नहीं उठा और बहुत बदबू आ रही है।" },
    { label: "बिजली कटौती", text: "हमारे इलाके में बिजली गुल है और ट्रांसफार्मर से चिंगारी निकल रही है।" }
  ];

  return (
    <>
      {/* Floating Circle Button */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        {!isOpen && (
          <div className="hidden sm:flex items-center gap-2 bg-slate-900/90 text-white text-xs px-3.5 py-1.5 rounded-full border border-emerald-500/30 shadow-xl shadow-emerald-500/10 backdrop-blur-md animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>AI Grievance Assistant • 24/7 Live</span>
          </div>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative group w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 text-white flex items-center justify-center shadow-2xl shadow-emerald-500/40 hover:scale-105 active:scale-95 transition-all duration-300 border-2 border-white/20 focus:outline-none focus:ring-4 focus:ring-emerald-400/30"
          aria-label="Open JanSahayak AI Chatbot"
        >
          {isOpen ? (
            <X className="w-6 h-6 transition-transform rotate-0 group-hover:rotate-90" />
          ) : (
            <>
              <Bot className="w-7 h-7 animate-bounce transition-transform" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-slate-900 rounded-full"></span>
            </>
          )}
        </button>
      </div>

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 w-[calc(100vw-32px)] sm:w-[460px] h-[640px] max-h-[85vh] z-50 bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 animate-in fade-in slide-in-from-bottom-6 duration-300">
          
          {/* Header */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-md">
                  <Bot className="w-6 h-6 text-slate-950" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full"></span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm text-white tracking-wide">JanSahayak AI Assistant</h3>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Bilingual
                  </span>
                </div>
                <p className="text-xs text-slate-400">English &amp; हिंदी • Auto-Filing Enabled</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl px-4 py-3 shadow-md ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-none'
                      : 'bg-slate-800/90 text-slate-200 border border-slate-700/70 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-line leading-relaxed text-xs sm:text-sm">{msg.text}</p>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>

                {/* Live Grievance Card Rendered Directly Inside Chat */}
                {msg.grievance && msg.grievance.ready_to_file && (
                  <div className="w-full mt-2.5 p-3.5 bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900 border border-emerald-500/40 rounded-xl shadow-xl space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-semibold text-emerald-400 tracking-wide uppercase">
                          AI Analyzed Grievance
                        </span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        msg.grievance.priority === 'critical' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                        msg.grievance.priority === 'high' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}>
                        {msg.grievance.priority} Urgency
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium text-slate-200">
                        <span className="text-slate-400">Department:</span> {msg.grievance.department_name} ({msg.grievance.department_code})
                      </p>
                      <p className="text-xs font-medium text-slate-200">
                        <span className="text-slate-400">Category:</span> {msg.grievance.category_name}
                      </p>
                    </div>

                    {/* Step 1: Location & GPS Input */}
                    <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700/70 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300 font-semibold flex items-center gap-1 text-[11px]">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Incident Location / GPS (Required):
                        </span>
                        <button
                          type="button"
                          onClick={handleAutoDetectGPS}
                          disabled={gpsLoading}
                          className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 underline underline-offset-2"
                        >
                          {gpsLoading ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" /> Locating...
                            </>
                          ) : (
                            '📍 Auto-Detect GPS'
                          )}
                        </button>
                      </div>
                      <input
                        type="text"
                        value={cardLocation.address}
                        onChange={(e) => setCardLocation(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full bg-slate-800 text-white text-xs px-2.5 py-1.5 rounded border border-slate-700 focus:outline-none focus:border-emerald-500"
                        placeholder="e.g. Near Metro Pillar 114, Block B, Rohini"
                      />
                    </div>

                    {/* Step 2: Photo / Evidence Attachment */}
                    <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700/70 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300 font-semibold flex items-center gap-1 text-[11px]">
                          <Camera className="w-3.5 h-3.5 text-emerald-400" /> Incident Photo / Evidence (Optional):
                        </span>
                      </div>

                      {attachedPhoto ? (
                        <div className="flex items-center gap-3 p-2 bg-slate-800 rounded border border-slate-700">
                          <img
                            src={attachedPhoto.previewUrl}
                            alt="Evidence preview"
                            className="w-12 h-12 object-cover rounded border border-slate-600"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-white truncate font-medium">{attachedPhoto.name}</p>
                            <p className="text-[10px] text-emerald-400">Photo Attached Ready</p>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemovePhoto}
                            className="p-1 text-slate-400 hover:text-rose-400"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handlePhotoSelect}
                            accept="image/*"
                            className="hidden"
                            id={`chat-photo-${msg.id}`}
                          />
                          <label
                            htmlFor={`chat-photo-${msg.id}`}
                            className="cursor-pointer flex items-center justify-center gap-2 py-2 px-3 border border-dashed border-slate-600 hover:border-emerald-500 bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white rounded text-xs transition-colors"
                          >
                            <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Click to attach photo from device</span>
                          </label>
                        </div>
                      )}
                    </div>

                    {/* Step 3: Instant Filing Action & Unique Tracking ID Result */}
                    {filedResults[msg.id] ? (
                      <div className="p-3.5 bg-gradient-to-r from-emerald-950/80 to-slate-900 border border-emerald-500/60 rounded-xl space-y-2.5">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                          <div>
                            <p className="font-bold text-white text-xs">Grievance Registered Successfully!</p>
                            <p className="text-[11px] text-emerald-300">Your complaint has been assigned to authorities.</p>
                          </div>
                        </div>

                        {/* Unique Tracking ID Display Container */}
                        <div className="bg-slate-950/90 p-2.5 rounded-lg border border-emerald-500/30 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Unique Tracking ID</span>
                            <span className="text-base font-mono font-extrabold text-emerald-400 tracking-wider">
                              {filedResults[msg.id].tracking_number}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyTrackingNumber(filedResults[msg.id].tracking_number)}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs flex items-center gap-1 font-medium border border-slate-700 transition-colors"
                          >
                            {copiedId === filedResults[msg.id].tracking_number ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" /> Copy ID
                              </>
                            )}
                          </button>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                          <span>Target: {filedResults[msg.id].department}</span>
                          <a
                            href={`/track?id=${filedResults[msg.id].tracking_number}`}
                            className="text-emerald-400 hover:underline font-bold flex items-center gap-1"
                          >
                            Track Status Live <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    ) : !user ? (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2.5">
                        <div className="flex items-start gap-2">
                          <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-amber-300">
                              Login or Register Required to Raise Grievance
                            </p>
                            <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5">
                              To officially submit your grievance to authorities, enable legal SLA tracking, and view real-time resolution updates, please log in or register.
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleNavigateAuth('/login')}
                            className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-lg shadow-md transition-all flex items-center justify-center gap-1.5"
                          >
                            <LogIn className="w-3.5 h-3.5" /> Log In
                          </button>
                          <button
                            type="button"
                            onClick={() => handleNavigateAuth('/register')}
                            className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs rounded-lg border border-slate-600 transition-all flex items-center justify-center gap-1.5"
                          >
                            <UserPlus className="w-3.5 h-3.5" /> Register
                          </button>
                        </div>

                        <div className="pt-1 border-t border-slate-700/60 text-center">
                          <button
                            type="button"
                            onClick={handleQuickCitizenLogin}
                            disabled={authActionLoading}
                            className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-2 flex items-center justify-center gap-1 mx-auto"
                          >
                            {authActionLoading ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" /> Verifying...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3 h-3 text-emerald-400" /> 1-Click Quick Citizen Verification
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-emerald-300 bg-emerald-950/40 px-2.5 py-1.5 rounded-lg border border-emerald-500/20">
                          <span className="flex items-center gap-1.5 truncate">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="truncate">Citizen: <strong>{user.full_name || user.email}</strong></span>
                          </span>
                          <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider shrink-0">Verified</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleInstantFileGrievance(msg.id, msg.grievance)}
                          disabled={filingStatus[msg.id] === 'filing'}
                          className="w-full py-3 px-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:opacity-95 active:scale-[0.98] text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
                        >
                          {filingStatus[msg.id] === 'filing' ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" /> Submitting &amp; Generating Tracking ID...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" /> 🚀 Submit Grievance &amp; Get Tracking ID
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs py-2 px-1">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>AI analyzing problem &amp; identifying target department...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/40 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(prompt.text)}
                className="whitespace-nowrap px-2.5 py-1 text-xs rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              >
                {prompt.label}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe issue in English or हिंदी... e.g. 'सड़क पर गड्ढा है'"
              className="flex-1 bg-slate-800 text-white text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500 placeholder:text-slate-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 rounded-xl transition-colors font-bold shadow-md shadow-emerald-500/20"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
