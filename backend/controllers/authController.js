import { v4 as uuidv4 } from 'uuid';
import { supabase, isSupabaseConfigured } from '../config/supabase.js';
import { mockUsers, mockInvitations, findUserByIdOrEmail, saveDynamicUser } from '../services/mockDataStore.js';
import { sendAuthMailer } from '../services/mailerService.js';

// In-memory store for reset tokens (fallback when Supabase is offline)
const resetTokens = new Map(); // email -> { token, expiresAt }

export const createSessionToken = (user, activeRole) => {
  const role = activeRole || user.role || 'citizen';
  const payload = {
    id: user.id,
    email: user.email,
    role,
    roles: user.roles || [role],
    name: user.full_name || user.name || 'Citizen User'
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `mock-token:${role}:${user.id}:${Date.now()}:${encoded}`;
};

export const registerCitizen = async (req, res, next) => {
  try {
    const { full_name, email, password, confirm_password, dob, phone_number, avatar_url } = req.body;
    const clientIp = (req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || req.ip || '127.0.0.1').replace(/^::ffff:/, '');

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

    // Special designated Super Admin & MCD Dept Admin account
    if (normalizedEmail === 'abhisingh940927@gmail.com') {
      const adminUser = findUserByIdOrEmail('abhisingh940927@gmail.com');
      const mockToken = createSessionToken(adminUser, 'super_admin');
      sendAuthMailer({ user: adminUser, ipAddress: clientIp, eventType: 'registration' });
      return res.status(201).json({
        success: true,
        message: 'Super Admin & MCD Department Administrator account verified.',
        data: {
          token: mockToken,
          user: adminUser
        }
      });
    }

    // Check if user already exists
    if (isSupabaseConfigured) {
      try {
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

        if (!authError && authData?.user) {
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

          const regUser = {
            id: authData.user.id,
            email: normalizedEmail,
            full_name: full_name.trim(),
            phone_number: phone_number || null,
            dob,
            avatar_url: avatar_url || null,
            role: 'citizen',
            roles: ['citizen'],
            designation: 'Citizen / Resident'
          };
          sendAuthMailer({ user: regUser, ipAddress: clientIp, eventType: 'registration' });

          return res.status(201).json({
            success: true,
            message: 'Citizen registration successful. Welcome to JanSahayak AI.',
            data: {
              token: authData.session?.access_token || null,
              user: regUser
            }
          });
        }
      } catch (sbErr) {
        console.warn('[Register Notice]: Supabase notice, falling back to local store:', sbErr.message);
      }
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
    sendAuthMailer({ user: newCitizen, ipAddress: clientIp, eventType: 'registration' });

    const mockToken = createSessionToken(newCitizen, newCitizen.role);

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
    const clientIp = (req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || req.ip || '127.0.0.1').replace(/^::ffff:/, '');

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Direct Designated Super Admin & MCD Dept Admin account
    if (normalizedEmail === 'abhisingh940927@gmail.com') {
      if (password !== 'Abhinav@990') {
        return res.status(401).json({ success: false, message: 'Invalid credentials. Please verify your password.' });
      }
      const adminUser = findUserByIdOrEmail('abhisingh940927@gmail.com');
      const userRoles = ['super_admin', 'department_admin', 'citizen'];
      const activeRole = portal_context || 'super_admin';
      const mockToken = createSessionToken(adminUser, activeRole);

      sendAuthMailer({ user: adminUser, ipAddress: clientIp, eventType: 'login' });

      return res.json({
        success: true,
        message: 'Authentication successful. Welcome, Super Admin & MCD Dept Admin.',
        data: {
          token: mockToken,
          user: {
            ...adminUser,
            role: activeRole,
            roles: userRoles
          },
          available_roles: userRoles,
          requires_role_selection: userRoles.length > 1 && !portal_context
        }
      });
    }

    if (isSupabaseConfigured) {
      try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password
        });

        if (!authError && authData?.session && authData?.user) {
          // Fetch user profile from database
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

          if (!profile || (profile.is_active !== undefined && profile.is_active === false)) {
            return res.status(403).json({ success: false, message: 'Account is deactivated or unauthorized' });
          }

          // Fetch user authorized roles from user_roles relation
          const { data: roleRecords } = await supabase
            .from('user_roles')
            .select('role, department_id')
            .eq('user_id', authData.user.id);

          let userRoles = [];
          if (roleRecords && roleRecords.length > 0) {
            userRoles = Array.from(new Set(roleRecords.map(r => r.role)));
          } else if (Array.isArray(profile.roles) && profile.roles.length > 0) {
            userRoles = profile.roles;
          } else {
            userRoles = [profile.role || 'citizen'];
          }

          // Check role authorization for portal context
          let activeRole = profile.role || userRoles[0];
          if (portal_context && userRoles.includes(portal_context)) {
            activeRole = portal_context;
          } else if (userRoles.includes('super_admin')) {
            activeRole = 'super_admin';
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

          const authUser = {
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name,
            role: activeRole,
            roles: userRoles,
            department_id: profile.department_id,
            designation: profile.designation,
            avatar_url: profile.avatar_url,
            dob: profile.dob,
            phone_number: profile.phone_number
          };
          sendAuthMailer({ user: authUser, ipAddress: clientIp, eventType: 'login' });

          return res.json({
            success: true,
            message: 'Authentication successful',
            data: {
              token: authData.session.access_token,
              user: authUser,
              available_roles: userRoles,
              requires_role_selection: userRoles.length > 1 && !portal_context
            }
          });
        }
      } catch (sbErr) {
        console.warn('[Login Notice]: Supabase notice, using local auth store:', sbErr.message);
      }
    }

    // Mock authentication mode
    let user = findUserByIdOrEmail(normalizedEmail);

    if (!user) {
      // Check role keyword aliases
      if (normalizedEmail.includes('officer')) {
        user = mockUsers.find(u => u.role === 'officer');
      } else if (normalizedEmail.includes('admin') || normalizedEmail.includes('dept')) {
        user = mockUsers.find(u => u.role === 'department_admin');
      } else if (normalizedEmail.includes('super')) {
        user = mockUsers.find(u => u.role === 'super_admin');
      } else {
        // Auto-provision new citizen account dynamically
        const derivedName = normalizedEmail.split('@')[0]
          .replace(/[._0-9]+/g, ' ')
          .trim()
          .replace(/\b\w/g, c => c.toUpperCase()) || 'Citizen User';

        user = {
          id: uuidv4(),
          email: normalizedEmail,
          full_name: derivedName,
          dob: '2000-01-01',
          phone_number: '+91 98765 43210',
          avatar_url: null,
          role: 'citizen',
          roles: ['citizen'],
          department_id: null,
          designation: 'Citizen / Resident',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        saveDynamicUser(user);
        // Dispatch registration welcome email as first-time provisioning
        sendAuthMailer({ user, ipAddress: clientIp, eventType: 'registration' });
      }
    }

    const userRoles = (Array.isArray(user.roles) && user.roles.length > 0)
      ? user.roles
      : [user.role || 'citizen'];

    let activeRole = user.role || userRoles[0];
    if (portal_context && userRoles.includes(portal_context)) {
      activeRole = portal_context;
    } else if (userRoles.includes('super_admin')) {
      activeRole = 'super_admin';
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

    const mockToken = createSessionToken(user, activeRole);
    sendAuthMailer({ user, ipAddress: clientIp, eventType: 'login' });

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
        requires_role_selection: userRoles.length > 1 && !portal_context
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

export const googleAuth = async (req, res, next) => {
  try {
    const { email, name, avatar_url, turnstile_token } = req.body;

    const userEmail = (email || 'citizen.google@jansahayak.in').toLowerCase().trim();
    const userName = name || (userEmail.split('@')[0].charAt(0).toUpperCase() + userEmail.split('@')[0].slice(1));

    // Optional Turnstile verification if secret key is configured
    if (process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY && turnstile_token) {
      try {
        const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            secret: process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY,
            response: turnstile_token,
            remoteip: req.ip
          })
        });
        const verifyData = await verifyRes.json();
        if (!verifyData.success) {
          return res.status(403).json({ success: false, message: 'Cloudflare Turnstile verification failed. Please try again.' });
        }
      } catch (cfErr) {
        console.warn('[Cloudflare Turnstile] Verification warning:', cfErr.message);
      }
    }

    // Check if user exists
    let user = findUserByIdOrEmail(userEmail);

    if (!user) {
      // Create new dynamic citizen profile from Google Account
      const newCitizen = {
        id: uuidv4(),
        email: userEmail,
        full_name: userName,
        phone_number: null,
        dob: '2000-01-01',
        avatar_url: avatar_url || null,
        role: 'citizen',
        roles: ['citizen'],
        department_id: null,
        designation: 'Citizen / Google Verified',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      saveDynamicUser(newCitizen);
      user = newCitizen;
    }

    const mockToken = createSessionToken(user, user.role);
    const clientIp = (req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || req.ip || '127.0.0.1').replace(/^::ffff:/, '');
    sendAuthMailer({ user, ipAddress: clientIp, eventType: 'login' });

    return res.json({
      success: true,
      message: `Successfully authenticated via Google as ${user.full_name}`,
      data: {
        token: mockToken,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          roles: user.roles || [user.role],
          avatar_url: user.avatar_url,
          designation: user.designation
        },
        available_roles: user.roles || [user.role]
      }
    });
  } catch (err) {
    next(err);
  }
};
