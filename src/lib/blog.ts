/**
 * Blog: shared shapes and labels (safe to import anywhere, client or server).
 * Posts live in dvine.posts and are written in Admin › Blog; queries are in blog.server.ts.
 */
export const CATEGORIES = [
  { key: 'benefits', label: 'Benefits', blurb: 'What the water does, and what the research can and cannot tell us.' },
  { key: 'value', label: 'Price and value', blurb: 'What goes into each product, and what its price covers.' },
  { key: 'case-study', label: 'Case studies', blurb: 'Real water problems and what changed after a DVINE system went in.' },
  { key: 'hydration', label: 'Hydration', blurb: 'Everyday drinking habits for you and your family.' },
  { key: 'guide', label: 'Guides', blurb: 'Choosing, installing and caring for your system.' },
  { key: 'news', label: 'News', blurb: 'From DVINE H2O.' },
] as const;
export type Category = (typeof CATEGORIES)[number]['key'];
export const CATEGORY_KEYS = CATEGORIES.map(c => c.key) as [Category, ...Category[]];
export const categoryLabel = (k: string) => CATEGORIES.find(c => c.key === k)?.label ?? 'Blog';

export const POST_PRODUCTS = [
  { key: 'crystal', label: 'Crystal', page: '/home-water-systems', tone: 'glacier' },
  { key: 'hyper', label: 'Hyper', page: '/hydrogen-bottles', tone: 'flash' },
  { key: 'titan', label: 'Titan 111', page: '/for-business', tone: 'volt' },
] as const;
export type PostProduct = (typeof POST_PRODUCTS)[number]['key'];

export type Post = {
  id: number; slug: string; title: string; excerpt: string; category: Category; product: PostProduct | null;
  coverImage: string | null; coverAlt: string | null; body: string; externalUrl: string | null; source: string | null;
  author: string; seoDescription: string | null; featured: boolean; status: 'draft' | 'published';
  publishedAt: Date | null; updatedAt: Date;
};

/** Where a post's card leads: its own page, or the site it was published on. */
export const postHref = (p: Pick<Post, 'slug' | 'externalUrl'>) => p.externalUrl || `/blog/${p.slug}`;
export const readMinutes = (body: string) => Math.max(1, Math.round(body.trim().split(/\s+/).length / 220));
export const postDate = (d: Date | null) => (d ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' }) : '');
export const slugify = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90).replace(/-+$/, '');

/** Only links a post may carry: our own pages, https sites, mail and phone. Anything else is dropped to "#". */
export const safeHref = (h: string) => (/^(https:\/\/|\/(?!\/)|#|mailto:|tel:)/i.test(h.trim()) ? h.trim() : '#');
/** Only images from the site itself or an https host. */
export const safeSrc = (s: string) => (/^(https:\/\/|\/(?!\/))/i.test(s.trim()) ? s.trim() : '');
