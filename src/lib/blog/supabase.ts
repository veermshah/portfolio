import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.PUBLIC_SUPABASE_URL;
const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && anonKey);

let client: SupabaseClient | undefined;

/** Anon-key client. Row Level Security decides what each caller can read or write. */
export function supabase(): SupabaseClient {
  if (!supabaseConfigured) throw new Error('PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY must be set.');
  client ??= createClient(url, anonKey, {
    auth: { persistSession: typeof window !== 'undefined', autoRefreshToken: typeof window !== 'undefined' },
  });
  return client;
}
