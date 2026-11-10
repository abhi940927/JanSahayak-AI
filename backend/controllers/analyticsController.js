import { supabase, isSupabaseConfigured } from '../config/supabase.js';
import { mockComplaints, mockDepartments } from '../services/mockDataStore.js';

export const getCitizenAnalytics = async (req, res, next) => {
  try {
    const citizenId = req.user.id;

    if (isSupabaseConfigured) {
      const { data: complaints, error } = await supabase
        .from('complaints')
        .select('status, priority, created_at')
        .eq('citizen_id', citizenId);

      if (error) throw error;

      const total = complaints.length;
      const pending = complaints.filter(c => ['submitted', 'verified', 'assigned'].includes(c.status)).length;
      const in_progress = complaints.filter(c => c.status === 'in_progress').length;
      const resolved = complaints.filter(c => ['resolved', 'closed'].includes(c.status)).length;

      return res.json({
        success: true,
        data: { total, pending, in_progress, resolved }
      });
    }

    const complaints = mockComplaints.filter(c => c.citizen_id === citizenId);
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
