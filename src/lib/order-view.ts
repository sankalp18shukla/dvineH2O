import { desc, eq } from 'drizzle-orm';
import { db } from './db';
import { orders, orderEvents } from './db/schema';

export async function loadOrder(number: string) {
  return db.query.orders.findFirst({
    where: eq(orders.number, number),
    with: { items: true, payments: true, shipments: true, invoices: true, refunds: true, returns: true, installations: true, events: { orderBy: desc(orderEvents.createdAt) } },
  });
}
export type FullOrder = NonNullable<Awaited<ReturnType<typeof loadOrder>>>;

export const STEPS = ['confirmed', 'processing', 'packed', 'shipped', 'delivered'] as const;
