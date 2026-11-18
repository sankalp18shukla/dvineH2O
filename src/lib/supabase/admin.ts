import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { secretKey, supabaseUrl } from './config';

/**
 * Privileged Supabase client (secret / service_role key) for Auth administration and Storage.
 * Server-only: `server-only` makes any client-side import a build error, and the key is never prefixed
 * NEXT_PUBLIC_. It has no access to the `dvine` schema (privileges revoked in the security migration).
 */
let client: SupabaseClient | null = null;

export function supabaseAdmin() {
  if (client) return client;
  const url = supabaseUrl(), key = secretKey();
  if (!url || !key) throw new Error('Supabase is not configured: set SUPABASE_URL and SUPABASE_SECRET_KEY.');
  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { 'x-application-name': 'dvine-web-admin' } },
  });
  return client;
}
