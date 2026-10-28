import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { refunds } from '@/lib/db/schema';
import { verifyWebhookSignature } from '@/lib/razorpay';
import { applyPaymentSuccess, applyPaymentFailure } from '@/lib/orders';

/** Razorpay webhook: payment.captured, payment.failed, order.paid, refund.processed / refund.failed. */
export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get('x-razorpay-signature') ?? '';
  if (!verifyWebhookSignature(raw, sig)) return NextResponse.json({ error: 'bad signature' }, { status: 401 });
  const evt = JSON.parse(raw) as { event: string; payload: { payment?: { entity: { id: string; order_id: string; method?: string; error_code?: string; error_description?: string; error_step?: string } }; refund?: { entity: { id: string; status: string } } } };
  const p = evt.payload.payment?.entity;
  try {
    if ((evt.event === 'payment.captured' || evt.event === 'order.paid') && p) await applyPaymentSuccess(p.order_id, p.id, p.method);
    else if (evt.event === 'payment.failed' && p) await applyPaymentFailure(p.order_id, { gatewayPaymentId: p.id, code: p.error_code, description: p.error_description, stage: p.error_step, method: p.method });
    else if (evt.event.startsWith('refund.') && evt.payload.refund) {
      const r = evt.payload.refund.entity;
      await db.update(refunds).set(r.status === 'processed' ? { status: 'processed', completedAt: new Date() } : { status: r.status === 'failed' ? 'failed' : 'pending' }).where(and(eq(refunds.gatewayRefundId, r.id)));
    }
  } catch (e) {
    console.error('razorpay webhook', e);
    return NextResponse.json({ error: 'processing failed' }, { status: 500 }); // Razorpay retries
  }
  return NextResponse.json({ ok: true });
}
