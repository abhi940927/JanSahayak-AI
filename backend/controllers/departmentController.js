import { supabase, isSupabaseConfigured } from '../config/supabase.js';
import { mockDepartments, mockCategories } from '../services/mockDataStore.js';

export const getDepartments = async (req, res, next) => {
  try {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('departments')
          .select('*')
          .eq('is_active', true)
          .order('name');
        if (!error && Array.isArray(data) && data.length > 0) {
          return res.json({ success: true, data });
        }
        console.warn('[DepartmentController] Supabase returned empty or error, falling back to seed departments:', error?.message);
      } catch (sbErr) {
        console.warn('[DepartmentController] Supabase query failed, falling back:', sbErr.message);
      }
    }

    res.json({ success: true, data: mockDepartments });
  } catch (err) {
    next(err);
  }
};

export const getCategories = async (req, res, next) => {
  try {
    const { department_id } = req.query;

    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('categories').select('*').eq('is_active', true);
        if (department_id) query = query.eq('department_id', department_id);
        const { data, error } = await query.order('name');
        if (!error && Array.isArray(data) && data.length > 0) {
          return res.json({ success: true, data });
        }
        console.warn('[DepartmentController] Supabase categories empty or error, falling back:', error?.message);
      } catch (sbErr) {
        console.warn('[DepartmentController] Supabase categories query failed, falling back:', sbErr.message);
      }
    }

    let categories = [...mockCategories];
    if (department_id) {
      categories = categories.filter(c => c.department_id === department_id);
    }

    res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
};
