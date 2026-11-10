import React, { useState, useEffect, useRef } from 'react';
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
  ExternalLink
} from 'lucide-react';
import api from '../../services/api';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000/api/ai';

export const AIChatbot = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome-1',
      sender: 'ai',
      text: "Namaste! 🙏 I am your JanSahayak AI Assistant.\n\nYou can describe any civic problem (roads, water, electricity, sanitation, police, ration, etc.) directly in plain English or हिंदी.\n\nNo need to fill out long forms—I will automatically detect the department, classify your issue, and let you file it with 1 click!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      grievance: null
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);

  // Auto-detect GPS state for the chat card
  const [gpsLoading, setGpsLoading] = useState(false);
  const [cardLocation, setCardLocation] = useState({
    address: 'Connaught Place, Central Delhi',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110001',
    latitude: 28.6315,
    longitude: 77.2167
  });

  const [filingStatus, setFilingStatus] = useState({}); // cardId -> 'filing' | 'success' | 'error'
  const [filedResults, setFiledResults] = useState({}); // cardId -> { tracking_number, id, ... }

  const messagesEndRef = useRef(null);

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
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Reverse geocode via backend proxy
          const res = await api.get(`/complaints/reverse-geocode?lat=${latitude}&lon=${longitude}`);
          if (res?.data) {
            setCardLocation({
              address: res.data.formatted_address || `${res.data.locality || 'Current Area'}, ${res.data.city || 'New Delhi'}`,
              city: res.data.city || 'New Delhi',
              state: res.data.state || 'Delhi',
              pincode: res.data.pincode || '110001',
              latitude,
              longitude
            });
          } else {
            setCardLocation(prev => ({
              ...prev,
              address: `GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
              latitude,
              longitude
            }));
          }
        } catch {
          setCardLocation(prev => ({
            ...prev,
            address: `GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            latitude,
            longitude
          }));
        } finally {
          setGpsLoading(false);
        }
      },
      (error) => {
        console.warn('[GPS Error]', error.message);
        setGpsLoading(false);
        alert('Could not retrieve your live location. Please allow location permissions in your browser.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
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
      // Call AI Chat Endpoint (via Backend proxy or Python AI service)
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
        aiResponseData = res;
      } catch (proxyErr) {
        // Direct Python AI service fallback
        const directRes = await axios.post(`${AI_SERVICE_URL}/chat`, {
          message: query,
          user_context: {
            name: user?.full_name,
            email: user?.email
          }
        });
        aiResponseData = directRes.data;
      }

      const botMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiResponseData?.reply || "I have received your grievance details. Please review the auto-generated card below to file it directly.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        grievance: aiResponseData?.grievance_draft || null
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error('[AIChatbot Error]', err);
      setMessages(prev => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: "I am having trouble connecting to the AI neural service right now. You can describe your issue with keywords like 'water', 'road', 'electricity' or use the 'File Grievance' menu.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          grievance: null
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Automated 1-Click Grievance Filing directly from Chat
  const handleInstantFileGrievance = async (messageId, grievanceDraft) => {
    setFilingStatus(prev => ({ ...prev, [messageId]: 'filing' }));

    try {
      // Map department code to Department UUID
      const matchedDept = departments.find(
        d => d.code === grievanceDraft.department_code || d.name.toLowerCase().includes((grievanceDraft.department_name || '').toLowerCase())
      ) || departments[0];

      // Map category
      const matchedCat = categories.find(
        c => (matchedDept ? c.department_id === matchedDept.id : true) &&
             (c.name.toLowerCase().includes((grievanceDraft.category_name || '').toLowerCase()) || c.code === grievanceDraft.category_code)
      ) || categories[0];

      const payload = {
        title: grievanceDraft.title || 'Civic Grievance via AI Chat',
        description: grievanceDraft.description || 'Grievance submitted through JanSahayak Real-Time AI Chat Assistant.',
        department_id: matchedDept?.id || null,
        category_id: matchedCat?.id || null,
        address: cardLocation.address,
        city: cardLocation.city,
        state: cardLocation.state,
        pincode: cardLocation.pincode,
        latitude: cardLocation.latitude,
        longitude: cardLocation.longitude,
        preferred_language: 'en'
      };

      const res = await api.post('/complaints', payload);

      if (res?.success && res?.data) {
        setFilingStatus(prev => ({ ...prev, [messageId]: 'success' }));
        setFiledResults(prev => ({
          ...prev,
          [messageId]: {
            tracking_number: res.data.tracking_number,
            id: res.data.id,
            department: matchedDept?.name || grievanceDraft.department_name,
            sla_due_at: res.data.sla_due_at
          }
        }));
      } else {
        throw new Error(res?.message || 'Failed to register grievance');
      }
    } catch (err) {
      console.error('[Instant File Error]', err);
      setFilingStatus(prev => ({ ...prev, [messageId]: 'error' }));
      alert(`Could not file grievance: ${err.message || 'Please check your connection'}`);
    }
  };

  const quickPrompts = [
    { label: "सड़क पर गड्ढा है", en: "Pothole on main road", text: "सड़क पर गहरा गड्ढा है, तुरंत मरम्मत की आवश्यकता है।" },
    { label: "पीने का पानी गंदा है", en: "Dirty tap water", text: "हमारे नल में बदबूदार और दूषित पीने का पानी आ रहा है।" },
    { label: "स्ट्रीट लाइट खराब है", en: "Broken streetlight", text: "सड़क की स्ट्रीट लाइट कई दिनों से बंद है और अंधेरा रहता है।" },
    { label: "कूड़ा नहीं उठाया गया", en: "Uncollected garbage", text: "कॉलोनी में 4 दिनों से कूड़ा नहीं उठा और बहुत बदबू आ रही है।" }
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

      {/* Floating Chat Modal / Drawer */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 w-[calc(100vw-32px)] sm:w-[440px] h-[600px] max-h-[85vh] z-50 bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 animate-in fade-in slide-in-from-bottom-6 duration-300">
          
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
                  className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-md ${
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
                  <div className="w-full mt-2.5 p-3.5 bg-gradient-to-br from-slate-800 to-slate-900/90 border border-emerald-500/40 rounded-xl shadow-xl space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-semibold text-emerald-400 tracking-wide uppercase">
                          AI Detected Grievance
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

                    <div>
                      <p className="text-xs font-medium text-slate-300">
                        <span className="text-slate-400">Department:</span> {msg.grievance.department_name} ({msg.grievance.department_code})
                      </p>
                      <p className="text-xs font-medium text-slate-300 mt-0.5">
                        <span className="text-slate-400">Category:</span> {msg.grievance.category_name}
                      </p>
                    </div>

                    {/* Location Preview with GPS auto-detect */}
                    <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-700/60 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Incident Location:
                        </span>
                        <button
                          type="button"
                          onClick={handleAutoDetectGPS}
                          disabled={gpsLoading}
                          className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 underline underline-offset-2"
                        >
                          {gpsLoading ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" /> Detecting...
                            </>
                          ) : (
                            '📍 Detect My GPS'
                          )}
                        </button>
                      </div>
                      <input
                        type="text"
                        value={cardLocation.address}
                        onChange={(e) => setCardLocation(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full bg-slate-800 text-white text-xs px-2.5 py-1.5 rounded border border-slate-700 focus:outline-none focus:border-emerald-500"
                        placeholder="Street / Colony / Landmark"
                      />
                    </div>

                    {/* Instant Filing Action */}
                    {filedResults[msg.id] ? (
                      <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/40 rounded-lg text-emerald-300 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div>
                            <p className="font-semibold text-white">Registered Successfully!</p>
                            <p className="text-[11px] text-emerald-300">
                              Tracking ID: <span className="font-mono font-bold text-white">{filedResults[msg.id].tracking_number}</span>
                            </p>
                          </div>
                        </div>
                        <a
                          href={`/track?id=${filedResults[msg.id].tracking_number}`}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded text-[11px] transition-colors"
                        >
                          Track
                        </a>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleInstantFileGrievance(msg.id, msg.grievance)}
                        disabled={filingStatus[msg.id] === 'filing'}
                        className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-[0.98] text-slate-950 font-bold text-xs rounded-lg shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                      >
                        {filingStatus[msg.id] === 'filing' ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Submitting Grievance to Department...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" /> ⚡ File Grievance Instantly (No Form Needed)
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs py-2 px-1">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>AI analyzing problem &amp; routing department...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts (Chips) */}
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
              placeholder="Describe issue in English or हिंदी... e.g. 'पानी गंदा आ रहा है'"
              className="flex-1 bg-slate-800 text-white text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500 placeholder:text-slate-500"
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
