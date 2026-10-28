import { eq } from 'drizzle-orm';
import { db } from './db';
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
  phone: '1800 202 4504', email: 'care@dvineh2o.com', invoicePrefix: 'DVH', confirmed: false,
};
export const DEFAULT_COMMERCE: Commerce = {
  shippingFee: 0, freeShippingAbove: 0, reservationMinutes: 30, abandonmentMinutes: 60, returnWindowDays: 7, cancelBefore: 'packed',
};

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await db.query.settings.findFirst({ where: eq(settings.key, key) });
  return row ? { ...fallback, ...(row.value as object) } as T : fallback;
}
export const getCompany = () => getSetting<Company>('company', DEFAULT_COMPANY);
export const getCommerce = () => getSetting<Commerce>('commerce', DEFAULT_COMMERCE);

export async function setSetting(key: string, value: unknown) {
  await db.insert(settings).values({ key, value }).onConflictDoUpdate({ target: settings.key, set: { value } });
}
