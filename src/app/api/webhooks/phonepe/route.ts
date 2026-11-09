import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { payments, refunds } from '@/lib/db/schema';
import { verifyPhonePeWebhook } from '@/lib/phonepe';
import { syncPhonePePayment } from '@/lib/orders';

/**
 * PhonePe webhook (Standard Checkout v2): checkout.order.completed / checkout.order.failed,
 * pg.refund.accepted / pg.refund.completed / pg.refund.failed.
 * Order events are re-confirmed with the Order Status API rather than trusting the body.
 */
export async function POST(req: Request) {
  if (!verifyPhonePeWebhook(req.headers.get('authorization'))) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
  const body = await req.json().catch(() => null) as { event?: string; type?: string; payload?: { merchantOrderId?: string; originalMerchantOrderId?: string; merchantRefundId?: string; state?: string } } | null;
  if (!body?.payload) return NextResponse.json({ error: 'bad payload' }, { status: 400 });
  const evt = (body.event ?? body.type ?? '').toLowerCase().replace(/_/g, '.');
  const pl = body.payload;
  try {
    if (evt.includes('refund') && pl.merchantRefundId) {
      const st = (pl.state ?? '').toUpperCase();
      if (st === 'COMPLETED') await db.update(refunds).set({ status: 'processed', completedAt: new Date() }).where(eq(refunds.gatewayRefundId, pl.merchantRefundId));
      else if (st === 'FAILED') await db.update(refunds).set({ status: 'failed' }).where(eq(refunds.gatewayRefundId, pl.merchantRefundId));
    } else if (pl.merchantOrderId) {
      const known = await db.query.payments.findFirst({ where: eq(payments.gatewayOrderId, pl.merchantOrderId) });
      if (known) await syncPhonePePayment(pl.merchantOrderId);
    }
  } catch (e) {
    console.error('phonepe webhook', e);
    return NextResponse.json({ error: 'processing failed' }, { status: 500 }); // PhonePe retries
  }
  return NextResponse.json({ ok: true });
}
