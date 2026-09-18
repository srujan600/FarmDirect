/**
 * AgriDirect Supabase Client Initializer
 * Sovereign Kisan-to-Grahak Disintermediation Grid
 */

import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(
  rawUrl &&
  rawAnonKey &&
  !rawUrl.includes('your-project-id.supabase.co') &&
  !rawAnonKey.includes('your-anon-key-here')
);

// Fallback placeholder URL/Key prevents runtime crash if user hasn't added live keys yet
const supabaseUrl = isSupabaseConfigured ? rawUrl! : 'https://placeholder.supabase.co';
const supabaseAnonKey = isSupabaseConfigured ? rawAnonKey! : 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
  db: {
    schema: 'public',
  },
});
