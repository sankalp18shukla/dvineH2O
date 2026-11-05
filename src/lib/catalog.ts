import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { cache } from 'react';
import { db } from './db';
import { products, reviews, customers, testOptions } from './db/schema';
import { available, stockState } from './inventory';
import { SEED_PRODUCTS, SEED_TESTS } from './seed-data';

type Row = typeof products.$inferSelect;
/** A seed SKU shaped like a database row, for when there is no database (frontend-only preview). */
function seedProduct(slug: string): Row | null {
  const i = SEED_PRODUCTS.findIndex(x => x.slug === slug);
  if (i < 0) return null;
  const now = new Date(0);
  return {
    id: i + 1, saleMode: 'cart', status: 'active', mrp: 0, price: 0, priceConfirmed: false, gstRate: 1800, hsn: null, quoteNote: null,
    onHand: 0, reserved: 0, reorderLevel: 5, buildToOrder: false, trackSerials: false, requiresInstallation: false, warrantyMonths: 12,
    maxPerOrder: 10, tagline: null, description: null, specs: null, boxContents: null, images: null, brochureUrl: null, manualUrl: null,
    videoUrl: null, createdAt: now, updatedAt: now, ...SEED_PRODUCTS[i],
  } as Row;
}

const withStock = (p: Row, n: number, avg: number) =>
  ({ ...p, available: p.buildToOrder ? p.maxPerOrder : available(p), stock: stockState(p), reviewCount: n, rating: avg });

export const getProduct = cache(async (slug: string) => {
  try {
    const p = await db.query.products.findFirst({ where: eq(products.slug, slug) });
    if (!p) return null;
    const [stats] = await db.select({ n: sql<number>`count(*)`, avg: sql<number>`coalesce(avg(${reviews.rating}),0)` }).from(reviews).where(and(eq(reviews.productId, p.id), eq(reviews.status, 'approved')));
    return withStock(p, Number(stats.n), Number(stats.avg));
  } catch (e) {
    // no database reachable (preview deploy without DATABASE_URL): show the seed catalogue rather than crash
    console.warn('[catalog] database unavailable, using seed product:', (e as Error).message);
    const p = seedProduct(slug);
    return p && withStock(p, 0, 0);
  }
});

/** Active water-test options, or the seed list when there is no database. */
export async function getTestOptions() {
  try {
    return await db.query.testOptions.findMany({ where: eq(testOptions.active, true), orderBy: asc(testOptions.sort) });
  } catch {
    return SEED_TESTS.map((t, i) => ({ id: i + 1, summary: null, price: 0, active: true, sort: i, ...t }));
  }
}

export async function getReviews(productId: number, limit = 6) {
  return db.select({ id: reviews.id, rating: reviews.rating, title: reviews.title, body: reviews.body, media: reviews.media, verified: reviews.verified, createdAt: reviews.createdAt, name: customers.name })
    .from(reviews).innerJoin(customers, eq(customers.id, reviews.customerId))
    .where(and(eq(reviews.productId, productId), eq(reviews.status, 'approved'))).orderBy(desc(reviews.createdAt)).limit(limit).catch(() => []);
}
export type Product = NonNullable<Awaited<ReturnType<typeof getProduct>>>;
