import { v4 as uuidv4 } from 'uuid';
import { supabase, isSupabaseConfigured } from '../config/supabase.js';
import { mockUsers, findUserByIdOrEmail, saveDynamicUser } from '../services/mockDataStore.js';

export const resolveMockUser = async (token, req) => {
  if (!token || !token.startsWith('mock-token:')) return null;
  const parts = token.split(':');
  const userRole = parts[1] || 'citizen';
  const userIdOrEmail = parts[2];

  let matchedUser = userIdOrEmail ? findUserByIdOrEmail(userIdOrEmail) : null;

  // 1. Check for base64url encoded payload in token parts
  if (!matchedUser && parts.length >= 4) {
    for (let i = 3; i < parts.length; i++) {
      try {
        const decodedStr = Buffer.from(parts[i], 'base64url').toString('utf8');
        const decoded = JSON.parse(decodedStr);
        if (decoded && (decoded.email || decoded.id)) {
          matchedUser = {
            id: decoded.id || userIdOrEmail,
            email: decoded.email,
            full_name: decoded.name || decoded.full_name || 'Citizen User',
            name: decoded.name || decoded.full_name || 'Citizen User',
            phone_number: decoded.phone_number || decoded.phone || '+91 98765 43210',
            dob: decoded.dob || null,
            avatar_url: decoded.avatar_url || null,
            role: decoded.role || userRole,
            roles: Array.isArray(decoded.roles) ? decoded.roles : [decoded.role || userRole],
            designation: (decoded.role || userRole) === 'citizen' ? 'Citizen / Resident' : 'Government Officer',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          saveDynamicUser(matchedUser);
          break;
        }
      } catch {}
    }
  }

  // 2. Check client identity headers
  const headerEmail = req?.headers?.['x-user-email'] ? String(req.headers['x-user-email']).toLowerCase().trim() : null;
  const headerId = req?.headers?.['x-user-id'] ? String(req.headers['x-user-id']).trim() : null;

  if (!matchedUser && (headerEmail || headerId)) {
    matchedUser = findUserByIdOrEmail(headerEmail) || findUserByIdOrEmail(headerId);
  }

  // 3. Fallback to Supabase database lookup
  if (!matchedUser && isSupabaseConfigured) {
    try {
      const candidates = [userIdOrEmail, headerEmail, headerId].filter(Boolean);
      for (const cand of candidates) {
        const isEmail = cand.includes('@');
        const query = isEmail
          ? supabase.from('profiles').select('*').eq('email', cand).maybeSingle()
          : supabase.from('profiles').select('*').eq('id', cand).maybeSingle();

        const { data: profile } = await query;
        if (profile) {
          const validRoles = ['citizen', 'officer', 'department_admin', 'super_admin'];
          const activeRole = validRoles.includes(profile.role) ? profile.role : (userRole || 'citizen');
          matchedUser = {
            ...profile,
            full_name: profile.full_name || profile.name || '',
            name: profile.name || profile.full_name || '',
            phone_number: profile.phone_number || profile.phone || '',
            phone: profile.phone || profile.phone_number || '',
            role: activeRole,
            roles: [activeRole],
            designation: activeRole === 'citizen' ? 'Citizen / Resident' : 'Government Officer',
            is_active: true,
            created_at: profile.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          saveDynamicUser(matchedUser);
          break;
        }
      }
    } catch (sbErr) {
      console.warn('[Session Fallback SB Notice]:', sbErr.message);
    }
  }

  // 4. Auto-restore citizen session for valid citizen mock token or recognized client email
  if (!matchedUser && (headerEmail || userRole === 'citizen')) {
    const emailToUse = headerEmail || (userIdOrEmail && userIdOrEmail.includes('@') ? userIdOrEmail : 'citizen.user@jansahayak.gov.in');
    const derivedName = emailToUse.split('@')[0]
      .replace(/[._0-9]+/g, ' ')
      .trim()
      .replace(/\b\w/g, c => c.toUpperCase()) || 'Citizen User';

    matchedUser = {
      id: (userIdOrEmail && userIdOrEmail.length > 10) ? userIdOrEmail : uuidv4(),
      email: emailToUse,
      full_name: derivedName,
      name: derivedName,
      phone_number: '+91 98765 43210',
      dob: '2000-01-01',
      avatar_url: null,
      role: userRole,
      roles: [userRole],
      department_id: null,
      designation: userRole === 'citizen' ? 'Citizen / Resident' : 'Government Officer',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    saveDynamicUser(matchedUser);
  }

  return matchedUser;
};

export const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Strict authentication: Require authorization header
    if (!authHeader || authHeader === 'Bearer null' || authHeader === 'Bearer undefined' || authHeader === 'Bearer') {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in or register.'
      });
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token || token === 'null' || token === 'undefined') {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in or register.'
      });
    }

    // Handle mock token with resilient session recovery
    if (token.startsWith('mock-token:')) {
      const matchedUser = await resolveMockUser(token, req);

      if (!matchedUser) {
        return res.status(401).json({
          success: false,
          message: 'Session expired or user not found. Please log in again.'
        });
      }

      req.user = matchedUser;
      return next();
    }

    // Verify token with Supabase if configured
    if (isSupabaseConfigured) {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
          return res.status(401).json({
            success: false,
            message: 'Session expired or invalid authentication token.'
          });
        }

        // Retrieve database profile with role
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!profile || (profile.is_active !== undefined && profile.is_active === false)) {
          return res.status(403).json({ success: false, message: 'Account is deactivated or unauthorized' });
        }

        // Retrieve authorized roles
        const { data: roleRecords } = await supabase
          .from('user_roles')
          .select('role, department_id')
          .eq('user_id', user.id);

        let userRoles = [];
        if (roleRecords && roleRecords.length > 0) {
          userRoles = Array.from(new Set(roleRecords.map(r => r.role)));
        } else if (Array.isArray(profile.roles) && profile.roles.length > 0) {
          userRoles = profile.roles;
        } else {
          const validRoles = ['citizen', 'officer', 'department_admin', 'super_admin'];
          userRoles = [validRoles.includes(profile.role) ? profile.role : 'citizen'];
        }

        const localUser = findUserByIdOrEmail(user.id) || findUserByIdOrEmail(user.email);
        req.user = {
          ...localUser,
          ...profile,
          role: userRoles[0],
          full_name: profile.full_name || profile.name || localUser?.full_name || '',
          name: profile.name || profile.full_name || localUser?.name || '',
          phone_number: profile.phone_number || profile.phone || localUser?.phone_number || '',
          phone: profile.phone || profile.phone_number || localUser?.phone || '',
          avatar_url: localUser?.avatar_url || profile.avatar_url || null,
          dob: localUser?.dob || profile.dob || null,
          roles: userRoles
        };
        return next();
      } catch (err) {
        console.warn('[Auth Middleware Warning]: Supabase validation error:', err.message);
      }
    }

    return res.status(401).json({
      success: false,
      message: 'Authentication failed. Please log in again.'
    });
  } catch (err) {
    console.error('[Auth Middleware Error]:', err);
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in.'
    });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader === 'Bearer null' || authHeader === 'Bearer undefined' || authHeader === 'Bearer') {
      req.user = null;
      return next();
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token || token === 'null' || token === 'undefined') {
      req.user = null;
      return next();
    }

    if (token.startsWith('mock-token:')) {
      req.user = await resolveMockUser(token, req);
      return next();
    }

    if (isSupabaseConfigured) {
      try {
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          const { data: roleRecords } = await supabase
            .from('user_roles')
            .select('role, department_id')
            .eq('user_id', user.id);

          let userRoles = [];
          if (roleRecords && roleRecords.length > 0) {
            userRoles = Array.from(new Set(roleRecords.map(r => r.role)));
          } else if (profile?.roles) {
            userRoles = profile.roles;
          } else {
            const validRoles = ['citizen', 'officer', 'department_admin', 'super_admin'];
            userRoles = [validRoles.includes(profile?.role) ? profile.role : 'citizen'];
          }

          const localUser = findUserByIdOrEmail(user.id) || findUserByIdOrEmail(user.email);
          req.user = profile ? {
            ...localUser,
            ...profile,
            role: userRoles[0],
            full_name: profile.full_name || profile.name || localUser?.full_name || '',
            name: profile.name || profile.full_name || localUser?.name || '',
            phone_number: profile.phone_number || profile.phone || localUser?.phone_number || '',
            phone: profile.phone || profile.phone_number || localUser?.phone || '',
            avatar_url: localUser?.avatar_url || profile.avatar_url || null,
            dob: localUser?.dob || profile.dob || null,
            roles: userRoles
          } : null;
        } else {
          req.user = null;
        }
      } catch {
        req.user = null;
      }
    } else {
      req.user = null;
    }
    next();
  } catch {
    req.user = null;
    next();
  }
};

export const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.user.role}' lacks permission to perform this action.`
      });
    }

    next();
  };
};
