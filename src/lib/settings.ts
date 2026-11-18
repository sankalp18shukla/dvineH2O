import { eq } from 'drizzle-orm';
import { db, type DB, type Tx } from './db';
import { settings } from './db/schema';

export type Company = {
  legalName: string; tradeName: string; gstin: string; pan: string;
  address: string; city: string; state: string; pincode: string;
  phone: string; email: string; invoicePrefix: string; confirmed: boolean;
};
export type Commerce = {
  shippingFee: number;            // paise, 0 = free delivery
  freeShippingAbove: number;      // paise
  reservationMinutes: number;     // how long stock is held for an unpaid order
  abandonmentMinutes: number;     // cart inactivity before it counts as abandoned
  returnWindowDays: number;
  cancelBefore: 'packed' | 'shipped';
};

export const DEFAULT_COMPANY: Company = {
  legalName: 'DVINE H2O', tradeName: 'DVINE H2O', gstin: '', pan: '',
  address: '', city: '', state: '', pincode: '',
  phone: '1800 202 4504', email: 'reachout@dvineh2o.com', invoicePrefix: 'DVH', confirmed: false,
};
export const DEFAULT_COMMERCE: Commerce = {
  shippingFee: 0, freeShippingAbove: 0, reservationMinutes: 30, abandonmentMinutes: 60, returnWindowDays: 7, cancelBefore: 'packed',
};

/** Pass `q` (the open transaction) when called inside db.transaction, so it doesn't need a second connection. */
export async function getSetting<T>(key: string, fallback: T, q: DB | Tx = db): Promise<T> {
  const row = await q.query.settings.findFirst({ where: eq(settings.key, key) });
  return row ? { ...fallback, ...(row.value as object) } as T : fallback;
}
export const getCompany = (q?: DB | Tx) => getSetting<Company>('company', DEFAULT_COMPANY, q);
export const getCommerce = (q?: DB | Tx) => getSetting<Commerce>('commerce', DEFAULT_COMMERCE, q);

export async function setSetting(key: string, value: unknown) {
  await db.insert(settings).values({ key, value }).onConflictDoUpdate({ target: settings.key, set: { value } });
}
