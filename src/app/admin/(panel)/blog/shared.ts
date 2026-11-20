import fs from 'node:fs/promises';
import path from 'node:path';
import type { Post } from '@/lib/blog';
import type { PostDraft } from '@/components/admin/PostEditor';

/** The site's own photos, offered in the media library next to the uploads. */
export async function siteImages() {
  const dir = path.join(process.cwd(), 'public', 'images');
  // product photos live in folders (images/hyper, images/crystal); the bottle's assembly parts are not photos
  const names = await fs.readdir(dir, { recursive: true }).catch(() => [] as string[]);
  return names.map(n => n.split(path.sep).join('/')).filter(n => /\.(png|jpe?g|webp|avif)$/i.test(n) && !n.includes('/parts/'))
    .map(n => `/images/${n}`);
}

export const BLANK: PostDraft = {
  title: '', slug: '', excerpt: '', category: 'benefits', product: null, coverImage: '', coverAlt: '', body: '', external: false,
  externalUrl: '', source: '', author: 'DVINE H2O editorial team', seoDescription: '', featured: false, publishedAt: '', status: 'draft',
};

export const toDraft = (p: Post): PostDraft => ({
  id: p.id, title: p.title, slug: p.slug, excerpt: p.excerpt, category: p.category, product: p.product, coverImage: p.coverImage ?? '', coverAlt: p.coverAlt ?? '',
  body: p.body, external: !!p.externalUrl, externalUrl: p.externalUrl ?? '', source: p.source ?? '', author: p.author, seoDescription: p.seoDescription ?? '',
  featured: p.featured, publishedAt: p.publishedAt?.toISOString() ?? '', status: p.status,
});
