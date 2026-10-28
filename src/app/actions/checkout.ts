'use server';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders, pincodes } from '@/lib/db/schema';
import { getCartRow } from '@/lib/cart';
import { getCustomer } from '@/lib/auth';
import { createOrderFromCart, CheckoutError } from '@/lib/orders';
import { address, email, formToObject, phone, zodErrors, type FormState } from '@/lib/validators';

const schema = z.object({
  email, phone, name: z.string().trim().min(2, 'Enter your name'),
  ship: address.omit({ name: true, phone: true, gstin: true }),
  sameBilling: z.boolean(),
  bill: address.omit({ phone: true }).partial().optional(),
  gstin: z.string().trim().toUpperCase().optional(),
  note: z.string().trim().max(500).optional(),
  consent: z.literal(true, { errorMap: () => ({ message: 'Please accept the terms and privacy policy to continue.' }) }),
  marketing: z.boolean(),
});

export async function placeOrder(_: FormState, fd: FormData): Promise<FormState> {
  const o = formToObject(fd) as Record<string, string>;
  const input = {
    email: o.email, phone: o.phone, name: o.name,
    ship: { line1: o.line1, line2: o.line2 || undefined, city: o.city, state: o.state, pincode: o.pincode },
    sameBilling: o.sameBilling === 'on',
    bill: o.sameBilling === 'on' ? undefined : { name: o.billName, line1: o.billLine1, line2: o.billLine2 || undefined, city: o.billCity, state: o.billState, pincode: o.billPincode },
    gstin: o.gstin || undefined, note: o.note || undefined, consent: o.consent === 'on', marketing: o.marketing === 'on',
  };
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { errors: zodErrors(parsed.error), data: o };
  const d = parsed.data;
  if (d.gstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(d.gstin)) return { errors: { gstin: 'Enter a valid GSTIN' }, data: o };

  const pin = await db.query.pincodes.findFirst({ where: eq(pincodes.pincode, d.ship.pincode) });
  if (!pin || !pin.serviceable) return { errors: { 'ship.pincode': `We don't deliver to ${d.ship.pincode} yet.` }, data: o };

  if (!d.sameBilling) {
    const b = address.omit({ phone: true }).safeParse(d.bill ?? {});
    if (!b.success) return { errors: Object.fromEntries(Object.entries(zodErrors(b.error)).map(([k, v]) => [`bill.${k}`, v])), data: o };
  }
  const shipping = { name: d.name, phone: d.phone, ...d.ship };
  const billing = d.sameBilling ? { ...shipping, gstin: d.gstin } : { ...(d.bill as Required<NonNullable<typeof d.bill>>), phone: d.phone, gstin: d.gstin };

  const cart = await getCartRow(false);
  if (!cart) return { message: 'Your cart is empty.' };
  const customer = await getCustomer();
  let order;
  try {
    order = await createOrderFromCart({ cartId: cart.id, customerId: customer?.id, contact: { name: d.name, email: d.email, phone: d.phone }, shipping, billing, note: d.note, consent: true, marketing: d.marketing });
  } catch (e) {
    if (e instanceof CheckoutError) return { message: e.message, data: o };
    throw e;
  }
  redirect(`/checkout/pay/${order.number}?t=${order.accessToken}`);
}

/** Retry payment for an unpaid order (e.g. from the confirmation page after a failure). */
export async function retryPayment(number: string, token: string) {
  const o = await db.query.orders.findFirst({ where: eq(orders.number, number) });
  if (!o || o.accessToken !== token) redirect('/');
  redirect(`/checkout/pay/${o.number}?t=${o.accessToken}`);
}
