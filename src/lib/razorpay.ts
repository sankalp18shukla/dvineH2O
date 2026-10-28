/** Razorpay REST integration. No card/UPI data ever touches our servers — only gateway references. */
import crypto from 'node:crypto';

export const razorpayEnabled = () => !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
const auth = () => 'Basic ' + Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');

async function rzp<T>(path: string, init: RequestInit = {}): Promise<T> {
  const r = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...init, headers: { Authorization: auth(), 'Content-Type': 'application/json', ...(init.headers ?? {}) }, cache: 'no-store',
  });
  const body = await r.json();
  if (!r.ok) throw new Error(body?.error?.description ?? `Razorpay error ${r.status}`);
  return body as T;
}

export const createRzpOrder = (amount: number, receipt: string, notes: Record<string, string>) =>
  rzp<{ id: string; amount: number; currency: string }>('/orders', { method: 'POST', body: JSON.stringify({ amount, currency: 'INR', receipt, notes, payment_capture: 1 }) });

export const fetchRzpPayment = (id: string) => rzp<{ id: string; status: string; method: string; amount: number; order_id: string; error_code?: string; error_description?: string }>(`/payments/${id}`);

export const createRzpRefund = (paymentId: string, amount: number, notes: Record<string, string>) =>
  rzp<{ id: string; status: string; amount: number }>(`/payments/${paymentId}/refund`, { method: 'POST', body: JSON.stringify({ amount, notes, speed: 'normal' }) });

const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

/** Checkout handler signature: HMAC_SHA256(order_id|payment_id, key_secret). */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string) {
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET ?? '').update(`${orderId}|${paymentId}`).digest('hex');
  return safeEqual(expected, signature);
}
/** Webhook signature: HMAC_SHA256(raw body, webhook secret). */
export function verifyWebhookSignature(rawBody: string, signature: string) {
  const s = process.env.RAZORPAY_WEBHOOK_SECRET; if (!s) return false;
  return safeEqual(crypto.createHmac('sha256', s).update(rawBody).digest('hex'), signature);
}
