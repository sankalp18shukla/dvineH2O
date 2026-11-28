/**
 * Per-product cancel and return rules (client, Nov 2026), on top of Admin › Settings › Commerce:
 *  - Hyper orders must be cancelled within 24 hours of being placed;
 *  - Crystal can be returned within 30 days of delivery (other products use the store's return window).
 * Products are told apart by SKU, which the order line keeps even if the product is renamed.
 */
import type { Commerce } from './settings';

type Line = { sku: string };
const kind = (sku: string) => (sku.startsWith('DVH-HYP') ? 'hyper' : sku.startsWith('DVH-CRY') ? 'crystal' : sku.startsWith('DVH-TTN') ? 'titan' : 'other');

/** Hours after placing within which an order with this product can still be cancelled (null = no limit). */
const CANCEL_HOURS: Partial<Record<ReturnType<typeof kind>, number>> = { hyper: 24 };
/** Days after delivery within which this product can be returned (null = the store's window). */
const RETURN_DAYS: Partial<Record<ReturnType<typeof kind>, number>> = { crystal: 30 };

/** The latest moment the order can be cancelled online, or null when only its status decides. */
export function cancelDeadline(order: { placedAt: Date | null; createdAt: Date; items: Line[] }) {
  const hours = order.items.map(i => CANCEL_HOURS[kind(i.sku)]).filter((h): h is number => h !== undefined);
  if (!hours.length) return null;
  const from = order.placedAt ?? order.createdAt;
  return new Date(from.getTime() + Math.min(...hours) * 3600_000);
}

/** Return window in days for one order line. */
export const returnDays = (line: Line, commerce: Commerce) => RETURN_DAYS[kind(line.sku)] ?? commerce.returnWindowDays;

/** The longest return window in an order (the return form shows only while one line is still returnable). */
export const orderReturnDays = (items: Line[], commerce: Commerce) => Math.max(0, ...items.map(i => returnDays(i, commerce)));
