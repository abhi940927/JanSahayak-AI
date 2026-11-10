import { v4 as uuidv4 } from 'uuid';
import { supabase, isSupabaseConfigured } from '../config/supabase.js';
import {
  mockComplaints,
  mockHistory,
  mockDepartments,
  mockCategories,
  mockNotifications,
  mockUsers
} from './mockDataStore.js';
import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export class ComplaintService {
  /**
   * Generates tracking ID like JS-2026-83912
   */
  static generateTrackingNumber() {
    const year = new Date().getFullYear();
    const randomCode = Math.floor(10000 + Math.random() * 90000);
    return `JS-${year}-${randomCode}`;
  }

  /**
   * Request AI predictions (Classification & Priority) with graceful fallback
   */
  static async requestAIPredictions(title, description) {
    let deptCode = 'MCD';
    let confidence = 0.85;
    let modelName = 'JanSahayak-Tfidf-LogReg-v1';
    let modelVersion = '1.0.0';
    let priority = 'medium';
    let slaHours = 48;

    try {
      // Parallel fetch from AI classification and priority endpoints
      const [classifyRes, priorityRes] = await Promise.allSettled([
        axios.post(`${AI_SERVICE_URL}/api/ai/classify`, { title, description }, { timeout: 3500 }),
        axios.post(`${AI_SERVICE_URL}/api/ai/priority`, { title, description }, { timeout: 3500 })
      ]);

      if (classifyRes.status === 'fulfilled' && classifyRes.value?.data) {
        deptCode = classifyRes.value.data.predicted_department || 'MCD';
        confidence = classifyRes.value.data.confidence_score || 0.85;
        modelName = classifyRes.value.data.model_name || modelName;
        modelVersion = classifyRes.value.data.model_version || modelVersion;
      }

      if (priorityRes.status === 'fulfilled' && priorityRes.value?.data) {
        priority = priorityRes.value.data.recommended_priority || 'medium';
        slaHours = priorityRes.value.data.sla_recommended_hours || 48;
      }
    } catch (err) {
      console.warn('[AI Service Warning]: Failed calling microservice, using rule fallback:', err.message);
    }

    // Fallback heuristic if classify returned generic MCD
    if (!deptCode || deptCode === 'MCD') {
      const text = `${title} ${description}`.toLowerCase();
      if (text.includes('water') || text.includes('drain') || text.includes('sewage') || text.includes('tap') || text.includes('drinking')) {
        deptCode = 'DJB';
        if (text.includes('contam') || text.includes('toxic') || text.includes('burst')) {
          priority = 'critical';
          slaHours = 12;
        }
      } else if (text.includes('electric') || text.includes('power') || text.includes('wire') || text.includes('spark') || text.includes('shock') || text.includes('current')) {
        deptCode = 'EPD';
        if (text.includes('spark') || text.includes('wire') || text.includes('fire')) {
          priority = 'critical';
          slaHours = 12;
        }
      } else if (text.includes('road') || text.includes('pothole') || text.includes('flyover') || text.includes('bridge') || text.includes('traffic')) {
        deptCode = text.includes('traffic') ? 'TPD' : 'PWD';
        if (text.includes('accident') || text.includes('crater') || text.includes('collapse')) {
          priority = 'high';
          slaHours = 24;
        }
      } else if (text.includes('hospital') || text.includes('doctor') || text.includes('clinic') || text.includes('medicine') || text.includes('fever') || text.includes('dengue')) {
        deptCode = 'HFW';
      }
    }

    let matchedDept = mockDepartments.find(d => d.code === deptCode) || mockDepartments[0];
    if (isSupabaseConfigured) {
      try {
        const { data: dbDept } = await supabase.from('departments').select('id, code').eq('code', deptCode).single();
        if (dbDept) matchedDept = dbDept;
      } catch (err) {
        // Silent fallback to mockDepartments
      }
    }

    return {
      predicted_department_code: deptCode,
      predicted_department_id: matchedDept.id,
      confidence_score: confidence,
      predicted_priority: priority,
      sla_recommended_hours: slaHours,
      model_name: modelName,
      model_version: modelVersion
    };
  }

  /**
   * Create a new complaint
   */
  static async createComplaint(data, user) {
    const trackingNumber = this.generateTrackingNumber();

    // Call AI to predict department and priority if not manually assigned
    const aiPrediction = await this.requestAIPredictions(data.title, data.description);

    const departmentId = data.department_id || aiPrediction.predicted_department_id;
    const priority = data.priority || aiPrediction.predicted_priority || 'medium';
    const slaHours = aiPrediction.sla_recommended_hours || 48;

    const newComplaint = {
      id: uuidv4(),
      tracking_number: trackingNumber,
      citizen_id: user.id,
      department_id: departmentId,
      category_id: data.category_id || null,
      title: data.title,
      description: data.description,
      preferred_language: data.preferred_language || 'en',
      status: 'submitted',
      priority: priority,
      is_escalated: false,
      escalation_level: 0,
      address: data.address,
      city: data.city || 'New Delhi',
      state: data.state || 'Delhi',
      pincode: data.pincode || null,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      sla_due_at: new Date(Date.now() + slaHours * 3600 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Scan for potential duplicate candidates using AI microservice
    let duplicateMatches = [];
    try {
      const candidates = mockComplaints.slice(0, 25).map(c => ({
        id: c.id,
        tracking_number: c.tracking_number,
        title: c.title,
        description: c.description,
        latitude: c.latitude,
        longitude: c.longitude,
        status: c.status
      }));

      const dupRes = await axios.post(`${AI_SERVICE_URL}/api/ai/duplicates`, {
        target_complaint: {
          id: newComplaint.id,
          title: newComplaint.title,
          description: newComplaint.description,
          latitude: newComplaint.latitude,
          longitude: newComplaint.longitude
        },
        candidate_complaints: candidates,
        similarity_threshold: 0.60,
        distance_threshold_meters: 1000.0
      }, { timeout: 3000 });

      if (dupRes.data && dupRes.data.duplicates) {
        duplicateMatches = dupRes.data.duplicates;
      }
    } catch (dupErr) {
      // Non-blocking duplicate scan
    }

    newComplaint.duplicate_matches = duplicateMatches;

    // Always ensure new complaint is recorded in local memory store for instant lookup
    mockComplaints.unshift(newComplaint);

    mockHistory.push({
      id: uuidv4(),
      complaint_id: newComplaint.id,
      performed_by: user.id,
      from_status: null,
      to_status: 'submitted',
      action: 'Complaint Registered',
      remarks: 'Registered via JanSahayak AI Citizen Portal',
      created_at: new Date().toISOString()
    });

    if (isSupabaseConfigured) {
      try {
        const { data: inserted, error } = await supabase
          .from('complaints')
          .insert([newComplaint])
          .select()
          .single();
        if (error) throw error;

        // Sync Supabase record into memory store
        const existingIdx = mockComplaints.findIndex(c => c.id === newComplaint.id);
        if (existingIdx >= 0) {
          mockComplaints[existingIdx] = { ...newComplaint, ...inserted };
        }

        // Insert AI prediction
        try {
          await supabase.from('ai_predictions').insert([{
            complaint_id: inserted.id,
            model_name: aiPrediction.model_name || 'JanSahayak-NLP',
            model_version: aiPrediction.model_version || '1.0.0',
            predicted_department_id: departmentId,
            predicted_priority: priority,
            confidence_score: aiPrediction.confidence_score || 0.85
          }]);
        } catch (predErr) {
          console.warn('[AI Prediction Save Warning]', predErr.message);
        }

        // Insert History
        try {
          await supabase.from('complaint_history').insert([{
            complaint_id: inserted.id,
            performed_by: user.id,
            to_status: 'submitted',
            action: 'Complaint Registered',
            remarks: 'Registered via JanSahayak AI Citizen Portal'
          }]);
        } catch (histErr) {
          console.warn('[Complaint History Save Warning]', histErr.message);
        }

        return inserted;
      } catch (dbErr) {
        console.warn('[ComplaintService] Supabase insert failed, using mock data store fallback:', dbErr.message);
      }
    }

    // Notify citizen
    mockNotifications.unshift({
      id: uuidv4(),
      user_id: user.id,
      complaint_id: newComplaint.id,
      title: 'Complaint Registered Successfully',
      message: `Your grievance ${trackingNumber} has been recorded and routed to the relevant department.`,
      type: 'status_update',
      is_read: false,
      created_at: new Date().toISOString()
    });

    return newComplaint;
  }

  /**
   * Get complaints with filtering & jurisdiction access rules
   */
  static async getComplaints({ user, status, priority, department_id, search, limit = 20, offset = 0 }) {
    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('complaints').select(`
          *,
          citizen:profiles!citizen_id(id, full_name, email, phone_number),
          department:departments!department_id(id, name, code),
          category:categories!category_id(id, name, code)
        `, { count: 'exact' });

        // Apply role based security
        if (user?.role === 'citizen' && user?.id) {
          query = query.eq('citizen_id', user.id);
        } else if ((user?.role === 'officer' || user?.role === 'department_admin') && user?.department_id) {
          query = query.eq('department_id', user.department_id);
        }

        if (status) query = query.eq('status', status);
        if (priority) query = query.eq('priority', priority);
        if (department_id) query = query.eq('department_id', department_id);
        if (search) query = query.ilike('title', `%${search}%`);

        query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
        const { data, count, error } = await query;
        if (!error && data) {
          return { complaints: data, total: count || data.length };
        }
      } catch (sbErr) {
        console.warn('[ComplaintService] Supabase list warning, using local store:', sbErr.message);
      }
    }

    // In-memory mock filtering fallback
    let filtered = [...mockComplaints];

    if (user?.role === 'citizen' && user?.id) {
      filtered = filtered.filter(c => c.citizen_id === user.id);
    } else if ((user?.role === 'officer' || user?.role === 'department_admin') && user?.department_id) {
      filtered = filtered.filter(c => c.department_id === user.department_id);
    }

    if (status) filtered = filtered.filter(c => c.status === status);
    if (priority) filtered = filtered.filter(c => c.priority === priority);
    if (department_id) filtered = filtered.filter(c => c.department_id === department_id);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(c => 
        c.title.toLowerCase().includes(q) || 
        c.tracking_number.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      );
    }

    // Attach enriched department and category
    const enriched = filtered.map(c => ({
      ...c,
      department: mockDepartments.find(d => d.id === c.department_id) || null,
      category: mockCategories.find(cat => cat.id === c.category_id) || null,
      citizen: mockUsers.find(u => u.id === c.citizen_id) || null
    }));

    return {
      complaints: enriched.slice(offset, offset + limit),
      total: enriched.length
    };
  }

  /**
   * Get single complaint by ID or tracking number
   */
  static async getComplaintById(idOrTracking, user) {
    if (!idOrTracking) return null;
    const cleanIdentifier = String(idOrTracking).trim();
    const normalizedQuery = cleanIdentifier.toLowerCase();

    // 1. Try Supabase lookup if configured
    if (isSupabaseConfigured) {
      try {
        const isUUID = cleanIdentifier.includes('-') && cleanIdentifier.length === 36;
        let query = supabase.from('complaints').select(`
          *,
          citizen:profiles!citizen_id(id, full_name, email, phone_number),
          department:departments!department_id(id, name, code, contact_email, contact_phone),
          category:categories!category_id(id, name, code)
        `);

        if (isUUID) {
          query = query.eq('id', cleanIdentifier);
        } else {
          query = query.ilike('tracking_number', cleanIdentifier);
        }

        const { data, error } = await query.maybeSingle();
        if (!error && data) {
          // Fetch history
          try {
            const { data: history } = await supabase
              .from('complaint_history')
              .select('*')
              .eq('complaint_id', data.id)
              .order('created_at', { ascending: true });
            data.history = history || [];
          } catch {
            data.history = [];
          }
          return data;
        }
      } catch (sbErr) {
        console.warn('[ComplaintService] Supabase get error, falling back to local store:', sbErr.message);
      }
    }

    // 2. Fallback to memory store (mockComplaints)
    const complaint = mockComplaints.find(c =>
      c.id === cleanIdentifier ||
      (c.tracking_number && c.tracking_number.toLowerCase() === normalizedQuery)
    );

    if (!complaint) return null;

    return {
      ...complaint,
      department: mockDepartments.find(d => d.id === complaint.department_id) || null,
      category: mockCategories.find(cat => cat.id === complaint.category_id) || null,
      citizen: mockUsers.find(u => u.id === complaint.citizen_id) || null,
      history: mockHistory.filter(h => h.complaint_id === complaint.id),
      duplicate_matches: complaint.duplicate_matches || []
    };
  }

  /**
   * Update complaint status
   */
  static async updateStatus(complaintId, { status, remarks, resolution_proof_url }, user) {
    const complaint = await this.getComplaintById(complaintId, user);
    if (!complaint) throw new Error('Complaint not found');

    const previousStatus = complaint.status;

    if (isSupabaseConfigured) {
      const updateData = {
        status,
        updated_at: new Date().toISOString()
      };
      if (status === 'resolved') updateData.resolved_at = new Date().toISOString();
      if (status === 'closed') updateData.closed_at = new Date().toISOString();

      const { data: updated, error } = await supabase
        .from('complaints')
        .update(updateData)
        .eq('id', complaintId)
        .select()
        .single();
      if (error) throw error;

      await supabase.from('complaint_history').insert([{
        complaint_id: complaintId,
        performed_by: user.id,
        from_status: previousStatus,
        to_status: status,
        action: `Status transitioned to ${status}`,
        remarks: remarks || `Status changed from ${previousStatus} to ${status}`
      }]);

      return updated;
    }

    // Mock update
    const targetInStore = mockComplaints.find(c => c.id === complaint.id || c.tracking_number === complaint.tracking_number);
    if (targetInStore) {
      targetInStore.status = status;
      targetInStore.updated_at = new Date().toISOString();
      if (status === 'resolved') targetInStore.resolved_at = new Date().toISOString();
      if (status === 'closed') targetInStore.closed_at = new Date().toISOString();
    }
    complaint.status = status;
    complaint.updated_at = new Date().toISOString();
    if (status === 'resolved') complaint.resolved_at = new Date().toISOString();
    if (status === 'closed') complaint.closed_at = new Date().toISOString();

    mockHistory.push({
      id: uuidv4(),
      complaint_id: complaint.id,
      performed_by: user.id,
      from_status: previousStatus,
      to_status: status,
      action: `Status changed to ${status}`,
      remarks: remarks || `Officer updated status to ${status}`,
      created_at: new Date().toISOString()
    });

    mockNotifications.unshift({
      id: uuidv4(),
      user_id: complaint.citizen_id,
      complaint_id: complaint.id,
      title: `Grievance Status Updated: ${status.toUpperCase()}`,
      message: `Your grievance ${complaint.tracking_number} is now '${status}'. Note: ${remarks}`,
      type: 'status_update',
      is_read: false,
      created_at: new Date().toISOString()
    });

    return complaint;
  }

  /**
   * Submit citizen satisfaction feedback
   */
  static async submitFeedback(complaintId, { rating, comments }, user) {
    const complaint = await this.getComplaintById(complaintId, user);
    if (!complaint) throw new Error('Complaint not found');

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('feedback').insert([{
        complaint_id: complaintId,
        citizen_id: user.id,
        rating,
        comments,
        satisfaction_level: rating >= 4 ? 'Satisfied' : rating === 3 ? 'Neutral' : 'Unsatisfied'
      }]).select().single();
      if (error) throw error;
      return data;
    }

    const feedbackEntry = {
      id: uuidv4(),
      complaint_id: complaintId,
      citizen_id: user.id,
      rating,
      comments,
      satisfaction_level: rating >= 4 ? 'Satisfied' : rating === 3 ? 'Neutral' : 'Unsatisfied',
      created_at: new Date().toISOString()
    };

    complaint.feedback = feedbackEntry;

    mockHistory.push({
      id: uuidv4(),
      complaint_id: complaint.id,
      performed_by: user.id,
      from_status: complaint.status,
      to_status: complaint.status,
      action: 'Citizen Feedback Submitted',
      remarks: `Rating: ${rating}/5 Stars. Comments: ${comments || 'No written remarks'}`,
      created_at: new Date().toISOString()
    });

    return feedbackEntry;
  }
}
