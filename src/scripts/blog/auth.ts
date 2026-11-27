import type { Session } from '@supabase/supabase-js';
import { supabase, supabaseConfigured } from '../../lib/blog/supabase';
import { ADMIN_EMAIL, blogBase } from '../../lib/blog/config';
import { setOptOut } from '../notrack';

export const base = blogBase(location.hostname);
export const adminUrl = (path = '') => `${base}/admin/${path}`;

/** Resolves to the admin session, or null after signing out anyone else. */
export async function adminSession(): Promise<Session | null> {
  if (!supabaseConfigured) return null;
  const { data } = await supabase().auth.getSession();
  const session = data.session;
  if (session && session.user.email?.toLowerCase() !== ADMIN_EMAIL) {
    await supabase().auth.signOut();
    return null;
  }
  // Veer's own browsers stay out of the site analytics once he has signed in here.
  if (session) setOptOut();
  return session;
}
