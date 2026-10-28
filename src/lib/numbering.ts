import { sql } from 'drizzle-orm';
import { counters } from './db/schema';
import { fiscalYear } from './gst';
import type { Tx, DB } from './db';

/** Atomically increments a named counter and returns the new value. */
export async function nextCounter(tx: Tx | DB, key: string) {
  const rows = await tx.insert(counters).values({ key, value: 1 })
    .onConflictDoUpdate({ target: counters.key, set: { value: sql`${counters.value} + 1` } })
    .returning({ value: counters.value });
  return rows[0].value;
}

const yy = () => String(new Date().getFullYear() % 100).padStart(2, '0');
const pad = (n: number, w: number) => String(n).padStart(w, '0');

export const orderNumber = async (tx: Tx | DB) => `DV-${yy()}-${pad(await nextCounter(tx, `order:${yy()}`), 6)}`;
export const enquiryRef = async (tx: Tx | DB) => `EQ-${yy()}-${pad(await nextCounter(tx, `enquiry:${yy()}`), 5)}`;
export const waterTestRef = async (tx: Tx | DB) => `WT-${yy()}-${pad(await nextCounter(tx, `watertest:${yy()}`), 5)}`;
export const ticketNumber = async (tx: Tx | DB) => `SR-${yy()}-${pad(await nextCounter(tx, `ticket:${yy()}`), 5)}`;

/** GST invoice series per financial year: DVH/2026-27/0001 (credit notes: DVH/CN/2026-27/0001). */
export async function invoiceNumber(tx: Tx | DB, kind: 'invoice' | 'credit_note', prefix: string, date = new Date()) {
  const fy = fiscalYear(date);
  const seq = await nextCounter(tx, `${kind}:${fy}`);
  const number = kind === 'invoice' ? `${prefix}/${fy}/${pad(seq, 4)}` : `${prefix}/CN/${fy}/${pad(seq, 4)}`;
  return { fy, seq, number };
}

export function randomToken(bytes = 18) {
  const a = new Uint8Array(bytes); crypto.getRandomValues(a);
  return Buffer.from(a).toString('base64url');
}
