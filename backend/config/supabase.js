import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseKey && 
  !supabaseUrl.includes('your-project-id') &&
  !supabaseKey.includes('your-')
);

let supabaseClient = null;

if (isSupabaseConfigured) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    console.log('[JanSahayak Backend] Supabase connected successfully to:', supabaseUrl);
  } catch (err) {
    console.warn('[JanSahayak Backend] Failed to initialize Supabase client:', err.message);
  }
} else {
  console.log('[JanSahayak Backend] Running in resilient Local State/Mock Database mode until Supabase credentials are configured in .env');
}

export const supabase = supabaseClient;
