'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { and, eq, ne } from 'drizzle-orm';
import { db } from '@/lib/db';
import { posts } from '@/lib/db/schema';
import { requireStaff } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { CATEGORY_KEYS, safeSrc, slugify } from '@/lib/blog';
import { slugTaken } from '@/lib/blog.server';

export type PostResult = { ok: boolean; message: string; id?: number; slug?: string; errors?: Record<string, string> };

const str = (max: number) => z.string().trim().max(max);
const PostInput = z.object({
  id: z.number().int().positive().optional(),
  title: str(160).min(3, 'Give the post a title'),
  slug: str(90),
  excerpt: str(400),
  category: z.enum(CATEGORY_KEYS),
  product: z.enum(['crystal', 'hyper', 'titan']).nullable(),
  coverImage: str(500),
  coverAlt: str(200),
  body: z.string().max(60000, 'This post is too long'),
  external: z.boolean(),
  externalUrl: str(500),
  source: str(80),
  author: str(80),
  seoDescription: str(200),
  featured: z.boolean(),
  featureOrder: z.number().int().min(0).max(4),
  publishedAt: z.string().max(40),
  status: z.enum(['draft', 'published']),
});

/** Creates or updates a post from the editor in Admin › Blog. Publishing checks the post is complete. */
export async function savePost(json: string): Promise<PostResult> {
  const s = await requireStaff('content');
  let raw: unknown;
  try { raw = JSON.parse(json); } catch { return { ok: false, message: 'Could not read the post. Reload and try again.' }; }
  const p = PostInput.safeParse(raw);
  if (!p.success) {
    const errors: Record<string, string> = {};
    for (const i of p.error.issues) errors[String(i.path[0])] ??= i.message;
    return { ok: false, message: Object.values(errors)[0] ?? 'Check the highlighted fields.', errors };
  }
  const d = p.data;
  const errors: Record<string, string> = {};
  const slug = slugify(d.slug || d.title);
  if (!slug) errors.slug = 'The web address needs letters or numbers';
  if (d.external && !/^https:\/\/[^\s]+\.[^\s]+$/.test(d.externalUrl)) errors.externalUrl = 'Paste the full link, starting with https://';
  if (d.coverImage && !safeSrc(d.coverImage)) errors.coverImage = 'Use an uploaded photo or an https link';
  if (d.status === 'published') {
    if (!d.excerpt) errors.excerpt = 'Add a short summary before publishing';
    if (!d.external && d.body.trim().length < 200) errors.body = 'Write the article before publishing (a few paragraphs at least)';
  }
  const when = d.publishedAt ? new Date(d.publishedAt) : null;
  if (when && Number.isNaN(when.getTime())) errors.publishedAt = 'That date is not valid';
  if (!errors.slug && await slugTaken(slug, d.id)) errors.slug = 'Another post already uses this web address';
  if (Object.keys(errors).length) return { ok: false, message: Object.values(errors)[0], errors };

  const before = d.id ? await db.query.posts.findFirst({ where: eq(posts.id, d.id) }) : null;
  if (d.id && !before) return { ok: false, message: 'This post no longer exists.' };
  const values = {
    title: d.title, slug, excerpt: d.excerpt, category: d.category, product: d.product,
    coverImage: d.coverImage || null, coverAlt: d.coverAlt || null,
    body: d.external ? '' : d.body.replace(/\r\n?/g, '\n'),
    externalUrl: d.external ? d.externalUrl : null, source: d.external ? d.source || new URL(d.externalUrl).hostname.replace(/^www\./, '') : null,
    author: d.author || 'DVINE H2O editorial team', seoDescription: d.seoDescription || null, featured: d.featureOrder > 0 && !d.external, status: d.status,
    publishedAt: d.status === 'published' ? (when ?? before?.publishedAt ?? new Date()) : when,
  };
  try {
    let id = d.id;
    if (id) await db.update(posts).set(values).where(eq(posts.id, id));
    else [{ id }] = await db.insert(posts).values({ ...values, createdBy: s.id }).returning({ id: posts.id });
    // homepage tiles: four slots at most. Taking a slot frees it from whichever post held it; slot 1 also leads the blog.
    const slot = d.external ? 0 : d.featureOrder;
    try {
      if (slot) await db.update(posts).set({ featureOrder: 0, featured: false }).where(and(eq(posts.featureOrder, slot), ne(posts.id, id!)));
      await db.update(posts).set({ featureOrder: slot }).where(eq(posts.id, id!));
    } catch (e) { if (slot) throw e; /* feature_order column not migrated yet: nothing to order */ }
    const went = before?.status !== d.status ? (d.status === 'published' ? 'publish' : before ? 'unpublish' : 'create') : before ? 'update' : 'create';
    await audit(s.id, `post.${went}`, 'post', id!, { slug, title: d.title });
    revalidatePath('/blog', 'layout');
    return {
      ok: true, id, slug,
      message: went === 'publish' ? 'Published. The post is live on the website.' : went === 'unpublish' ? 'Moved back to drafts. It is no longer on the website.' : d.status === 'published' ? 'Saved. The changes are live.' : 'Draft saved. Only staff can see it.',
    };
  } catch (e) {
    console.error('[blog] save', e);
    return { ok: false, message: 'Could not save the post. Try again.' };
  }
}

export async function deletePost(id: number): Promise<PostResult> {
  const s = await requireStaff('content');
  const row = await db.query.posts.findFirst({ where: eq(posts.id, Number(id)) });
  if (!row) return { ok: false, message: 'This post no longer exists.' };
  await db.delete(posts).where(eq(posts.id, row.id));
  await audit(s.id, 'post.delete', 'post', row.id, { slug: row.slug, title: row.title });
  revalidatePath('/blog', 'layout');
  return { ok: true, message: 'Post deleted.' };
}
