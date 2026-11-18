import 'server-only';
import { cache } from 'react';
import { and, desc, eq, ne } from 'drizzle-orm';
import { db } from './db';
import { posts } from './db/schema';
import { SEED_POSTS } from './blog-seed';
import type { Category, Post, PostProduct } from './blog';

const newest = (a: Post, b: Post) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0);

/** Every published post, newest first. Without a database (frontend-only preview) the seed posts stand in. */
export const getPublishedPosts = cache(async (): Promise<Post[]> => {
  try {
    return await db.select().from(posts).where(eq(posts.status, 'published')).orderBy(desc(posts.publishedAt), desc(posts.id)) as Post[];
  } catch (e) {
    console.warn('[blog] database unavailable, using seed posts:', (e as Error).message);
    return [...SEED_POSTS].sort(newest);
  }
});

export async function getPost(slug: string): Promise<Post | null> {
  return (await getPublishedPosts()).find(p => p.slug === slug && !p.externalUrl) ?? null;
}

/** Other posts to offer under an article: same product or category first, then the newest. */
export async function getRelated(post: Post, limit = 3) {
  const rest = (await getPublishedPosts()).filter(p => p.id !== post.id && !p.externalUrl);
  const score = (p: Post) => (post.product && p.product === post.product ? 2 : 0) + (p.category === post.category ? 1 : 0);
  return rest.sort((a, b) => score(b) - score(a) || newest(a, b)).slice(0, limit);
}

/**
 * What a product page shows: `price` is the post behind "Why this price?" (category "value" for that product),
 * `reads` are the rows in its "Worth reading" strip.
 */
export async function getProductReads(product: PostProduct, limit = 3) {
  const all = (await getPublishedPosts()).filter(p => !p.externalUrl);
  const mine = all.filter(p => p.product === product);
  const price = mine.find(p => p.category === 'value') ?? null;
  const general = all.filter(p => !p.product && (p.category === 'benefits' || p.category === 'case-study'));
  return { price, reads: [...mine, ...general].slice(0, limit) };
}

/* ───────────── Admin ───────────── */
export async function adminListPosts(f: { status?: 'draft' | 'published'; category?: Category }) {
  return db.select().from(posts).where(and(f.status && eq(posts.status, f.status), f.category && eq(posts.category, f.category))).orderBy(desc(posts.updatedAt)) as Promise<Post[]>;
}
export async function adminGetPost(id: number) {
  return (await db.query.posts.findFirst({ where: eq(posts.id, id) }) ?? null) as Post | null;
}
export async function slugTaken(slug: string, exceptId?: number) {
  return !!(await db.query.posts.findFirst({ where: and(eq(posts.slug, slug), exceptId ? ne(posts.id, exceptId) : undefined), columns: { id: true } }));
}
