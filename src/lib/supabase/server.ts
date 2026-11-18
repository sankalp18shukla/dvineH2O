import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { authCookieOptions, publishableKey, supabaseUrl } from './config';

/**
 * Supabase client bound to the visitor's auth cookies (Server Components, Server Actions, Route Handlers).
 * Uses the publishable key: it can only do what the signed-in user may do in Supabase Auth.
 * It is never used for data — the `dvine` schema isn't exposed to the API at all.
 */
export async function supabaseServer() {
  const jar = await cookies();
  return createServerClient(supabaseUrl(), publishableKey(), {
    cookieOptions: authCookieOptions,
    auth: { flowType: 'pkce' },
    cookies: {
      getAll: () => jar.getAll(),
      setAll: list => {
        try {
          for (const { name, value, options } of list) jar.set(name, value, { ...options, httpOnly: true });
        } catch {
          // Called from a Server Component, where cookies are read-only. The middleware refreshes sessions.
        }
      },
    },
  });
}
