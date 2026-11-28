import 'server-only';
import { cache } from 'react';
import { and, desc, eq, getTableColumns, gt, inArray, ne } from 'drizzle-orm';
import { db } from './db';
import { posts } from './db/schema';
import { SEED_POSTS } from './blog-seed';
import { FEATURED_SLUGS, NEW_POSTS, previewUpdate } from './catalog-update';
import type { Category, Post, PostProduct } from './blog';

const newest = (a: Post, b: Post) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0);

/** Every column but feature_order, which is read on its own (withOrder) so the blog keeps working on a database
 *  where migration 20261126000001 hasn't run yet. */
const { featureOrder: _skip, ...COLS } = getTableColumns(posts);
void _skip;

/** Adds each post's homepage slot; every post reads 0 until the feature_order column exists. */
async function withOrder(rows: Omit<Post, 'featureOrder'>[]): Promise<Post[]> {
  const order = new Map<number, number>();
  try {
    if (rows.length) for (const r of await db.select({ id: posts.id, o: posts.featureOrder }).from(posts).where(and(gt(posts.featureOrder, 0), inArray(posts.id, rows.map(r => r.id))))) order.set(r.id, r.o);
  } catch { /* column not there yet */ }
  return rows.map(r => ({ ...r, featureOrder: order.get(r.id) ?? 0 }));
}

/** Local preview of the pending articles and homepage tiles (src/lib/catalog-update.ts), dev server only. */
function preview(list: Post[]): Post[] {
  if (!previewUpdate()) return list;
  const at = (d: string) => new Date(`${d}T04:30:00.000Z`);
  const added = NEW_POSTS.filter(n => !list.some(p => p.slug === n.slug)).map((n, i): Post => ({
    ...n, id: -1 - i, externalUrl: null, source: null, author: 'DVINE H2O editorial team', seoDescription: null, featured: false, featureOrder: 0,
    status: 'published', publishedAt: at(n.published), updatedAt: at(n.published),
  }));
  return [...list, ...added].map(p => {
    const k = FEATURED_SLUGS.indexOf(p.slug);
    return { ...p, featureOrder: k + 1, featured: k >= 0 };
  }).sort(newest);
}

/** Every published post, newest first. Without a database (frontend-only preview) the seed posts stand in. */
export const getPublishedPosts = cache(async (): Promise<Post[]> => {
  try {
    const rows = await db.select(COLS).from(posts).where(eq(posts.status, 'published')).orderBy(desc(posts.publishedAt), desc(posts.id));
    return preview(await withOrder(rows as Omit<Post, 'featureOrder'>[]));
  } catch (e) {
    console.warn('[blog] database unavailable, using seed posts:', (e as Error).message);
    return preview([...SEED_POSTS].sort(newest));
  }
});

/** The homepage's four tiles: featured posts in their chosen order, topped up with the newest guides if fewer are set. */
export async function getHomePosts(limit = 4): Promise<Post[]> {
  const all = await getPublishedPosts();
  const picked = all.filter(p => p.featureOrder > 0).sort((a, b) => a.featureOrder - b.featureOrder).slice(0, limit);
  const rest = all.filter(p => !picked.includes(p) && !p.externalUrl);
  return [...picked, ...rest].slice(0, limit);
}

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
  const rows = await db.select(COLS).from(posts).where(and(f.status && eq(posts.status, f.status), f.category && eq(posts.category, f.category))).orderBy(desc(posts.updatedAt));
  return withOrder(rows as Omit<Post, 'featureOrder'>[]);
}
export async function adminGetPost(id: number) {
  const [row] = await db.select(COLS).from(posts).where(eq(posts.id, id)).limit(1);
  return row ? (await withOrder([row as Omit<Post, 'featureOrder'>]))[0] : null;
}
export async function slugTaken(slug: string, exceptId?: number) {
  return !!(await db.query.posts.findFirst({ where: and(eq(posts.slug, slug), exceptId ? ne(posts.id, exceptId) : undefined), columns: { id: true } }));
}
