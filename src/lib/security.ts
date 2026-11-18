import 'server-only';
import crypto from 'node:crypto';
import { headers } from 'next/headers';
import { lt, sql } from 'drizzle-orm';
import { db } from './db';
import { rateLimits } from './db/schema';

/* ───────────── Secrets ───────────── */
let warned = false;
function appSecret() {
  const s = process.env.APP_SECRET ?? process.env.AUTH_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV === 'production') throw new Error('APP_SECRET must be set to a random string of at least 32 characters.');
  if (!warned) { console.warn('[security] APP_SECRET is not set; using a development-only value.'); warned = true; }
  return 'dev-only-app-secret-do-not-use-in-production';
}

/** Keyed hash, so stored identifiers (IPs, emails in rate-limit keys) can't be reversed or rainbow-tabled. */
export const keyedHash = (v: string) => crypto.createHmac('sha256', appSecret()).update(v).digest('base64url').slice(0, 32);

/* ───────────── Comparisons ───────────── */
/** Constant-time string comparison (no early exit on the first differing byte, no length leak). */
export function safeEqual(a: string | null | undefined, b: string | null | undefined) {
  if (typeof a !== 'string' || typeof b !== 'string' || !a || !b) return false;
  const x = crypto.createHash('sha256').update(a).digest(), y = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(x, y) && a.length === b.length;
}

/* ───────────── Request context ───────────── */
/** Client IP as seen by the edge (Vercel sets x-real-ip / the first x-forwarded-for hop). */
export async function clientIp() {
  const h = await headers();
  return (h.get('x-real-ip') ?? h.get('x-forwarded-for')?.split(',')[0] ?? '').trim() || 'unknown';
}
export const ipHash = async () => keyedHash(`ip:${await clientIp()}`);

/**
 * Route handlers that change state must be called from our own pages (Server Actions get this check from
 * Next.js automatically). Blocks cross-site form posts / fetches riding on the visitor's cookies.
 */
export function sameOrigin(req: Request) {
  const origin = req.headers.get('origin');
  if (!origin) return req.headers.get('sec-fetch-site') === 'same-origin';
  try {
    const o = new URL(origin).host;
    const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
    const site = process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL).host : null;
    return o === host || o === site;
  } catch { return false; }
}

/* ───────────── Rate limiting ─────────────
   Fixed windows stored in Postgres, so the limit holds across every serverless instance.
   Supabase Auth applies its own limits to sign-in, sign-up and email sends on top of these. */
export type Limit = { limit: number; windowSec: number };
export const LIMITS = {
  login: { limit: 8, windowSec: 15 * 60 },          // per IP+identifier
  loginIp: { limit: 40, windowSec: 15 * 60 },       // per IP, any identifier
  register: { limit: 5, windowSec: 60 * 60 },
  passwordReset: { limit: 4, windowSec: 60 * 60 },
  mfa: { limit: 6, windowSec: 10 * 60 },
  form: { limit: 12, windowSec: 10 * 60 },          // enquiries, support, bookings
  upload: { limit: 10, windowSec: 60 * 60 },
  track: { limit: 15, windowSec: 15 * 60 },         // order lookup (enumeration)
  coupon: { limit: 20, windowSec: 15 * 60 },        // code guessing
  chat: { limit: 60, windowSec: 10 * 60 },
  payment: { limit: 20, windowSec: 15 * 60 },
  pincode: { limit: 60, windowSec: 10 * 60 },
} satisfies Record<string, Limit>;
export type LimitName = keyof typeof LIMITS;

/** Counts one hit against `name` for each identifier; false when any of them is over its limit. */
export async function rateLimit(name: LimitName, ...ids: string[]): Promise<boolean> {
  const { windowSec } = LIMITS[name];
  const limit = LIMITS[name].limit * (process.env.NODE_ENV === 'production' ? 1 : 10); // roomier for local dev & tests
  const keys = (ids.length ? ids : [await clientIp()]).map(id => `${name}:${keyedHash(id)}`);
  try {
    for (const key of keys) {
      const [row] = await db.insert(rateLimits).values({ key, hits: 1, resetAt: new Date(Date.now() + windowSec * 1000) })
        .onConflictDoUpdate({
          target: rateLimits.key,
          set: {
            hits: sql`case when ${rateLimits.resetAt} <= now() then 1 else ${rateLimits.hits} + 1 end`,
            resetAt: sql`case when ${rateLimits.resetAt} <= now() then now() + make_interval(secs => ${windowSec}) else ${rateLimits.resetAt} end`,
          },
        })
        .returning({ hits: rateLimits.hits });
      if (row.hits > limit) return false;
    }
    return true;
  } catch (e) {
    // Fail open: a database hiccup must not lock every customer out. Supabase Auth still rate-limits sign-ins.
    console.error('[rate-limit]', name, e);
    return true;
  }
}

/**
 * Limit by the caller's IP, or — when identifiers are given (the email being tried, a staff id) — by each
 * identifier from this IP. Pair with a plain per-IP bucket (e.g. `loginIp`) for an overall ceiling.
 */
export async function limitRequest(name: LimitName, ...extra: (string | null | undefined)[]) {
  const ip = await clientIp();
  const ids = extra.filter((x): x is string => !!x).map(x => `${x.toLowerCase()}|${ip}`);
  return rateLimit(name, ...(ids.length ? ids : [`ip:${ip}`]));
}

export const TOO_MANY = 'Too many attempts. Please wait a few minutes and try again.';

/** Housekeeping for the maintenance job. */
export async function purgeRateLimits() {
  await db.delete(rateLimits).where(lt(rateLimits.resetAt, new Date(Date.now() - 86_400_000)));
}

/* ───────────── Redirect targets ───────────── */
/** Only same-site relative paths, never `//evil.com` or `/\evil.com`. */
export function safeNext(n: unknown, fallback: string) {
  return typeof n === 'string' && /^\/(?![\/\\])[\w\-./?=&%#~+,:@]*$/.test(n) ? n : fallback;
}
