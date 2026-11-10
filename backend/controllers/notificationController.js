import { supabase, isSupabaseConfigured } from '../config/supabase.js';
import { mockNotifications } from '../services/mockDataStore.js';

export const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;
      return res.json({ success: true, data });
    }

    const userNotifs = mockNotifications.filter(n => n.user_id === userId);
    res.json({ success: true, data: userNotifs });
  } catch (err) {
    next(err);
  }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return res.json({ success: true, data });
    }

    const notif = mockNotifications.find(n => n.id === id && n.user_id === userId);
    if (notif) {
      notif.is_read = true;
      notif.read_at = new Date().toISOString();
    }

    res.json({ success: true, data: notif });
  } catch (err) {
    next(err);
  }
};
