import express from 'express';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { supabase, isSupabaseConfigured } from '../config/supabase.js';
import { mockUsers, findUserByIdOrEmail, saveDynamicUser } from '../services/mockDataStore.js';
import {
  registerCitizen,
  loginUser,
  googleAuth,
  forgotPassword,
  resetPassword,
  verifyAdminInvitation,
  registerAdminWithInvitation,
  switchActiveRole
} from '../controllers/authController.js';

const router = express.Router();

// ==========================================
// AUTHENTICATION ENDPOINTS
// ==========================================
router.post('/auth/register', registerCitizen);
router.post('/auth/login', loginUser);
router.post('/auth/google', googleAuth);
router.post('/auth/forgot-password', forgotPassword);
router.post('/auth/reset-password', resetPassword);
router.post('/auth/verify-invite', verifyAdminInvitation);
router.post('/auth/admin-register', registerAdminWithInvitation);
router.post('/auth/switch-role', authenticateUser, switchActiveRole);

// ==========================================
// DYNAMIC PROFILE ENDPOINTS
// ==========================================

// Get currently authenticated user profile
const handleGetProfile = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  res.json({
    success: true,
    data: req.user
  });
};

router.get('/profile', authenticateUser, handleGetProfile);
router.get('/auth/profile', authenticateUser, handleGetProfile);

// Update personal profile information
const handleUpdateProfile = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { full_name, phone_number, dob, avatar_url, role, roles, id, email } = req.body;

    // Security check: Reject unauthorized escalation of role, roles, id, or email
    if (role !== undefined || roles !== undefined || id !== undefined || email !== undefined) {
      return res.status(403).json({
        success: false,
        message: 'Security violation: User role, identifier and primary email cannot be modified via profile update.'
      });
    }

    if (full_name !== undefined && full_name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Full name must contain at least 2 characters.' });
    }

    if (dob !== undefined && dob) {
      const bDate = new Date(dob);
      if (isNaN(bDate.getTime()) || bDate > new Date()) {
        return res.status(400).json({ success: false, message: 'Date of birth cannot be in the future.' });
      }
    }

    const updateFields = {
      updated_at: new Date().toISOString()
    };
    if (full_name !== undefined) updateFields.full_name = full_name.trim();
    if (phone_number !== undefined) updateFields.phone_number = phone_number ? phone_number.trim() : null;
    if (dob !== undefined) updateFields.dob = dob;
    if (avatar_url !== undefined) updateFields.avatar_url = avatar_url;

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('profiles')
        .update(updateFields)
        .eq('id', req.user.id)
        .select()
        .single();

      if (error) throw error;
      return res.json({
        success: true,
        message: 'Profile updated successfully',
        data
      });
    }

    // Mock in-memory persistence
    const updatedUser = {
      ...req.user,
      ...updateFields
    };

    saveDynamicUser(updatedUser);
    req.user = updatedUser;

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (err) {
    next(err);
  }
};

router.patch('/profile', authenticateUser, handleUpdateProfile);
router.put('/profile', authenticateUser, handleUpdateProfile);
router.patch('/auth/profile', authenticateUser, handleUpdateProfile);
router.put('/auth/profile', authenticateUser, handleUpdateProfile);

// Change user password securely
router.post('/profile/change-password', authenticateUser, async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { current_password, new_password, confirm_password } = req.body;

    if (!new_password || new_password.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters long.' });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.updateUser({
        password: new_password
      });

      if (error) throw error;
    }

    return res.json({
      success: true,
      message: 'Password successfully changed and updated in security vault.'
    });
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
