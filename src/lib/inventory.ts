import { and, eq, sql } from 'drizzle-orm';
import type { Tx } from './db';
import { products, stockMovements } from './db/schema';

export const available = (p: { onHand: number; reserved: number }) => Math.max(0, p.onHand - p.reserved);
export const stockState = (p: { onHand: number; reserved: number; reorderLevel: number; buildToOrder: boolean }) =>
  p.buildToOrder ? 'build_to_order' : available(p) <= 0 ? 'out_of_stock' : available(p) <= p.reorderLevel ? 'low_stock' : 'in_stock';

export class StockError extends Error {}

/** Hold stock for an unpaid order. Fails if not enough is available (unless build-to-order). */
export async function reserve(tx: Tx, productId: number, qty: number, reference: string) {
  const rows = await tx.update(products).set({ reserved: sql`${products.reserved} + ${qty}` })
    .where(and(eq(products.id, productId), sql`(${products.onHand} - ${products.reserved} >= ${qty} OR ${products.buildToOrder} = 1)`))
    .returning({ onHand: products.onHand, reserved: products.reserved, name: products.shortName });
  if (!rows.length) {
    const p = await tx.query.products.findFirst({ where: eq(products.id, productId) });
    throw new StockError(`Only ${p ? available(p) : 0} ${p?.shortName ?? 'units'} left in stock.`);
  }
  await tx.insert(stockMovements).values({ productId, type: 'reserve', qty: 0, onHandAfter: rows[0].onHand, reservedAfter: rows[0].reserved, reference, note: `Reserved ${qty}` });
}

export async function release(tx: Tx, productId: number, qty: number, reference: string, note = 'Reservation released') {
  const [r] = await tx.update(products).set({ reserved: sql`max(0, ${products.reserved} - ${qty})` }).where(eq(products.id, productId))
    .returning({ onHand: products.onHand, reserved: products.reserved });
  await tx.insert(stockMovements).values({ productId, type: 'release', qty: 0, onHandAfter: r.onHand, reservedAfter: r.reserved, reference, note: `${note} (${qty})` });
}

/** Payment confirmed: reserved units leave on-hand stock. */
export async function commitSale(tx: Tx, productId: number, qty: number, reference: string) {
  const [r] = await tx.update(products).set({ onHand: sql`${products.onHand} - ${qty}`, reserved: sql`max(0, ${products.reserved} - ${qty})` })
    .where(eq(products.id, productId)).returning({ onHand: products.onHand, reserved: products.reserved });
  await tx.insert(stockMovements).values({ productId, type: 'sale', qty: -qty, onHandAfter: r.onHand, reservedAfter: r.reserved, reference });
}

/** Inward / return / adjustment / damage (qty is the signed change to on-hand). */
export async function moveStock(tx: Tx, productId: number, type: 'inward' | 'return' | 'adjustment' | 'damage', qty: number, opts: { reference?: string; note?: string; staffId?: number } = {}) {
  const [r] = await tx.update(products).set({ onHand: sql`max(0, ${products.onHand} + ${qty})` }).where(eq(products.id, productId))
    .returning({ onHand: products.onHand, reserved: products.reserved });
  await tx.insert(stockMovements).values({ productId, type, qty, onHandAfter: r.onHand, reservedAfter: r.reserved, reference: opts.reference, note: opts.note, staffId: opts.staffId });
}
