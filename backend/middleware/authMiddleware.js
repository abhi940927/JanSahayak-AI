import { supabase, isSupabaseConfigured } from '../config/supabase.js';
import { mockUsers, findUserByIdOrEmail } from '../services/mockDataStore.js';

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

    // Handle mock token
    if (token.startsWith('mock-token:')) {
      const parts = token.split(':');
      const userIdOrEmail = parts[2];
      const matchedUser = userIdOrEmail ? findUserByIdOrEmail(userIdOrEmail) : null;

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
          userRoles = [profile.role || 'citizen'];
        }

        const localUser = findUserByIdOrEmail(user.id) || findUserByIdOrEmail(user.email);
        req.user = {
          ...localUser,
          ...profile,
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
      const parts = token.split(':');
      const userIdOrEmail = parts[2];
      req.user = userIdOrEmail ? findUserByIdOrEmail(userIdOrEmail) : null;
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
            userRoles = [profile?.role || 'citizen'];
          }

          const localUser = findUserByIdOrEmail(user.id) || findUserByIdOrEmail(user.email);
          req.user = profile ? {
            ...localUser,
            ...profile,
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
