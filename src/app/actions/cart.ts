'use server';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { pincodes } from '@/lib/db/schema';
import { setItem, setCoupon, loadCart } from '@/lib/cart';
import { pincode as pincodeSchema } from '@/lib/validators';

export async function addToCart(productId: number, qty = 1) {
  const r = await setItem(productId, qty, 'add');
  revalidatePath('/', 'layout');
  return r;
}
export async function updateCartQty(productId: number, qty: number) {
  const r = await setItem(productId, qty, 'set');
  revalidatePath('/cart'); revalidatePath('/checkout');
  return r;
}
export async function applyCode(_: unknown, fd: FormData) {
  const code = String(fd.get('code') ?? '').trim();
  if (!code) return { error: 'Enter a code.' };
  await setCoupon(code);
  revalidatePath('/cart'); revalidatePath('/checkout');
  return { ok: true };
}
export async function removeCode() {
  await setCoupon(null);
  revalidatePath('/cart'); revalidatePath('/checkout');
}

export type PincodeResult = { ok: boolean; message: string; city?: string; days?: number; installation?: boolean; waterTesting?: boolean };
export async function checkPincode(pin: string): Promise<PincodeResult> {
  const p = pincodeSchema.safeParse(pin);
  if (!p.success) return { ok: false, message: 'Enter a valid 6-digit pincode.' };
  const row = await db.query.pincodes.findFirst({ where: eq(pincodes.pincode, p.data) });
  if (!row || !row.serviceable) return { ok: false, message: `We don't deliver to ${p.data} yet. Send us an enquiry and we'll check for you.` };
  const by = new Date(Date.now() + row.deliveryDays * 86400_000).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  return { ok: true, city: row.city, days: row.deliveryDays, installation: row.installation, waterTesting: row.waterTesting, message: `Delivers to ${row.city} by ${by}.` };
}

/** Lightweight cart snapshot for the cart drawer. */
export async function getCartSummary() {
  const { items, totals, count } = await loadCart();
  return {
    count, subtotal: totals.subtotal, discount: totals.discount, total: totals.total,
    items: items.map(i => ({ id: i.id, productId: i.product.id, slug: i.product.slug, name: i.product.name, image: i.product.images?.[0] ?? null, qty: i.qty, price: i.product.price })),
  };
}
export type CartSummary = Awaited<ReturnType<typeof getCartSummary>>;
