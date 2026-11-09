/**
 * PhonePe Payment Gateway — Standard Checkout (API v2).
 * The customer is redirected to PhonePe's hosted page (UPI, cards, net banking, wallets), then back to us.
 * We never trust the redirect: every outcome is confirmed with the Order Status API or a verified webhook.
 * No card/UPI data touches our servers — only PhonePe references are stored.
 */
import 'server-only';
import crypto from 'node:crypto';

const env = () => (process.env.PHONEPE_ENV === 'production' ? 'production' : 'sandbox');
const BASE = () => env() === 'production' ? 'https://api.phonepe.com/apis/pg' : 'https://api-preprod.phonepe.com/apis/pg-sandbox';
const AUTH_URL = () => env() === 'production'
  ? 'https://api.phonepe.com/apis/identity-manager/v1/oauth/token'
  : 'https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token';

export const phonepeEnabled = () => !!(process.env.PHONEPE_CLIENT_ID && process.env.PHONEPE_CLIENT_SECRET);
export const phonepeMode = env;

/* ── OAuth token (cached until shortly before it expires) ── */
let cached: { token: string; type: string; exp: number } | null = null;

async function token() {
  if (cached && cached.exp - 60 > Date.now() / 1000) return cached;
  const body = new URLSearchParams({
    client_id: process.env.PHONEPE_CLIENT_ID ?? '',
    client_version: process.env.PHONEPE_CLIENT_VERSION ?? '1',
    client_secret: process.env.PHONEPE_CLIENT_SECRET ?? '',
    grant_type: 'client_credentials',
  });
  const r = await fetch(AUTH_URL(), { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body, cache: 'no-store' });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) throw new Error(`PhonePe sign-in failed${j?.message ? `: ${j.message}` : ` (${r.status})`}`);
  cached = { token: j.access_token, type: j.token_type || 'O-Bearer', exp: Number(j.expires_at) || Date.now() / 1000 + 600 };
  return cached;
}

async function pp<T>(path: string, init: RequestInit = {}): Promise<T> {
  const t = await token();
  const r = await fetch(`${BASE()}${path}`, {
    ...init, cache: 'no-store',
    headers: { 'Content-Type': 'application/json', Authorization: `${t.type} ${t.token}`, ...(init.headers ?? {}) },
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.message ?? `PhonePe error ${r.status}`);
  return j as T;
}

/** PhonePe merchant order ids: max 63 chars, letters, digits, _ and -. One per attempt. */
export const merchantOrderId = (receipt: string, attempt: number) =>
  `${receipt.replace(/[^A-Za-z0-9_-]/g, '')}-${attempt}-${crypto.randomBytes(3).toString('hex')}`.slice(0, 63);

export type PPState = 'PENDING' | 'COMPLETED' | 'FAILED';

/** Creates a checkout session. Returns PhonePe's hosted payment URL. Amount in paise. */
export const createPhonePePayment = (input: { merchantOrderId: string; amount: number; redirectUrl: string; message: string; meta?: Record<string, string>; expireAfter?: number }) =>
  pp<{ orderId: string; state: PPState; expireAt: number; redirectUrl: string }>('/checkout/v2/pay', {
    method: 'POST',
    body: JSON.stringify({
      merchantOrderId: input.merchantOrderId,
      amount: input.amount,
      expireAfter: input.expireAfter ?? 1200,
      metaInfo: input.meta ?? {},
      paymentFlow: { type: 'PG_CHECKOUT', message: input.message.slice(0, 120), merchantUrls: { redirectUrl: input.redirectUrl } },
    }),
  });

export type PPPaymentDetail = { paymentMode?: string; transactionId?: string; state?: string; errorCode?: string; detailedErrorCode?: string; amount?: number };
export type PPOrderStatus = { orderId?: string; state: PPState; amount: number; errorCode?: string; detailedErrorCode?: string; paymentDetails?: PPPaymentDetail[] };

export const fetchPhonePeStatus = (merchantOrderId: string) =>
  pp<PPOrderStatus>(`/checkout/v2/order/${encodeURIComponent(merchantOrderId)}/status?details=false`);

export const createPhonePeRefund = (merchantRefundId: string, originalMerchantOrderId: string, amount: number) =>
  pp<{ refundId: string; amount: number; state: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'FAILED' }>('/payments/v2/refund', {
    method: 'POST', body: JSON.stringify({ merchantRefundId, originalMerchantOrderId, amount }),
  });

export const fetchPhonePeRefund = (merchantRefundId: string) =>
  pp<{ state: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'FAILED'; amount: number; errorCode?: string }>(`/payments/v2/refund/${encodeURIComponent(merchantRefundId)}/status`);

/** Latest attempt's details, normalised for our payments table. */
export function summarise(s: PPOrderStatus) {
  const d = s.paymentDetails?.[s.paymentDetails.length - 1];
  return {
    transactionId: d?.transactionId,
    method: d?.paymentMode?.toLowerCase().replace(/_/g, ' '),
    errorCode: d?.errorCode ?? s.errorCode,
    errorDescription: d?.detailedErrorCode ?? s.detailedErrorCode ?? d?.errorCode ?? s.errorCode,
  };
}

/**
 * Webhook auth: PhonePe sends `Authorization: SHA256(username:password)` (hex), using the
 * username/password set for the webhook in the PhonePe dashboard.
 */
export function verifyPhonePeWebhook(authHeader: string | null) {
  const u = process.env.PHONEPE_WEBHOOK_USERNAME, p = process.env.PHONEPE_WEBHOOK_PASSWORD;
  if (!u || !p || !authHeader) return false;
  const expected = crypto.createHash('sha256').update(`${u}:${p}`).digest('hex');
  const got = authHeader.replace(/^SHA256\s+/i, '').trim().toLowerCase();
  const a = Buffer.from(expected), b = Buffer.from(got);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
