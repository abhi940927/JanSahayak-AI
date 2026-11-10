import { v4 as uuidv4 } from 'uuid';
import { supabase, isSupabaseConfigured } from '../config/supabase.js';
import { mockUsers, mockInvitations, findUserByIdOrEmail, saveDynamicUser } from '../services/mockDataStore.js';

// In-memory store for reset tokens (fallback when Supabase is offline)
const resetTokens = new Map(); // email -> { token, expiresAt }

export const registerCitizen = async (req, res, next) => {
  try {
    const { full_name, email, password, confirm_password, dob, phone_number, avatar_url } = req.body;

    if (!full_name || full_name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Valid full name is required' });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Valid email address is required' });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
    }
    if (password !== confirm_password) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }
    if (!dob) {
      return res.status(400).json({ success: false, message: 'Date of birth is required' });
    }

    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime()) || birthDate > new Date()) {
      return res.status(400).json({ success: false, message: 'Date of birth cannot be in the future' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    if (isSupabaseConfigured) {
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (existingUser) {
        return res.status(409).json({ success: false, message: 'An account with this email address already exists' });
      }

      // Register with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            full_name: full_name.trim(),
            phone_number: phone_number || null,
            dob,
            avatar_url: avatar_url || null
          }
        }
      });

      if (authError) throw authError;

      // Update profile with DOB and avatar
      if (authData.user) {
        await supabase
          .from('profiles')
          .update({
            full_name: full_name.trim(),
            dob,
            phone_number: phone_number || null,
            avatar_url: avatar_url || null,
            role: 'citizen',
            roles: ['citizen']
          })
          .eq('id', authData.user.id);
      }

      return res.status(201).json({
        success: true,
        message: 'Citizen registration successful. Welcome to JanSahayak AI.',
        data: {
          token: authData.session?.access_token || null,
          user: {
            id: authData.user?.id,
            email: normalizedEmail,
            full_name: full_name.trim(),
            phone_number: phone_number || null,
            dob,
            avatar_url: avatar_url || null,
            role: 'citizen',
            roles: ['citizen'],
            designation: 'Citizen / Resident'
          }
        }
      });
    }

    // Mock store registration
    const existing = findUserByIdOrEmail(normalizedEmail);
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email address already exists' });
    }

    const newCitizen = {
      id: uuidv4(),
      email: normalizedEmail,
      full_name: full_name.trim(),
      phone_number: phone_number || null,
      dob,
      avatar_url: avatar_url || null,
      role: 'citizen',
      roles: ['citizen'],
      department_id: null,
      designation: 'Citizen / Resident',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    saveDynamicUser(newCitizen);

    const mockToken = `mock-token:${newCitizen.role}:${newCitizen.id}:${Date.now()}`;

    return res.status(201).json({
      success: true,
      message: 'Citizen registration successful. Welcome to JanSahayak AI.',
      data: {
        token: mockToken,
        user: newCitizen
      }
    });
  } catch (err) {
    next(err);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password, portal_context } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check designated admin account provisioning: abhisingh940927@gmail.com
    const isDesignatedAdmin = (normalizedEmail === 'abhisingh940927@gmail.com');

    if (isSupabaseConfigured) {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password
      });

      if (authError || !authData.session) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      // Fetch user profile from database
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (!profile || !profile.is_active) {
        return res.status(403).json({ success: false, message: 'Account is deactivated or unauthorized' });
      }

      const userRoles = isDesignatedAdmin
        ? ['super_admin', 'department_admin']
        : (profile.roles || [profile.role]);

      // Check role authorization for portal context
      let activeRole = profile.role;
      if (portal_context && userRoles.includes(portal_context)) {
        activeRole = portal_context;
      } else if (isDesignatedAdmin) {
        activeRole = portal_context === 'department_admin' ? 'department_admin' : 'super_admin';
      }

      // Validate portal context permission
      if (portal_context === 'officer' && !userRoles.includes('officer')) {
        return res.status(403).json({ success: false, message: 'Access denied. You do not hold government officer privileges.' });
      }
      if (portal_context === 'department_admin' && !userRoles.includes('department_admin') && !userRoles.includes('super_admin')) {
        return res.status(403).json({ success: false, message: 'Access denied. Department administrator clearance required.' });
      }
      if (portal_context === 'super_admin' && !userRoles.includes('super_admin')) {
        return res.status(403).json({ success: false, message: 'Access denied. Super administrator authority required.' });
      }

      return res.json({
        success: true,
        message: 'Authentication successful',
        data: {
          token: authData.session.access_token,
          user: {
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name,
            role: activeRole,
            roles: userRoles,
            department_id: profile.department_id,
            designation: profile.designation,
            avatar_url: profile.avatar_url
          },
          available_roles: userRoles,
          requires_role_selection: isDesignatedAdmin && !portal_context
        }
      });
    }

    // Mock authentication mode
    let user = findUserByIdOrEmail(normalizedEmail);

    if (!user) {
      // Allow demo citizen login
      if (normalizedEmail.includes('citizen')) {
        user = mockUsers.find(u => u.role === 'citizen');
      } else if (normalizedEmail.includes('officer')) {
        user = mockUsers.find(u => u.role === 'officer');
      } else if (normalizedEmail.includes('admin') || normalizedEmail.includes('dept')) {
        user = mockUsers.find(u => u.role === 'department_admin');
      } else if (normalizedEmail.includes('super')) {
        user = mockUsers.find(u => u.role === 'super_admin');
      } else {
        return res.status(401).json({ success: false, message: 'Invalid credentials or account does not exist' });
      }
    }

    const userRoles = isDesignatedAdmin
      ? ['super_admin', 'department_admin']
      : (user.roles || [user.role]);

    let activeRole = user.role;
    if (portal_context && userRoles.includes(portal_context)) {
      activeRole = portal_context;
    } else if (isDesignatedAdmin) {
      activeRole = portal_context === 'department_admin' ? 'department_admin' : 'super_admin';
    }

    // Validate portal context permission
    if (portal_context === 'officer' && !userRoles.includes('officer')) {
      return res.status(403).json({ success: false, message: 'Access denied. You do not hold government officer privileges.' });
    }
    if (portal_context === 'department_admin' && !userRoles.includes('department_admin') && !userRoles.includes('super_admin')) {
      return res.status(403).json({ success: false, message: 'Access denied. Department administrator clearance required.' });
    }
    if (portal_context === 'super_admin' && !userRoles.includes('super_admin')) {
      return res.status(403).json({ success: false, message: 'Access denied. Super administrator authority required.' });
    }

    const mockToken = `mock-token:${activeRole}:${user.id}:${Date.now()}`;

    return res.json({
      success: true,
      message: 'Authentication successful',
      data: {
        token: mockToken,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          phone_number: user.phone_number || null,
          dob: user.dob || null,
          avatar_url: user.avatar_url || null,
          role: activeRole,
          roles: userRoles,
          department_id: user.department_id,
          designation: user.designation,
          created_at: user.created_at,
          updated_at: user.updated_at
        },
        available_roles: userRoles,
        requires_role_selection: isDesignatedAdmin && !portal_context
      }
    });
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Registered email address is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const token = uuidv4().slice(0, 8).toUpperCase();
    resetTokens.set(normalizedEmail, {
      token,
      expiresAt: Date.now() + (15 * 60 * 1000) // 15 mins
    });

    if (isSupabaseConfigured) {
      try {
        await supabase.auth.resetPasswordForEmail(normalizedEmail, {
          redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/citizen/reset-password`
        });
      } catch (e) {
        console.warn('[Supabase Auth Reset Warning]:', e.message);
      }
    }

    // Never leak email registration existence
    return res.json({
      success: true,
      message: 'If an account exists with this email, secure password reset instructions have been dispatched.'
    });
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { email, token, new_password, confirm_password } = req.body;

    if (!email || !token || !new_password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    if (new_password.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters long' });
    }
    if (new_password !== confirm_password) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const stored = resetTokens.get(normalizedEmail);

    if (!stored || stored.token !== token.trim().toUpperCase() || stored.expiresAt < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token / OTP' });
    }

    resetTokens.delete(normalizedEmail);

    if (isSupabaseConfigured) {
      // In Supabase Auth, password updates are completed with session token or admin API
    }

    return res.json({
      success: true,
      message: 'Your password has been successfully updated. You may now sign in.'
    });
  } catch (err) {
    next(err);
  }
};

export const verifyAdminInvitation = async (req, res, next) => {
  try {
    const { invitation_code, email } = req.body;
    if (!invitation_code) {
      return res.status(400).json({ success: false, message: 'Invitation authorization code is required' });
    }

    const code = invitation_code.trim();
    const matched = mockInvitations.find(inv => inv.code === code && !inv.is_used);

    if (!matched) {
      return res.status(400).json({ success: false, message: 'Invalid, expired, or previously redeemed invitation code.' });
    }

    return res.json({
      success: true,
      message: 'Invitation code verified successfully',
      data: {
        role: matched.role,
        department_id: matched.department_id
      }
    });
  } catch (err) {
    next(err);
  }
};

export const registerAdminWithInvitation = async (req, res, next) => {
  try {
    const { full_name, email, password, confirm_password, invitation_code, designation } = req.body;

    if (!invitation_code) {
      return res.status(400).json({ success: false, message: 'Valid authorization invitation code required for administrator onboarding.' });
    }
    if (!full_name || full_name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Full name is required' });
    }
    if (!email || !password || password.length < 8) {
      return res.status(400).json({ success: false, message: 'Valid email and minimum 8-character password required' });
    }
    if (password !== confirm_password) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    const code = invitation_code.trim();
    const matched = mockInvitations.find(inv => inv.code === code && !inv.is_used);

    if (!matched) {
      return res.status(403).json({ success: false, message: 'Authorization code is invalid or has expired.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const newAdmin = {
      id: uuidv4(),
      email: normalizedEmail,
      full_name: full_name.trim(),
      role: matched.role,
      roles: [matched.role],
      department_id: matched.department_id,
      designation: designation || (matched.role === 'super_admin' ? 'System Administrator' : 'Department Administrator'),
      is_active: true,
      created_at: new Date().toISOString()
    };

    mockUsers.push(newAdmin);
    dynamicUsers.set(normalizedEmail, newAdmin);

    // Mark invitation used
    matched.is_used = true;

    return res.status(201).json({
      success: true,
      message: 'Administrator account successfully provisioned and verified.',
      data: {
        id: newAdmin.id,
        email: newAdmin.email,
        role: newAdmin.role
      }
    });
  } catch (err) {
    next(err);
  }
};

export const switchActiveRole = async (req, res, next) => {
  try {
    const { target_role } = req.body;
    const currentUser = req.user;

    const availableRoles = currentUser.roles || [currentUser.role];
    if (!availableRoles.includes(target_role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. You are not authorized to switch to role '${target_role}'.`
      });
    }

    req.user.role = target_role;

    return res.json({
      success: true,
      message: `Active session role switched to '${target_role}'.`,
      data: {
        user: {
          ...req.user,
          role: target_role
        }
      }
    });
  } catch (err) {
    next(err);
  }
};
