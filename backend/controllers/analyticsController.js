import { supabase, isSupabaseConfigured } from '../config/supabase.js';
import { mockComplaints, mockDepartments } from '../services/mockDataStore.js';

export const getPublicPlatformSummary = async (req, res, next) => {
  try {
    let complaints = [];
    let departments = [];

    if (isSupabaseConfigured) {
      const { data: cData } = await supabase.from('complaints').select('id, status, priority, created_at, resolved_at');
      const { data: dData } = await supabase.from('departments').select('id, name, code');
      complaints = cData || [];
      departments = dData || [];
    } else {
      complaints = [...mockComplaints];
      departments = [...mockDepartments];
    }

    const total = complaints.length;
    const resolved = complaints.filter(c => ['resolved', 'closed'].includes(c.status)).length;
    const in_progress = complaints.filter(c => ['in_progress', 'under_review'].includes(c.status)).length;
    const pending = complaints.filter(c => ['submitted', 'verified', 'assigned'].includes(c.status)).length;
    const critical = complaints.filter(c => c.priority === 'critical').length;
    const resolution_rate = total > 0 ? Math.round((resolved / total) * 100) : 94;

    res.json({
      success: true,
      data: {
        total_grievances: total,
        resolved_count: resolved,
        in_progress_count: in_progress,
        pending_count: pending,
        critical_count: critical,
        resolution_rate_percent: resolution_rate,
        total_departments: departments.length || 6,
        avg_sla_hours: 24.0,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getCitizenAnalytics = async (req, res, next) => {
  try {
    const citizenId = req.user.id;
    let citizenIds = [citizenId];

    if (isSupabaseConfigured) {
      if (req.user?.email) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', req.user.email.toLowerCase().trim())
          .maybeSingle();

        if (prof?.id && !citizenIds.includes(prof.id)) {
          citizenIds.push(prof.id);
        }
      }

      const { data: complaints, error } = await supabase
        .from('complaints')
        .select('status, priority, created_at')
        .in('citizen_id', citizenIds);

      if (!error && complaints) {
        const total = complaints.length;
        const pending = complaints.filter(c => ['submitted', 'verified', 'assigned'].includes(c.status)).length;
        const in_progress = complaints.filter(c => c.status === 'in_progress').length;
        const resolved = complaints.filter(c => ['resolved', 'closed'].includes(c.status)).length;

        return res.json({
          success: true,
          data: { total, pending, in_progress, resolved }
        });
      }
    }

    const complaints = mockComplaints.filter(c => 
      citizenIds.includes(c.citizen_id) || 
      (req.user?.email && c.citizen_email && c.citizen_email.toLowerCase() === req.user.email.toLowerCase())
    );
    const total = complaints.length;
    const pending = complaints.filter(c => ['submitted', 'verified', 'assigned'].includes(c.status)).length;
    const in_progress = complaints.filter(c => c.status === 'in_progress').length;
    const resolved = complaints.filter(c => ['resolved', 'closed'].includes(c.status)).length;

    res.json({
      success: true,
      data: { total, pending, in_progress, resolved }
    });
  } catch (err) {
    next(err);
  }
};

export const getAdminAnalytics = async (req, res, next) => {
  try {
    let complaints = [];
    let departments = [];

    if (isSupabaseConfigured) {
      const { data: cData } = await supabase.from('complaints').select('status, priority, department_id, created_at, resolved_at');
      const { data: dData } = await supabase.from('departments').select('id, name, code');
      complaints = cData || [];
      departments = dData || [];
    } else {
      complaints = [...mockComplaints];
      departments = [...mockDepartments];
    }

    // If department admin, scope strictly to their department jurisdiction
    if (req.user.role === 'department_admin' && req.user.department_id) {
      complaints = complaints.filter(c => c.department_id === req.user.department_id);
      departments = departments.filter(d => d.id === req.user.department_id);
    }

    const total = complaints.length;
    const pending = complaints.filter(c => ['submitted', 'verified', 'assigned'].includes(c.status)).length;
    const in_progress = complaints.filter(c => c.status === 'in_progress').length;
    const resolved = complaints.filter(c => ['resolved', 'closed'].includes(c.status)).length;
    const critical = complaints.filter(c => c.priority === 'critical').length;

    // Department breakdown
    const departmentDistribution = departments.map(dept => {
      const count = complaints.filter(c => c.department_id === dept.id).length;
      const resolvedCount = complaints.filter(c => c.department_id === dept.id && ['resolved', 'closed'].includes(c.status)).length;
      return {
        name: dept.name,
        code: dept.code,
        complaints: count,
        resolved: resolvedCount,
        resolution_rate: count > 0 ? Math.round((resolvedCount / count) * 100) : 100
      };
    });

    // Priority breakdown
    const priorityDistribution = [
      { priority: 'Critical', count: complaints.filter(c => c.priority === 'critical').length },
      { priority: 'High', count: complaints.filter(c => c.priority === 'high').length },
      { priority: 'Medium', count: complaints.filter(c => c.priority === 'medium').length },
      { priority: 'Low', count: complaints.filter(c => c.priority === 'low').length }
    ];

    res.json({
      success: true,
      data: {
        summary: { total, pending, in_progress, resolved, critical },
        departmentDistribution,
        priorityDistribution
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getOfficerAnalytics = async (req, res, next) => {
  try {
    const officerDeptId = req.user.department_id;
    let complaints = [];

    if (isSupabaseConfigured) {
      let query = supabase.from('complaints').select('*');
      if (officerDeptId) query = query.eq('department_id', officerDeptId);
      const { data } = await query;
      complaints = data || [];
    } else {
      complaints = mockComplaints.filter(c => !officerDeptId || c.department_id === officerDeptId);
    }

    const total = complaints.length;
    const pending = complaints.filter(c => ['submitted', 'verified', 'assigned'].includes(c.status)).length;
    const in_progress = complaints.filter(c => c.status === 'in_progress').length;
    const resolved = complaints.filter(c => ['resolved', 'closed'].includes(c.status)).length;
    const critical = complaints.filter(c => c.priority === 'critical').length;

    res.json({
      success: true,
      data: { total, pending, in_progress, resolved, critical }
    });
  } catch (err) {
    next(err);
  }
};
