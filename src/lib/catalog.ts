import { and, desc, eq, sql } from 'drizzle-orm';
import { cache } from 'react';
import { db } from './db';
import { products, reviews, customers } from './db/schema';
import { available, stockState } from './inventory';

export const getProduct = cache(async (slug: string) => {
  const p = await db.query.products.findFirst({ where: eq(products.slug, slug) });
  if (!p) return null;
  const [stats] = await db.select({ n: sql<number>`count(*)`, avg: sql<number>`coalesce(avg(${reviews.rating}),0)` }).from(reviews).where(and(eq(reviews.productId, p.id), eq(reviews.status, 'approved')));
  return { ...p, available: p.buildToOrder ? p.maxPerOrder : available(p), stock: stockState(p), reviewCount: Number(stats.n), rating: Number(stats.avg) };
});

export async function getReviews(productId: number, limit = 6) {
  return db.select({ id: reviews.id, rating: reviews.rating, title: reviews.title, body: reviews.body, media: reviews.media, verified: reviews.verified, createdAt: reviews.createdAt, name: customers.name })
    .from(reviews).innerJoin(customers, eq(customers.id, reviews.customerId))
    .where(and(eq(reviews.productId, productId), eq(reviews.status, 'approved'))).orderBy(desc(reviews.createdAt)).limit(limit);
}
export type Product = NonNullable<Awaited<ReturnType<typeof getProduct>>>;
