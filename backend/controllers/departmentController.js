import { supabase, isSupabaseConfigured } from '../config/supabase.js';
import { mockDepartments, mockCategories } from '../services/mockDataStore.js';

export const getDepartments = async (req, res, next) => {
  try {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return res.json({ success: true, data });
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
      let query = supabase.from('categories').select('*').eq('is_active', true);
      if (department_id) query = query.eq('department_id', department_id);
      const { data, error } = await query.order('name');
      if (error) throw error;
      return res.json({ success: true, data });
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
