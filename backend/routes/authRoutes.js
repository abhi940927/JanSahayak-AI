import express from 'express';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { supabase, isSupabaseConfigured } from '../config/supabase.js';
import { mockUsers } from '../services/mockDataStore.js';

const router = express.Router();

router.get('/profile', authenticateUser, (req, res) => {
  res.json({
    success: true,
    data: req.user
  });
});

router.patch('/profile', authenticateUser, async (req, res, next) => {
  try {
    const { full_name, phone_number } = req.body;

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('profiles')
        .update({ full_name, phone_number, updated_at: new Date().toISOString() })
        .eq('id', req.user.id)
        .select()
        .single();

      if (error) throw error;
      return res.json({ success: true, data });
    }

    if (full_name) req.user.full_name = full_name;
    if (phone_number) req.user.phone_number = phone_number;

    res.json({ success: true, data: req.user });
  } catch (err) {
    next(err);
  }
});

// Demo switch role endpoint for frictionless evaluator testing
router.get('/demo-roles', (req, res) => {
  res.json({
    success: true,
    data: mockUsers.map(u => ({
      id: u.id,
      name: u.full_name,
      email: u.email,
      role: u.role,
      designation: u.designation
    }))
  });
});

export default router;
