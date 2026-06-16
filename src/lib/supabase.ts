import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

const browserUrl = supabaseUrl || 'http://127.0.0.1:54321';
const browserKey = supabaseKey || 'local-placeholder-key';

export const supabase = createClient(browserUrl, browserKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
