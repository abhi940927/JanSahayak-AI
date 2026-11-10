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
    try {
      const response = await axios.post(`${AI_SERVICE_URL}/api/ai/classify`, {
        title,
        description
      }, { timeout: 3500 });
      return response.data;
    } catch (err) {
      // Robust transparent fallback
      const text = `${title} ${description}`.toLowerCase();
      let deptCode = 'MCD';
      let priority = 'medium';

      if (text.includes('water') || text.includes('drain') || text.includes('sewage') || text.includes('tap') || text.includes('drinking')) {
        deptCode = 'DJB';
        if (text.includes('contam') || text.includes('toxic') || text.includes('burst')) priority = 'critical';
      } else if (text.includes('electric') || text.includes('power') || text.includes('wire') || text.includes('spark') || text.includes('shock') || text.includes('current')) {
        deptCode = 'EPD';
        if (text.includes('spark') || text.includes('wire') || text.includes('fire')) priority = 'critical';
      } else if (text.includes('road') || text.includes('pothole') || text.includes('flyover') || text.includes('bridge') || text.includes('traffic')) {
        deptCode = text.includes('traffic') ? 'TPD' : 'PWD';
        if (text.includes('accident') || text.includes('crater') || text.includes('collapse')) priority = 'high';
      } else if (text.includes('hospital') || text.includes('doctor') || text.includes('clinic') || text.includes('medicine') || text.includes('fever') || text.includes('dengue')) {
        deptCode = 'HFW';
      } else if (text.includes('garbage') || text.includes('waste') || text.includes('trash') || text.includes('sanitation') || text.includes('clean')) {
        deptCode = 'MCD';
      }

      const matchedDept = mockDepartments.find(d => d.code === deptCode) || mockDepartments[0];
      return {
        predicted_department_code: deptCode,
        predicted_department_id: matchedDept.id,
        confidence_score: 0.88,
        predicted_priority: priority,
        model_name: 'JanSahayak-Heuristic-Rule-Engine',
        model_version: '1.0.0-fallback'
      };
    }
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
      sla_due_at: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (isSupabaseConfigured) {
      const { data: inserted, error } = await supabase
        .from('complaints')
        .insert([newComplaint])
        .select()
        .single();
      if (error) throw error;

      // Insert AI prediction
      await supabase.from('ai_predictions').insert([{
        complaint_id: inserted.id,
        model_name: aiPrediction.model_name || 'JanSahayak-NLP',
        model_version: aiPrediction.model_version || '1.0.0',
        predicted_department_id: departmentId,
        predicted_priority: priority,
        confidence_score: aiPrediction.confidence_score || 0.85
      }]);

      // Insert History
      await supabase.from('complaint_history').insert([{
        complaint_id: inserted.id,
        performed_by: user.id,
        to_status: 'submitted',
        action: 'Complaint Registered',
        remarks: 'Registered via JanSahayak AI Citizen Portal'
      }]);

      return inserted;
    }

    // Dev/Mock fallback
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
      let query = supabase.from('complaints').select(`
        *,
        citizen:profiles!citizen_id(id, full_name, email, phone_number),
        department:departments!department_id(id, name, code),
        category:categories!category_id(id, name, code)
      `, { count: 'exact' });

      // Apply role based security
      if (user.role === 'citizen') {
        query = query.eq('citizen_id', user.id);
      } else if (user.role === 'officer' || user.role === 'department_admin') {
        if (user.department_id) {
          query = query.eq('department_id', user.department_id);
        }
      }

      if (status) query = query.eq('status', status);
      if (priority) query = query.eq('priority', priority);
      if (department_id) query = query.eq('department_id', department_id);
      if (search) query = query.ilike('title', `%${search}%`);

      query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
      const { data, count, error } = await query;
      if (error) throw error;
      return { complaints: data, total: count };
    }

    // In-memory mock filtering
    let filtered = [...mockComplaints];

    if (user.role === 'citizen') {
      filtered = filtered.filter(c => c.citizen_id === user.id);
    } else if (user.role === 'officer' || user.role === 'department_admin') {
      if (user.department_id) {
        filtered = filtered.filter(c => c.department_id === user.department_id);
      }
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
    if (isSupabaseConfigured) {
      const isUUID = idOrTracking.includes('-');
      let query = supabase.from('complaints').select(`
        *,
        citizen:profiles!citizen_id(id, full_name, email, phone_number),
        department:departments!department_id(id, name, code, contact_email, contact_phone),
        category:categories!category_id(id, name, code)
      `);

      if (isUUID && idOrTracking.length === 36) {
        query = query.eq('id', idOrTracking);
      } else {
        query = query.eq('tracking_number', idOrTracking);
      }

      const { data, error } = await query.single();
      if (error || !data) return null;

      // Verify access jurisdiction
      if (user.role === 'citizen' && data.citizen_id !== user.id) {
        throw new Error('Access denied to this grievance record');
      }

      // Fetch history
      const { data: history } = await supabase
        .from('complaint_history')
        .select('*')
        .eq('complaint_id', data.id)
        .order('created_at', { ascending: true });

      data.history = history || [];
      return data;
    }

    // Mock store
    const complaint = mockComplaints.find(c => c.id === idOrTracking || c.tracking_number === idOrTracking);
    if (!complaint) return null;

    if (user.role === 'citizen' && complaint.citizen_id !== user.id) {
      throw new Error('Access denied to this grievance record');
    }

    return {
      ...complaint,
      department: mockDepartments.find(d => d.id === complaint.department_id) || null,
      category: mockCategories.find(cat => cat.id === complaint.category_id) || null,
      citizen: mockUsers.find(u => u.id === complaint.citizen_id) || null,
      history: mockHistory.filter(h => h.complaint_id === complaint.id)
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
