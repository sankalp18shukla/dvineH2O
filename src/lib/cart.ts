import 'server-only';
import { cookies } from 'next/headers';
import { and, eq } from 'drizzle-orm';
import { db } from './db';
import { carts, cartItems, cartEvents, products } from './db/schema';
import { randomToken } from './numbering';
import { computeTotals, type PriceLine } from './pricing';
import { priceCart } from './cart-pricing';
import { available } from './inventory';
import { getCustomer } from './auth';

export const CART_COOKIE = 'dvine_cart';

export async function getCartRow(create = false) {
  const jar = await cookies();
  const token = jar.get(CART_COOKIE)?.value;
  if (token) {
    const cart = await db.query.carts.findFirst({ where: eq(carts.token, token) });
    if (cart && (cart.status === 'active' || cart.status === 'checkout' || cart.status === 'abandoned')) return cart;
  }
  if (!create) return null;
  const t = randomToken();
  const [cart] = await db.insert(carts).values({ token: t }).returning();
  jar.set(CART_COOKIE, t, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 30 });
  return cart;
}

export async function loadCart() {
  const cart = await getCartRow(false);
  if (!cart) return { cart: null, items: [], totals: computeTotals([]), count: 0 };
  const rows = await db.query.cartItems.findMany({ where: eq(cartItems.cartId, cart.id), with: { product: true } });
  const items = rows.filter(r => r.product.status === 'active' && r.product.saleMode === 'cart');
  const lines: PriceLine[] = items.map(r => ({
    productId: r.productId, slug: r.product.slug, sku: r.product.sku, name: r.product.name, hsn: r.product.hsn,
    qty: r.qty, unitPrice: r.product.price, gstRate: r.product.gstRate,
  }));
  const totals = await priceCart(lines, cart.couponCode, (await getCustomer())?.id ?? null);
  return {
    cart, totals, count: items.reduce((s, i) => s + i.qty, 0),
    items: items.map(r => ({ id: r.id, qty: r.qty, product: r.product, available: r.product.buildToOrder ? 99 : available(r.product) })),
  };
}

export async function cartCount() {
  const cart = await getCartRow(false);
  if (!cart) return 0;
  const rows = await db.select({ qty: cartItems.qty }).from(cartItems).where(eq(cartItems.cartId, cart.id));
  return rows.reduce((s, r) => s + r.qty, 0);
}

export async function setItem(productId: number, qty: number, mode: 'add' | 'set') {
  const product = await db.query.products.findFirst({ where: eq(products.id, productId) });
  if (!product || product.status !== 'active' || product.saleMode !== 'cart') return { error: 'This product is not available to buy online.' };
  const cart = (await getCartRow(true))!;
  const existing = await db.query.cartItems.findFirst({ where: and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, productId)) });
  const target = Math.max(0, mode === 'add' ? (existing?.qty ?? 0) + qty : qty);
  const limit = Math.min(product.maxPerOrder, product.buildToOrder ? product.maxPerOrder : available(product));
  if (target > limit) return { error: limit <= 0 ? `${product.shortName} is out of stock right now.` : `You can add up to ${limit} ${product.shortName}.` };
  if (target === 0) {
    if (existing) await db.delete(cartItems).where(eq(cartItems.id, existing.id));
  } else if (existing) {
    await db.update(cartItems).set({ qty: target, unitPrice: product.price }).where(eq(cartItems.id, existing.id));
  } else {
    await db.insert(cartItems).values({ cartId: cart.id, productId, qty: target, unitPrice: product.price });
  }
  await db.insert(cartEvents).values({ cartId: cart.id, productId, action: target === 0 ? 'remove' : existing ? 'update' : 'add', qty: target });
  await db.update(carts).set({ lastActivityAt: new Date(), status: 'active' }).where(eq(carts.id, cart.id));
  return { ok: true };
}

export async function setCoupon(code: string | null) {
  const cart = await getCartRow(true);
  if (!cart) return;
  await db.update(carts).set({ couponCode: code ? code.trim().toUpperCase() : null, lastActivityAt: new Date() }).where(eq(carts.id, cart.id));
  await db.insert(cartEvents).values({ cartId: cart.id, action: 'coupon' });
}
