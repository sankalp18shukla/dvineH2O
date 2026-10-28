'use server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders, waterTests } from '@/lib/db/schema';
import { startPayment, confirmRazorpayPayment, applyPaymentFailure } from '@/lib/orders';

async function authorised(kind: 'order' | 'water_test', ref: string, token: string) {
  if (kind === 'order') {
    const o = await db.query.orders.findFirst({ where: eq(orders.number, ref) });
    if (!o || o.accessToken !== token) throw new Error('Not found');
    return { purpose: 'order' as const, order: o };
  }
  const t = await db.query.waterTests.findFirst({ where: eq(waterTests.ref, ref) });
  if (!t || t.accessToken !== token) throw new Error('Not found');
  return { purpose: 'water_test' as const, test: t };
}

export async function beginPayment(kind: 'order' | 'water_test', ref: string, token: string) {
  const target = await authorised(kind, ref, token);
  if (target.purpose === 'order') {
    if (target.order.paymentStatus === 'paid') return { already: true as const };
    if (target.order.status === 'cancelled') return { error: 'This order was cancelled because payment was not completed in time. Please place it again.' };
  } else if (target.test.paymentStatus === 'paid' || target.test.paymentStatus === 'not_required') return { already: true as const };
  try { return { session: await startPayment(target) }; }
  catch (e) { return { error: e instanceof Error ? e.message : 'Could not start payment.' }; }
}

export async function completeRazorpay(kind: 'order' | 'water_test', ref: string, token: string, r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
  await authorised(kind, ref, token);
  try { await confirmRazorpayPayment(r.razorpay_order_id, r.razorpay_payment_id, r.razorpay_signature); return { ok: true }; }
  catch (e) { return { error: e instanceof Error ? e.message : 'Payment could not be verified.' }; }
}

export async function failRazorpay(kind: 'order' | 'water_test', ref: string, token: string, gatewayOrderId: string, err: { code?: string; description?: string; step?: string; payment_id?: string }) {
  await authorised(kind, ref, token);
  await applyPaymentFailure(gatewayOrderId, { code: err.code, description: err.description, stage: err.step, gatewayPaymentId: err.payment_id });
}

/** Built-in test gateway (only when Razorpay is not configured and test payments are allowed). */
export async function completeTestPayment(kind: 'order' | 'water_test', ref: string, token: string, gatewayOrderId: string, outcome: 'success' | 'failure', method: string) {
  const { testPaymentsAllowed } = await import('@/lib/payments-mode');
  if (!testPaymentsAllowed()) return { error: 'Test payments are disabled.' };
  await authorised(kind, ref, token);
  const { applyPaymentSuccess } = await import('@/lib/orders');
  if (outcome === 'success') { await applyPaymentSuccess(gatewayOrderId, `test_pay_${Date.now()}`, method); return { ok: true }; }
  await applyPaymentFailure(gatewayOrderId, { code: 'TEST_DECLINED', description: 'Test payment declined', stage: 'authorisation', method });
  return { failed: true };
}
