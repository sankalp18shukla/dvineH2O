/**
 * Supabase settings. Server-side only: the browser never receives a Supabase key or talks to Supabase
 * directly (except PUT-ing an admin media file to a one-time signed upload URL).
 *
 *   SUPABASE_URL              https://<project-ref>.supabase.co
 *   SUPABASE_PUBLISHABLE_KEY  sb_publishable_…  (or the legacy anon key as SUPABASE_ANON_KEY)
 *   SUPABASE_SECRET_KEY       sb_secret_…       (or the legacy service_role key as SUPABASE_SERVICE_ROLE_KEY)
 */
export const supabaseUrl = () => (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/$/, '');
export const publishableKey = () => process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
export const secretKey = () => process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
export const supabaseConfigured = () => !!(supabaseUrl() && publishableKey());

/**
 * Auth cookies: HttpOnly (page scripts can never read a session), Secure in production, SameSite=Lax.
 * The refresh token lives as long as Supabase's session settings allow; the cookie itself is capped at 30 days.
 */
export const authCookieOptions = {
  name: 'dvine-auth',
  path: '/',
  sameSite: 'lax' as const,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 60 * 60 * 24 * 30,
};

/** Public URL of a file in a public bucket. */
export const publicFileUrl = (bucket: string, path: string) =>
  `${supabaseUrl()}/storage/v1/object/public/${bucket}/${path.split('/').map(encodeURIComponent).join('/')}`;
