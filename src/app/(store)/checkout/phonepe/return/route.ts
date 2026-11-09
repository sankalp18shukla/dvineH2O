import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders, payments, waterTests } from '@/lib/db/schema';
import { syncPhonePePayment } from '@/lib/orders';

export const dynamic = 'force-dynamic';

/**
 * PhonePe sends the customer back here after the hosted payment page.
 * The redirect itself proves nothing, so the outcome is read from PhonePe's Order Status API.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const m = url.searchParams.get('m') ?? '', t = url.searchParams.get('t') ?? '';
  const go = (path: string) => NextResponse.redirect(new URL(path, url.origin), 303);

  const p = m ? await db.query.payments.findFirst({ where: eq(payments.gatewayOrderId, m) }) : null;
  if (!p || p.gateway !== 'phonepe') return go('/');

  let ok: string, retry: string;
  if (p.purpose === 'order' && p.orderId) {
    const o = await db.query.orders.findFirst({ where: eq(orders.id, p.orderId) });
    if (!o || o.accessToken !== t) return go('/');
    ok = `/order/${o.number}?t=${o.accessToken}&paid=1`; retry = `/checkout/pay/${o.number}?t=${o.accessToken}`;
  } else if (p.waterTestId) {
    const w = await db.query.waterTests.findFirst({ where: eq(waterTests.id, p.waterTestId) });
    if (!w || w.accessToken !== t) return go('/');
    ok = `/water-testing/booking/${w.ref}?t=${w.accessToken}`; retry = ok;
  } else return go('/');

  let state: string;
  try { state = await syncPhonePePayment(m); }
  catch (e) { console.error('phonepe return', m, e); state = 'PENDING'; }

  if (state === 'COMPLETED') return go(ok);
  return go(`${retry}&pp=${state === 'FAILED' ? 'failed' : 'pending'}`);
}
