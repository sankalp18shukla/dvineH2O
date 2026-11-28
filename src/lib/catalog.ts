import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { cache } from 'react';
import { db } from './db';
import { products, reviews, customers, testOptions } from './db/schema';
import { available, stockState } from './inventory';
import { SEED_PRODUCTS, SEED_TESTS } from './seed-data';
import { PRODUCT_FIELDS, PRODUCT_UPDATES, TEST_UPDATES, previewUpdate } from './catalog-update';

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

/** Local preview of the pending catalogue update (src/lib/catalog-update.ts); a no-op unless PREVIEW_CATALOG_UPDATE=1 in dev. */
const preview = (p: Row): Row => (previewUpdate() ? { ...p, ...PRODUCT_UPDATES[p.slug], ...PRODUCT_FIELDS[p.slug] } : p);

export const getProduct = cache(async (slug: string) => {
  try {
    const row = await db.query.products.findFirst({ where: eq(products.slug, slug) });
    if (!row) return null;
    // DVINE's manual PDF (public/docs/manuals) until one is set in Admin › Products
    const p = { ...preview(row), manualUrl: row.manualUrl ?? SEED_PRODUCTS.find(x => x.slug === slug)?.manualUrl ?? null };
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
    if (!previewUpdate()) return await db.query.testOptions.findMany({ where: eq(testOptions.active, true), orderBy: asc(testOptions.sort) });
    const all = await db.query.testOptions.findMany({ orderBy: asc(testOptions.sort) });
    return all.map(t => ({ ...t, ...TEST_UPDATES.find(u => u.name === t.name) })).filter(t => t.active);
  } catch {
    return SEED_TESTS.map((t, i) => ({ id: i + 1, summary: null, price: 0, active: true, sort: i, ...t }));
  }
}

export async function getReviews(productId: number, limit = 6) {
  return db.select({ id: reviews.id, rating: reviews.rating, title: reviews.title, body: reviews.body, media: reviews.media, verified: reviews.verified, createdAt: reviews.createdAt, name: customers.name })
    .from(reviews).innerJoin(customers, eq(customers.id, reviews.customerId))
    .where(and(eq(reviews.productId, productId), eq(reviews.status, 'approved'))).orderBy(desc(reviews.createdAt)).limit(limit).catch(() => []);
}
/** Approved reviews of every product, newest first, for the homepage: first name, city, product, date, verified. */
export async function getHomeReviews(limit = 30) {
  return db.select({ id: reviews.id, rating: reviews.rating, body: reviews.body, verified: reviews.verified, createdAt: reviews.createdAt, name: customers.name, city: customers.city, product: products.slug })
    .from(reviews).innerJoin(customers, eq(customers.id, reviews.customerId)).innerJoin(products, eq(products.id, reviews.productId))
    .where(eq(reviews.status, 'approved')).orderBy(desc(reviews.createdAt)).limit(limit).catch(() => []);
}
export type Product = NonNullable<Awaited<ReturnType<typeof getProduct>>>;
