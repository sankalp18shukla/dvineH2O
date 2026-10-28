import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { shipments, orders, orderExceptions } from '@/lib/db/schema';
import { mapStatus } from '@/lib/shiprocket';
import { setOrderStatus } from '@/lib/orders';

/** Shiprocket tracking webhook. Configure the URL with ?token=SHIPROCKET_WEBHOOK_TOKEN (or the x-api-key header). */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token') ?? req.headers.get('x-api-key');
  if (!process.env.SHIPROCKET_WEBHOOK_TOKEN || token !== process.env.SHIPROCKET_WEBHOOK_TOKEN) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
  const b = await req.json().catch(() => null) as { awb?: string; current_status?: string; shipment_status?: string; current_timestamp?: string; scans?: { date: string; activity: string; location: string }[]; etd?: string } | null;
  if (!b?.awb) return NextResponse.json({ ok: true });
  const s = await db.query.shipments.findFirst({ where: eq(shipments.awb, b.awb) });
  if (!s) return NextResponse.json({ ok: true });
  const text = b.current_status ?? b.shipment_status ?? '';
  const status = mapStatus(text);
  const events = [...(s.events ?? []), { at: new Date().toISOString(), status: text, location: b.scans?.at(-1)?.location }].slice(-50);
  await db.update(shipments).set({ status, events, expectedAt: b.etd ? new Date(b.etd) : s.expectedAt, deliveredAt: status === 'delivered' ? new Date() : s.deliveredAt, dispatchedAt: s.dispatchedAt ?? (status === 'in_transit' ? new Date() : null) }).where(eq(shipments.id, s.id));
  const o = await db.query.orders.findFirst({ where: eq(orders.id, s.orderId) });
  try {
    if (o && status === 'in_transit' && o.status === 'packed') await setOrderStatus(o.id, 'shipped', 'system', `Picked up by ${s.courier ?? 'courier'}`);
    if (o && status === 'delivered' && o.status === 'shipped') await setOrderStatus(o.id, 'delivered', 'system', 'Delivered (courier update)');
    if (o && (status === 'exception' || status === 'rto')) await db.insert(orderExceptions).values({ orderId: o.id, type: 'delivery_failure', note: text });
  } catch (e) { console.error('shiprocket webhook', e); }
  return NextResponse.json({ ok: true });
}
